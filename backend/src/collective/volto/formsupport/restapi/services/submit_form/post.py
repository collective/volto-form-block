from collective.volto.formsupport import _
from collective.volto.formsupport.interfaces import ICaptchaSupport
from collective.volto.formsupport.interfaces import IFormAction
from collective.volto.formsupport.interfaces import IPostEvent
from collective.volto.formsupport.interfaces import FormActionContext
from collective.volto.formsupport.utils import get_blocks
from collective.volto.formsupport.utils import validate_email_token
from copy import deepcopy
from plone import api

from plone.protect.interfaces import IDisableCSRFProtection
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from plone.schema.email import _isemail
from zExceptions import BadRequest
from zope.component import getAdapter
from zope.component import getMultiAdapter
from zope.event import notify
from zope.i18n import translate
from zope.interface import alsoProvides
from zope.interface import implementer

import json
import jsonschema
import logging
import math
import os


logger = logging.getLogger(__name__)


@implementer(IPostEvent)
class PostEventService:
    def __init__(self, context, data):
        self.context = context
        self.data = data


class SubmitPost(Service):
    def __init__(self, context, request):
        super().__init__(context, request)

        self.block = {}
        self.form_data = self.cleanup_data()
        self.block_id = self.form_data.get("block_id", "")
        if self.block_id:
            self.block = self.get_block_data(block_id=self.block_id)

    def reply(self):
        self.validate_form()

        if self.block.get("@type") == "form":
            actions = []
            if self.block.get("send", False):
                actions.append({**self.block, "type": "email"})
            if self.block.get("store", False):
                actions.append({**self.block, "type": "store"})
        else:
            actions = self.block.get("formActions", [])

        # Disable CSRF protection
        alsoProvides(self.request, IDisableCSRFProtection)

        notify(PostEventService(self.context, self.form_data))

        for action in actions:
            action_context = FormActionContext(
                context=self.context,
                request=self.request,
                action=action,
                block=self.block,
                data=self.form_data,
            )
            adapter = getAdapter(action_context, IFormAction, name=action["type"])
            try:
                adapter()
            except BadRequest:
                raise
            except Exception as err:
                logger.exception(err)
                message = translate(
                    _(
                        "form_action_exception",
                        default="Unable to process form. Please retry later or contact site administrator.",  # noqa: E501
                    ),
                    context=self.request,
                )
                self.request.response.setStatus(500)
                return {"type": "InternalServerError", "message": message}

        return {"data": self.form_data.get("data", [])}

    def cleanup_data(self):
        """
        Avoid XSS injections and other attacks.

        - cleanup HTML with plone transform
        - remove from data, fields not defined in form schema
        """
        form_data = json_body(self.request)
        fixed_fields = []
        transforms = api.portal.get_tool(name="portal_transforms")

        block = self.get_block_data(block_id=form_data.get("block_id", ""))

        if block["@type"] == "form":
            block_fields = [x.get("field_id", "") for x in block.get("subblocks", [])]
            # cleanup form data if it's a form block
            for form_field in form_data.get("data", []):
                if form_field.get("field_id", "") not in block_fields:
                    # unknown field, skip it
                    continue
                new_field = deepcopy(form_field)
                value = new_field.get("value", "")
                if isinstance(value, str):
                    stream = transforms.convertTo(
                        "text/plain", value, mimetype="text/html"
                    )
                    new_field["value"] = stream.getData().strip()
                fixed_fields.append(new_field)
            form_data["data"] = fixed_fields

        # TODO: cleanup form data if it's a schemaForm block
        return form_data

    def validate_form(self):
        """
        check all required fields and parameters
        """
        if not self.block_id:
            raise BadRequest(
                translate(
                    _("missing_blockid_label", default="Missing block_id"),
                    context=self.request,
                )
            )
        if not self.block:
            raise BadRequest(
                translate(
                    _(
                        "block_form_not_found_label",
                        default='Block with @type "form" and id "$block" not found in this context: $context',  # noqa: E501
                        mapping={
                            "block": self.block_id,
                            "context": self.context.absolute_url(),
                        },
                    ),
                    context=self.request,
                ),
            )

        if not self.block.get("store", False) and not self.block.get("send", []):
            raise BadRequest(
                translate(
                    _(
                        "missing_action",
                        default='You need to set at least one form action between "send" and "store".',  # noqa: E501
                    ),
                    context=self.request,
                )
            )

        if not self.form_data.get("data", []):
            raise BadRequest(
                translate(
                    _(
                        "empty_form_data",
                        default="Empty form data.",
                    ),
                    context=self.request,
                )
            )

        self.validate_schema()
        self.validate_attachments()
        if self.block.get("captcha", False):
            getMultiAdapter(
                (self.context, self.request),
                ICaptchaSupport,
                name=self.block["captcha"],
            ).verify(
                self.form_data.get("captcha")
                or self.form_data["data"].get("captchaWidget")
            )

        self.validate_email_fields()
        self.validate_bcc()

    def validate_schema(self):
        if self.block["@type"] != "schemaForm":
            return
        validator = jsonschema.Draft202012Validator(self.block["schema"])
        errors = []
        for err in validator.iter_errors(self.form_data["data"]):
            error = {
                "message": err.message
            }
            if err.path:
                error["field"] = ".".join(err.path)
            errors.append(error)
        if errors:
            raise BadRequest(json.dumps(errors))

    def validate_email_fields(self):
        # TODO: validate email fields for schemaForm block
        if self.block["@type"] == "schemaForm":
            return
        email_fields = [
            x.get("field_id", "")
            for x in self.block.get("subblocks", [])
            if x.get("field_type", "") == "from"
        ]
        for form_field in self.form_data.get("data", []):
            if form_field.get("field_id", "") not in email_fields:
                continue
            if _isemail(form_field.get("value", "")) is None:
                raise BadRequest(
                    translate(
                        _(
                            "wrong_email",
                            default='Email not valid in "${field}" field.',
                            mapping={
                                "field": form_field.get("label", ""),
                            },
                        ),
                        context=self.request,
                    )
                )

    def validate_attachments(self):
        attachments_limit = os.environ.get("FORM_ATTACHMENTS_LIMIT", "")
        if not attachments_limit:
            return
        attachments = self.form_data.get("attachments", {})
        attachments_len = 0
        for attachment in attachments.values():
            data = attachment.get("data", "")
            attachments_len += (len(data) * 3) / 4 - data.count("=", -2)
        if attachments_len > float(attachments_limit) * pow(1024, 2):
            size_name = ("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
            i = int(math.floor(math.log(attachments_len, 1024)))
            p = math.pow(1024, i)
            s = round(attachments_len / p, 2)
            uploaded_str = f"{s} {size_name[i]}"
            raise BadRequest(
                translate(
                    _(
                        "attachments_too_big",
                        default="Attachments too big. You uploaded ${uploaded_str},"
                        " but limit is ${max} MB. Try to compress files.",
                        mapping={
                            "max": attachments_limit,
                            "uploaded_str": uploaded_str,
                        },
                    ),
                    context=self.request,
                )
            )

    def validate_bcc(self):
        # TODO: validate email fields for schemaForm block
        if self.block["@type"] == "schemaForm":
            return

        bcc_fields = []
        for field in self.block.get("subblocks", []):
            if field.get("use_as_bcc", False):
                field_id = field.get("field_id", "")
                if field_id not in bcc_fields:
                    bcc_fields.append(field_id)

        for data in self.form_data.get("data", []):
            value = data.get("value", "")
            if not value:
                continue

            if data.get("field_id", "") in bcc_fields:
                if not validate_email_token(
                    self.form_data.get("block_id", ""), data["value"], data["otp"]
                ):
                    raise BadRequest(
                        _("{email}'s OTP is wrong").format(email=data["value"])
                    )

    def get_block_data(self, block_id):
        blocks = get_blocks(self.context)
        if not blocks:
            return {}
        for id_, block in blocks.items():
            if id_ != block_id:
                continue
            block_type = block.get("@type", "")
            if not (block_type == "form" or block_type == "schemaForm"):
                continue
            return block
        return {}
