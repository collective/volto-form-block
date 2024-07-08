from collective.volto.formsupport import _
from collective.volto.formsupport.utils import generate_email_token
from collective.volto.formsupport.utils import validate_email_token
from email import policy
from email.message import EmailMessage
from email.utils import parseaddr
from plone import api
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from zExceptions import BadRequest

import logging
import os


CTE = os.environ.get("MAIL_CONTENT_TRANSFER_ENCODING", None)

logger = logging.getLogger(__name__)


class ValidateEmailMessage(Service):
    def reply(self):
        data = self.validate()

        self.send_token(generate_email_token(data["uid"], data["email"]), data["email"])

        return self.reply_no_content()

    def send_token(self, token, email):
        """
        Send token to recipient
        """
        portal_transforms = api.portal.get_tool(name="portal_transforms")
        mail_view = api.content.get_view(
            context=self.context, name="email-confirm-view"
        )

        content = mail_view(token=token)
        mfrom = api.portal.get_registry_record("plone.email_from_address")
        host = api.portal.get_tool("MailHost")
        msg = EmailMessage(policy=policy.SMTP)

        msg.set_content(
            portal_transforms.convertTo("text/plain", content, mimetype="text/html")
            .getData()
            .strip(),
            cte=CTE,
        )
        msg.add_alternative(content, subtype="html", cte=CTE)

        msg["Subject"] = api.portal.translate(_("Email confirmation code"))
        msg["From"] = mfrom
        msg["To"] = email

        try:
            host.send(msg, charset="utf-8")
        except Exception as e:
            logger.error(f"The email confirmation message was not send due to {e}")

    def validate(self):
        data = json_body(self.request)

        if "email" not in data:
            raise BadRequest(_("The email field is missing"))

        if "@" not in parseaddr(data["email"])[1]:
            raise BadRequest(_("The provided email address is not valid"))

        if "uid" not in data:
            raise BadRequest(_("The uid field is missing"))

        return data


class ValidateEmailToken(Service):
    def reply(self):
        self.validate()

        return self.reply_no_content()

    def validate(self):
        data = json_body(self.request)

        if "email" not in data:
            raise BadRequest(_("The email field is missing"))

        if "otp" not in data:
            raise BadRequest(_("The otp field is missing"))

        if "uid" not in data:
            raise BadRequest(_("The uid field is missing"))

        if not validate_email_token(data["uid"], data["email"], data["otp"]):
            raise BadRequest(_("OTP is wrong"))
