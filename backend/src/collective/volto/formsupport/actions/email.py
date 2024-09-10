from bs4 import BeautifulSoup
from collective.volto.formsupport import _
from collective.volto.formsupport.actions import filter_parameters
from collective.volto.formsupport.interfaces import FormActionContext
from collective.volto.formsupport.interfaces import IFormAction
from datetime import datetime
from email import policy
from email.message import EmailMessage
from io import BytesIO
from plone import api
from plone.registry.interfaces import IRegistry
from xml.etree.ElementTree import Element
from xml.etree.ElementTree import ElementTree
from xml.etree.ElementTree import SubElement
from zExceptions import BadRequest
from zope.component import adapter
from zope.component import getMultiAdapter
from zope.component import getUtility
from zope.i18n import translate
from zope.interface import implementer
import codecs
import os
import re

try:
    from plone.base.interfaces.controlpanel import IMailSchema
except ImportError:
    from Products.CMFPlone.interfaces.controlpanel import IMailSchema

CTE = os.environ.get("MAIL_CONTENT_TRANSFER_ENCODING", None)


@implementer(IFormAction)
@adapter(FormActionContext)
class EmailFormAction:
    """Sends an email with submitted form data"""

    def __init__(self, context):
        self.context = context.context
        self.request = context.request
        self.block = context.block
        self.action = context.action
        self.data = context.data

    def __call__(self):
        portal = api.portal.get()
        overview_controlpanel = getMultiAdapter(
            (portal, self.request), name="overview-controlpanel"
        )
        if overview_controlpanel.mailhost_warning():
            raise BadRequest("MailHost is not configured.")
        registry = getUtility(IRegistry)
        mail_settings = registry.forInterface(IMailSchema, prefix="plone")
        charset = registry.get("plone.email_charset", "utf-8")

        subject = self.get_subject()

        mfrom = self.data.get("from", "") or self.action.get("default_from", "") or mail_settings.email_from_address
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

        send_to = self.action.get("send", ["recipient"])
        if not isinstance(send_to, list):
            send_to = ["recipient"] if send_to else []

        portal_transforms = api.portal.get_tool(name="portal_transforms")
        mto = self.action.get("default_to", mail_settings.email_from_address)
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

        headers_to_forward = self.action.get("httpHeaders", [])
        for header in headers_to_forward:
            header_value = self.request.get(header)
            if header_value:
                msg[header] = header_value

        self.manage_attachments(msg=msg)

        if "recipient" in send_to:
            self.send_mail(msg=msg, charset=charset)

        # send a copy also to the fields with bcc flag
        for bcc in self.get_bcc():
            msg.replace_header("To", bcc)
            self.send_mail(msg=msg, charset=charset)

        acknowledgement_message = self.action.get("acknowledgementMessage")
        if acknowledgement_message and "acknowledgement" in send_to:
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
                        for data in data.get("data", ""):
                            if data.get("field_id", "") == field_id:
                                return data.get("value", "")

        return self.data.get("from", "") or self.action.get("default_from", "")

    def get_subject(self):
        subject = self.action.get("default_subject") or "${subject}"
        subject = self.substitute_variables(subject)
        return subject

    def substitute_variables(self, value):
        pattern = r"\$\{([^}]+)\}"
        return re.sub(pattern, lambda match: self.get_value(match.group(1), ""), value)

    def get_value(self, field_id, default=None):
        if self.block.get("@type") == "schemaForm":
            return self.data["data"].get(field_id, default)

        for field in self.data.get("data", []):
            if field.get("field_id") == field_id:
                return field.get("value", default)
        return default

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
        for field in self.data.get("data", []):
            value = field.get("value", "")
            if not value:
                continue
            if field.get("field_id", "") in bcc_fields:
                bcc.append(field["value"])
        return bcc

    def prepare_message(self):
        mail_header = self.action.get("mail_header", {}).get("data", "")
        mail_footer = self.action.get("mail_footer", {}).get("data", "")

        # Check if there is content
        mail_header = BeautifulSoup(mail_header).get_text() if mail_header else None
        mail_footer = BeautifulSoup(mail_footer).get_text() if mail_footer else None

        email_format_page_template_mapping = {
            "list": "send_mail_template",
            "table": "send_mail_template_table",
        }
        email_format = self.action.get("email_format", "")
        template_name = email_format_page_template_mapping.get(
            email_format, "send_mail_template"
        )

        message_template = api.content.get_view(
            name=template_name,
            context=self.context,
            request=self.request,
        )
        parameters = {
            "parameters": filter_parameters(self.data, self.block),
            "url": self.context.absolute_url(),
            "title": self.context.Title(),
            "mail_header": mail_header,
            "mail_footer": mail_footer,
        }
        return message_template(**parameters)

    def manage_attachments(self, msg):
        attachments = self.data.get("attachments", {})

        if self.action.get("attachXml", False):
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

    def attach_xml(self, data, block, msg):
        now = (
            datetime.now()
            .isoformat(timespec="seconds")
            .replace(" ", "-")
            .replace(":", "")
        )
        filename = f"formdata_{now}.xml"
        output = BytesIO()
        xmlRoot = Element("form")

        for field in filter_parameters(data, block):
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

    def send_mail(self, msg, charset):
        host = api.portal.get_tool(name="MailHost")
        # we set immediate=True because we need to catch exceptions.
        # by default (False) exceptions are handled by MailHost and we can't catch them.
        host.send(msg, charset=charset, immediate=True)

    def get_acknowledgement_field_value(self):
        acknowledgementField = self.block["acknowledgementFields"]
        for field in self.block.get("subblocks", []):
            if field.get("field_id") == acknowledgementField:
                for submitted in self.data.get("data", []):
                    if submitted.get("field_id", "") == field.get("field_id"):
                        return submitted.get("value")
