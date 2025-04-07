from bs4 import BeautifulSoup
from collective.volto.formsupport import _
from collective.volto.formsupport.interfaces import FormSubmissionContext
from collective.volto.formsupport.interfaces import IFormSubmissionProcessor
from email import policy
from email.message import EmailMessage
from email.utils import formataddr
from plone import api
from plone.registry.interfaces import IRegistry
from zExceptions import BadRequest
from zope.component import adapter
from zope.component import getMultiAdapter
from zope.component import getUtility
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
        self.records = context.get_records()
        self.attachments = context.get_attachments()

        registry = getUtility(IRegistry)
        self.mail_settings = registry.forInterface(IMailSchema, prefix="plone")
        self.charset = registry.get("plone.email_charset", "utf-8")

    def __call__(self):
        send_to_admin = bool(self.block.get("send"))
        send_confirmation = bool(self.block.get("send_confirmation"))
        if not send_to_admin and not send_confirmation:
            return

        portal = api.portal.get()
        overview_controlpanel = getMultiAdapter(
            (portal, self.request), name="overview-controlpanel"
        )
        if overview_controlpanel.mailhost_warning():
            raise BadRequest("MailHost is not configured.")
        portal_transforms = api.portal.get_tool(name="portal_transforms")

        subject = self.get_subject()

        mfrom = self.get_sender()
        message = self.prepare_message()
        text_message = (
            portal_transforms.convertTo("text/plain", message, mimetype="text/html")
            .getData()
            .strip()
        )
        admin_message = self.prepare_message(True)
        admin_text_message = (
            portal_transforms.convertTo("text/plain", message, mimetype="text/html")
            .getData()
            .strip()
        )

        if send_to_admin:
            mto = self.block.get("recipients", self.mail_settings.email_from_address)
            msg = EmailMessage(policy=policy.SMTP)
            msg.set_content(admin_text_message, cte=CTE)
            msg.add_alternative(admin_message, subtype="html", cte=CTE)
            msg["Subject"] = subject
            msg["From"] = mfrom
            msg["To"] = mto.replace(";", ",")

            bcc = self.get_bcc()
            if bcc:
                msg["Bcc"] = bcc.replace(";", ",")

            headers_to_forward = self.block.get("httpHeaders", [])
            for header in headers_to_forward:
                header_value = self.request.get(header)
                if header_value:
                    msg[header] = header_value

            self.add_attachments(msg=msg)
            self.send_mail(msg=msg, charset=self.charset)

        if send_confirmation:
            recipients = self.get_confirmation_recipients()
            if recipients:
                msg = EmailMessage(policy=policy.SMTP)
                msg["Subject"] = subject
                msg["From"] = mfrom
                msg["To"] = self.get_confirmation_recipients()
                msg.set_content(text_message, cte=CTE)
                msg.add_alternative(message, subtype="html", cte=CTE)
                self.attachments = {}

                if "fixed_attachment" in self.block and self.block["fixed_attachment"]:
                    self.attachments["fixed_attachment"] = self.block[
                        "fixed_attachment"
                    ]

                self.add_attachments(msg=msg)
                self.send_mail(msg=msg, charset=self.charset)

    def get_sender(self) -> str:
        sender = self.block.get("sender", "")
        sender = (
            self.substitute_variables(sender) or self.mail_settings.email_from_address
        )

        sender_name = self.block.get("sender_name", "")
        sender_name = (
            self.substitute_variables(sender_name) or self.mail_settings.email_from_name
        )

        return formataddr((sender_name, sender))

    def get_subject(self):
        subject = self.block.get("subject")
        if not subject:
            if "subject" in self.block["schema"].get("properties", {}):
                subject = "${subject}"
            else:
                subject = self.block.get("title") or "Form Submission"
        subject = self.substitute_variables(subject)
        return subject

    def substitute_variables(self, value, context=None):
        if context is None:
            context = self.form_data

        def replace(match):
            name = match.group(1)
            return context.get(name, "")

        pattern = r"\$\{([^}]+)\}"
        return re.sub(pattern, replace, value)

    def get_value(self, field_id, default=None):
        return self.form_data.get(field_id, default)

    def get_bcc(self) -> list:
        bcc = self.block.get("bcc", "")
        bcc = self.substitute_variables(bcc)
        return bcc if bcc != "" else None

    def get_confirmation_recipients(self) -> str:
        confirmation_recipients = self.block.get("confirmation_recipients", "")
        confirmation_recipients = self.substitute_variables(confirmation_recipients)
        return confirmation_recipients

    def prepare_message(self, admin=False):
        templates = api.portal.get_registry_record("schemaform.mail_templates")
        template_name = self.block.get("email_template", "default")
        admin_info = self.block.get("admin_info", "")
        properties = self.block.get("schema").get("properties")
        template = templates[template_name]
        plone = getMultiAdapter((self.context, self.request), name="plone")
        template_vars = {
            "mail_header": self.block.get("mail_header", {}).get("data", ""),
            "mail_footer": self.block.get("mail_footer", {}).get("data", ""),
        }
        form_fields = ""
        if admin:
            form_fields += admin_info.replace("\n", "<br/>") + "<br/><br/>"

        def format_property(factory, value):
            if factory == "label_boolean_field":
                if value == True:
                    return self.context.translate(
                        _("Yes"),
                        context=self.request,
                    )
                else:
                    return self.context.translate(
                        _("No"),
                        context=self.request,
                    )
            elif factory == "checkbox_group":
                if isinstance(value, list):
                    return "<br/>".join(value)
                else:
                    return str(value)
            elif factory == "label_date_field":
                return plone.toLocalizedTime(value)
            elif factory == "label_datetime_field":
                return plone.toLocalizedTime(value, True)
            else:
                return str(value)

        form_fields += "<table>\n"
        for record in self.records:
            factory = properties[record["field_id"]].get("factory", "")
            value = format_property(factory, record["value"])
            template_vars[record["field_id"]] = value

            if factory == "hidden" and not admin:
                continue
            if record["field_id"] == "captchaWidget":
                continue

            form_fields += (
                f"<tr><th align=\"left\">{record['label']}</th><td>{value}</td></tr>"
            )
        form_fields += "\n</table>\n"
        template_vars["form_fields"] = form_fields
        message = self.substitute_variables(template, template_vars)
        return message

    def add_attachments(self, msg):
        if not self.attachments:
            return []
        for _key, value in self.attachments.items():
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
