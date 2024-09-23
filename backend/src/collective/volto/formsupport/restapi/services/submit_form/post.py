from collective.volto.formsupport import _
from collective.volto.formsupport.interfaces import FormSubmissionContext
from collective.volto.formsupport.interfaces import ICaptchaSupport
from collective.volto.formsupport.interfaces import IFormSubmissionProcessor
from collective.volto.formsupport.interfaces import IPostEvent
from collective.volto.formsupport.utils import get_blocks
from plone.protect.interfaces import IDisableCSRFProtection
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from zExceptions import BadRequest
from zope.component import getMultiAdapter
from zope.component import subscribers
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
    def reply(self):
        self.body = json_body(self.request)
        self.block = {}
        self.block_id = self.body.get("block_id", "")
        if self.block_id:
            self.block = self.get_block_data(block_id=self.block_id)
        self.form_data = self.cleanup_data()

        self.validate_form()

        # Disable CSRF protection
        alsoProvides(self.request, IDisableCSRFProtection)

        notify(PostEventService(self.context, self.body))

        form_submission_context = FormSubmissionContext(
            context=self.context,
            request=self.request,
            block=self.block,
            form_data=self.form_data,
            attachments=self.body.get("attachments", {}),
        )
        for handler in sorted(
            subscribers((form_submission_context,), IFormSubmissionProcessor),
            key=lambda h: h.order,
        ):
            try:
                handler()
            except BadRequest:
                raise
            except Exception as err:
                logger.exception(err)
                message = translate(
                    _(
                        "form_action_exception",
                        default="Unable to process form. "
                        "Please retry later or contact site administrator.",
                    ),
                    context=self.request,
                )
                self.request.response.setStatus(500)
                return {"type": "InternalServerError", "message": message}

        return {"data": self.form_data}

    def cleanup_data(self):
        """Ignore fields not defined in form schema"""
        schema = self.block.get("schema", {})
        form_data = self.body.get("data", {})
        if not isinstance(form_data, dict):
            raise BadRequest(translate(
                    _(
                        "invalid_form_data",
                        default="Invalid form data.",
                    ),
                    context=self.request,
                )
            )
        form_data = {
            k: v for k, v in form_data.items() if k in schema.get("properties", {})
        }
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
                        default='Block with @type "schemaForm" and id "$block" not found in this context: $context',  # noqa: E501
                        mapping={
                            "block": self.block_id,
                            "context": self.context.absolute_url(),
                        },
                    ),
                    context=self.request,
                ),
            )
        if not self.form_data:
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
            ).verify(self.body.get("captcha"))

    def validate_schema(self):
        validator = jsonschema.Draft202012Validator(self.block.get("schema", {}))
        errors = []
        for err in validator.iter_errors(self.form_data):
            error = {"message": err.message}
            if err.path:
                error["field"] = ".".join(err.path)
            errors.append(error)
        if errors:
            raise BadRequest(json.dumps(errors))

    def validate_attachments(self):
        # TODO handle schemaForm attachments
        attachments_limit = os.environ.get("FORM_ATTACHMENTS_LIMIT", "")
        if not attachments_limit:
            return
        attachments = self.body.get("attachments", {})
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

    def get_block_data(self, block_id):
        blocks = get_blocks(self.context)
        if not blocks:
            return {}
        for id_, block in blocks.items():
            if id_ != block_id:
                continue
            block_type = block.get("@type", "")
            if block_type != "schemaForm":
                continue
            return block
        return {}
