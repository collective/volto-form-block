from bs4 import BeautifulSoup
from collective.volto.formsupport import _
from collective.volto.formsupport.interfaces import ICaptchaSupport
from collective.volto.formsupport.interfaces import IFormDataStore
from collective.volto.formsupport.interfaces import IPostEvent
from collective.volto.formsupport.utils import get_blocks
from collective.volto.formsupport.utils import validate_email_token
from copy import deepcopy
from datetime import datetime
from email import policy
from email.message import EmailMessage
from io import BytesIO
from plone import api


try:
    from plone.base.interfaces.controlpanel import IMailSchema
except ImportError:
    from Products.CMFPlone.interfaces.controlpanel import IMailSchema

from plone.protect.interfaces import IDisableCSRFProtection
from plone.registry.interfaces import IRegistry
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from plone.schema.email import _isemail
from xml.etree.ElementTree import Element
from xml.etree.ElementTree import ElementTree
from xml.etree.ElementTree import SubElement
from zExceptions import BadRequest
from zope.component import getMultiAdapter
from zope.component import getUtility
from zope.event import notify
from zope.i18n import translate
from zope.interface import alsoProvides
from zope.interface import implementer

import codecs
import logging
import math
import os
import re


logger = logging.getLogger(__name__)
CTE = os.environ.get("MAIL_CONTENT_TRANSFER_ENCODING", None)


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

        store_action = self.block.get("store", False)
        send_action = self.block.get("send", [])

        # Disable CSRF protection
        alsoProvides(self.request, IDisableCSRFProtection)

        notify(PostEventService(self.context, self.form_data))

        if send_action:
            try:
                self.send_data()
            except BadRequest as e:
                raise e
            except Exception as e:
                logger.exception(e)
                message = translate(
                    _(
                        "mail_send_exception",
                        default="Unable to send confirm email. Please retry later or contact site administrator.",  # noqa: E501
                    ),
                    context=self.request,
                )
                self.request.response.setStatus(500)
                return {"type": "InternalServerError", "message": message}
        if store_action:
            self.store_data()

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

    def get_reply_to(self):
        """This method retrieves the 'reply to' email address.

        Three "levels" of logic:
        1. If there is a field marked with 'use_as_reply_to' set to True, that
           field wins and we use that.
           If not:
        2. We search for the "from" field.
           If not present:
        3. We use the fallback field: "default_from"
        """

        subblocks = self.block.get("subblocks", "")
        if subblocks:
            for field in subblocks:
                if field.get("use_as_reply_to", False):
                    field_id = field.get("field_id", "")
                    if field_id:
                        for data in self.form_data.get("data", ""):
                            if data.get("field_id", "") == field_id:
                                return data.get("value", "")

        return self.form_data.get("from", "") or self.block.get("default_from", "")

    def get_bcc(self):
        # todo: handle bcc for schemaForm
        subblocks = self.block.get("subblocks", [])
        if not subblocks:
            return []

        bcc = []
        bcc_fields = []
        for field in self.block.get("subblocks", []):
            if field.get("use_as_bcc", False):
                field_id = field.get("field_id", "")
                if field_id not in bcc_fields:
                    bcc_fields.append(field_id)
        bcc = []
        for data in self.form_data.get("data", []):
            value = data.get("value", "")
            if not value:
                continue
            if data.get("field_id", "") in bcc_fields:
                bcc.append(data["value"])
        return bcc

    def get_acknowledgement_field_value(self):
        acknowledgementField = self.block["acknowledgementFields"]
        for field in self.block.get("subblocks", []):
            if field.get("field_id") == acknowledgementField:
                for data in self.form_data.get("data", []):
                    if data.get("field_id", "") == field.get("field_id"):
                        return data.get("value")

    def get_subject(self):
        subject = self.block.get("default_subject") or "${subject}"
        subject = self.substitute_variables(subject)
        return subject

    def substitute_variables(self, value):
        pattern = r"\$\{([^}]+)\}"
        return re.sub(pattern, lambda match: self.get_value(match.group(1), ""), value)

    def get_value(self, field_id, default=None):
        if self.block.get("@type") == "schemaForm":
            return self.form_data["data"].get(field_id, default)

        for field in self.form_data.get("data", []):
            if field.get("field_id") == field_id:
                return field.get("value", default)
        return default

    def send_data(self):  # noQA: C901
        subject = self.get_subject()

        mfrom = self.form_data.get("from", "") or self.block.get("default_from", "")
        mreply_to = self.get_reply_to()

        if not subject or not mfrom:
            raise BadRequest(
                translate(
                    _(
                        "send_required_field_missing",
                        default="Missing required field: subject or from.",
                    ),
                    context=self.request,
                )
            )

        portal = api.portal.get()
        overview_controlpanel = getMultiAdapter(
            (portal, self.request), name="overview-controlpanel"
        )
        if overview_controlpanel.mailhost_warning():
            raise BadRequest("MailHost is not configured.")

        registry = getUtility(IRegistry)
        mail_settings = registry.forInterface(IMailSchema, prefix="plone")
        charset = registry.get("plone.email_charset", "utf-8")

        should_send = self.block.get("send", [])
        if should_send:
            portal_transforms = api.portal.get_tool(name="portal_transforms")
            mto = self.block.get("default_to", mail_settings.email_from_address)
            message = self.prepare_message()
            text_message = (
                portal_transforms.convertTo("text/plain", message, mimetype="text/html")
                .getData()
                .strip()
            )
            msg = EmailMessage(policy=policy.SMTP)
            msg.set_content(text_message, cte=CTE)
            msg.add_alternative(message, subtype="html", cte=CTE)
            msg["Subject"] = subject
            msg["From"] = mfrom
            msg["To"] = mto
            msg["Reply-To"] = mreply_to

            headers_to_forward = self.block.get("httpHeaders", [])
            for header in headers_to_forward:
                header_value = self.request.get(header)
                if header_value:
                    msg[header] = header_value

            self.manage_attachments(msg=msg)

            if isinstance(should_send, list):
                if "recipient" in self.block.get("send", []):
                    self.send_mail(msg=msg, charset=charset)
                # Backwards compatibility for forms before 'acknowledgement' sending
            else:
                self.send_mail(msg=msg, charset=charset)

            # send a copy also to the fields with bcc flag
            for bcc in self.get_bcc():
                msg.replace_header("To", bcc)
                self.send_mail(msg=msg, charset=charset)

        acknowledgement_message = self.block.get("acknowledgementMessage")
        if acknowledgement_message and "acknowledgement" in self.block.get("send", []):
            acknowledgement_address = self.get_acknowledgement_field_value()
            if acknowledgement_address:
                acknowledgement_mail = EmailMessage(policy=policy.SMTP)
                acknowledgement_mail["Subject"] = subject
                acknowledgement_mail["From"] = mfrom
                acknowledgement_mail["To"] = acknowledgement_address
                ack_msg = acknowledgement_message.get("data")
                ack_msg_text = (
                    portal_transforms.convertTo(
                        "text/plain", ack_msg, mimetype="text/html"
                    )
                    .getData()
                    .strip()
                )
                acknowledgement_mail.set_content(ack_msg_text, cte=CTE)
                acknowledgement_mail.add_alternative(ack_msg, subtype="html", cte=CTE)
                self.send_mail(msg=acknowledgement_mail, charset=charset)

    def prepare_message(self):
        mail_header = self.block.get("mail_header", {}).get("data", "")
        mail_footer = self.block.get("mail_footer", {}).get("data", "")

        # Check if there is content
        mail_header = BeautifulSoup(mail_header).get_text() if mail_header else None
        mail_footer = BeautifulSoup(mail_footer).get_text() if mail_footer else None

        email_format_page_template_mapping = {
            "list": "send_mail_template",
            "table": "send_mail_template_table",
        }
        email_format = self.block.get("email_format", "")
        template_name = email_format_page_template_mapping.get(
            email_format, "send_mail_template"
        )

        message_template = api.content.get_view(
            name=template_name,
            context=self.context,
            request=self.request,
        )
        parameters = {
            "parameters": self.filter_parameters(),
            "url": self.context.absolute_url(),
            "title": self.context.Title(),
            "mail_header": mail_header,
            "mail_footer": mail_footer,
        }
        return message_template(**parameters)

    def filter_parameters(self):
        """
        do not send attachments fields.
        """
        # TODO: handle attachments for schemaForm block
        if self.block["@type"] == "schemaForm":
            return [{
                "value": v,
                "label": self.block["schema"]["properties"].get(k, {}).get("title", k),
            } for k, v in self.form_data["data"].items()]

        skip_fields = [
            x.get("field_id", "")
            for x in self.block.get("subblocks", [])
            if x.get("field_type", "") == "attachment"
        ]
        return [
            x
            for x in self.form_data.get("data", [])
            if x.get("field_id", "") not in skip_fields
        ]

    def send_mail(self, msg, charset):
        host = api.portal.get_tool(name="MailHost")
        # we set immediate=True because we need to catch exceptions.
        # by default (False) exceptions are handled by MailHost and we can't catch them.
        host.send(msg, charset=charset, immediate=True)

    def manage_attachments(self, msg):
        attachments = self.form_data.get("attachments", {})

        if self.block.get("attachXml", False):
            self.attach_xml(msg=msg)

        if not attachments:
            return []
        for _key, value in attachments.items():
            content_type = "application/octet-stream"
            filename = None
            if isinstance(value, dict):
                file_data = value.get("data", "")
                if not file_data:
                    continue
                content_type = value.get("content-type", content_type)
                filename = value.get("filename", filename)
                if isinstance(file_data, str):
                    file_data = file_data.encode("utf-8")
                if "encoding" in value:
                    file_data = codecs.decode(file_data, value["encoding"])
                if isinstance(file_data, str):
                    file_data = file_data.encode("utf-8")
            else:
                file_data = value
            maintype, subtype = content_type.split("/")
            msg.add_attachment(
                file_data,
                maintype=maintype,
                subtype=subtype,
                filename=filename,
            )

    def attach_xml(self, msg):
        now = (
            datetime.now()
            .isoformat(timespec="seconds")
            .replace(" ", "-")
            .replace(":", "")
        )
        filename = f"formdata_{now}.xml"
        output = BytesIO()
        xmlRoot = Element("form")

        for field in self.filter_parameters():
            SubElement(
                xmlRoot, "field", name=field.get("custom_field_id", field["label"])
            ).text = str(field.get("value", ""))

        doc = ElementTree(xmlRoot)
        doc.write(output, encoding="utf-8", xml_declaration=True)
        xmlstr = output.getvalue()
        msg.add_attachment(
            xmlstr,
            maintype="application",
            subtype="xml",
            filename=filename,
        )

    def store_data(self):
        store = getMultiAdapter((self.context, self.request), IFormDataStore)
        res = store.add(data=self.filter_parameters())
        if not res:
            raise BadRequest("Unable to store data")
