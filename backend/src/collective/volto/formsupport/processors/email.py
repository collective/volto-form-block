from bs4 import BeautifulSoup
from collective.volto.formsupport import _
from collective.volto.formsupport.interfaces import FormSubmissionContext
from collective.volto.formsupport.interfaces import IFormSubmissionProcessor
from collective.volto.formsupport.processors import filter_parameters
from email import policy
from email.message import EmailMessage
from plone import api
from plone.registry.interfaces import IRegistry
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


@implementer(IFormSubmissionProcessor)
@adapter(FormSubmissionContext)
class EmailFormProcessor:
    """Sends an email with submitted form data"""

    order = 1

    def __init__(self, context: FormSubmissionContext):
        self.context = context.context
        self.request = context.request
        self.block = context.block
        self.form_data = context.form_data
        self.attachments = context.attachments

    def __call__(self):
        if not self.block.get("send"):
            return

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

        mfrom = mail_settings.email_from_address
        mreply_to = self.get_reply_to() or mfrom

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

        portal_transforms = api.portal.get_tool(name="portal_transforms")
        mto = self.block.get("recipients", mail_settings.email_from_address)
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

        self.send_mail(msg=msg, charset=charset)

        # send a copy also to the fields with bcc flag
        for bcc in self.get_bcc():
            msg.replace_header("To", bcc)
            self.send_mail(msg=msg, charset=charset)

        # acknowledgement_message = self.block.get("acknowledgementMessage")
        # if acknowledgement_message:
        #     acknowledgement_address = self.get_acknowledgement_field_value()
        #     if acknowledgement_address:
        #         acknowledgement_mail = EmailMessage(policy=policy.SMTP)
        #         acknowledgement_mail["Subject"] = subject
        #         acknowledgement_mail["From"] = mfrom
        #         acknowledgement_mail["To"] = acknowledgement_address
        #         ack_msg = acknowledgement_message.get("data")
        #         ack_msg_text = (
        #             portal_transforms.convertTo(
        #                 "text/plain", ack_msg, mimetype="text/html"
        #             )
        #             .getData()
        #             .strip()
        #         )
        #         acknowledgement_mail.set_content(ack_msg_text, cte=CTE)
        #         acknowledgement_mail.add_alternative(ack_msg, subtype="html", cte=CTE)
        #         self.send_mail(msg=acknowledgement_mail, charset=charset)

    def get_reply_to(self):
        sender = self.block.get("sender", "")
        sender = self.substitute_variables(sender)
        return sender

    def get_subject(self):
        subject = self.block.get("subject") or "${subject}"
        subject = self.substitute_variables(subject)
        return subject

    def substitute_variables(self, value):
        pattern = r"\$\{([^}]+)\}"
        return re.sub(pattern, lambda match: self.get_value(match.group(1), ""), value)

    def get_value(self, field_id, default=None):
        return self.form_data.get(field_id, default)

    def get_bcc(self) -> list:
        bcc = self.block.get("bcc", "")
        bcc = self.substitute_variables(bcc)
        return bcc.split(";") if bcc else []

    def prepare_message(self):
        mail_header = self.block.get("mail_header", {}).get("data", "")
        mail_footer = self.block.get("mail_footer", {}).get("data", "")

        # Check if there is content
        mail_header = BeautifulSoup(mail_header).get_text() if mail_header else None
        mail_footer = BeautifulSoup(mail_footer).get_text() if mail_footer else None

        # TODO
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
            "parameters": filter_parameters(self.form_data, self.block),
            "url": self.context.absolute_url(),
            "title": self.context.Title(),
            "mail_header": mail_header,
            "mail_footer": mail_footer,
        }
        return message_template(**parameters)

    def manage_attachments(self, msg):
        attachments = self.attachments

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

    def send_mail(self, msg, charset):
        host = api.portal.get_tool(name="MailHost")
        # we set immediate=True because we need to catch exceptions.
        # by default (False) exceptions are handled by MailHost and we can't catch them.
        host.send(msg, charset=charset, immediate=True)
