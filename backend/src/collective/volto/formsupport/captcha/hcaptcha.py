from . import CaptchaSupport
from collective.volto.formsupport import _
from plone.formwidget.hcaptcha.interfaces import IHCaptchaSettings
from plone.formwidget.hcaptcha.nohcaptcha import submit

# from plone.formwidget.hcaptcha.validator import WrongCaptchaCode
from plone.registry.interfaces import IRegistry
from zExceptions import BadRequest
from zope.component import queryUtility
from zope.i18n import translate


class HCaptchaSupport(CaptchaSupport):
    name = _("HCaptcha")

    def __init__(self, context, request):
        super().__init__(context, request)
        registry = queryUtility(IRegistry)
        self.settings = registry.forInterface(IHCaptchaSettings, check=False)

    def isEnabled(self):
        return self.settings and self.settings.public_key and self.settings.private_key

    def serialize(self):
        if not self.settings.public_key:
            raise ValueError(
                "No hcaptcha public key configured. Go to "
                "path/to/site/@@hcaptcha-settings to configure."
            )
        return {
            "provider": "hcaptcha",
            "public_key": self.settings.public_key,
        }

    def verify(self, data):
        if not self.settings.private_key:
            raise ValueError(
                "No hcaptcha private key configured. Go to "
                "path/to/site/@@hcaptcha-settings to configure."
            )
        if not data or not data.get("token"):
            raise BadRequest(
                translate(
                    _("No captcha token provided."),
                    context=self.request,
                )
            )
        token = data["token"]
        remote_addr = self.request.get("HTTP_X_FORWARDED_FOR", "").split(",")[0]
        if not remote_addr:
            remote_addr = self.request.get("REMOTE_ADDR")
        res = submit(token, self.settings.private_key, remote_addr)
        if not res.is_valid:
            raise BadRequest(
                translate(
                    _("The code you entered was wrong, please enter the new one."),
                    context=self.request,
                )
            )


class HCaptchaInvisibleSupport(HCaptchaSupport):
    name = _("HCaptcha Invisible")
