from . import CaptchaSupport
from collective.honeypot.config import HONEYPOT_FIELD
from collective.honeypot.utils import found_honeypot
from collective.volto.formsupport import _
from plone.restapi.deserializer import json_body
from zExceptions import BadRequest
from zope.i18n import translate

import json


class HoneypotSupport(CaptchaSupport):
    name = _("Honeypot Support")

    def isEnabled(self):
        """
        Honeypot is enabled with env vars
        """
        return True

    def serialize(self):
        if not HONEYPOT_FIELD:
            # no field is set, so we only want to log.
            return {}

        return {"id": HONEYPOT_FIELD}

    def verify(self, data):
        msg = translate(
            _("honeypot_error", default="Error submitting form."),
            context=self.request,
        )
        # first check if volto-form-block send the compiled token
        # (because by default it does not insert the honeypot field into the submitted
        # form)
        if isinstance(data, str):
            data = json.loads(data)
        if not data:
            # @schemaform-data has been called not from volto-form-block so do the
            # standard validation.
            form_data = json_body(self.request).get("data", [])
            form = {x["label"]: x["value"] for x in form_data}
            if found_honeypot(form, required=True):
                raise BadRequest(msg)
            return
        if "value" not in data:
            raise BadRequest(msg)
        if data["value"] != "":
            raise BadRequest(msg)
