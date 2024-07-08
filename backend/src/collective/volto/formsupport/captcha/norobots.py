from . import CaptchaSupport
from collective.volto.formsupport import _
from collective.z3cform.norobots.browser.interfaces import INorobotsWidgetSettings
from plone import api
from plone.registry.interfaces import IRegistry
from zExceptions import BadRequest
from zope.component import queryUtility
from zope.i18n import translate

import json


class NoRobotsSupport(CaptchaSupport):
    name = _("NoRobots ReCaptcha Support")

    def __init__(self, context, request):
        super().__init__(context, request)
        registry = queryUtility(IRegistry)
        self.settings = registry.forInterface(INorobotsWidgetSettings, check=False)

    def isEnabled(self):
        return self.settings and self.settings.questions

    def serialize(self):
        if not self.settings.questions:
            raise ValueError(
                "No recaptcha public key configured. Go to "
                "path/to/site/@@norobots-controlpanel to configure."
            )

        view = api.content.get_view(
            context=self.context, request=self.request, name="norobots"
        )

        question = view.get_question()
        question.update({"provider": "norobots-captcha"})
        return question

    def verify(self, data):
        if not self.settings.questions:
            raise ValueError(
                "No question configured. Go to "
                "path/to/site/@@norobots-controlpanel to configure."
            )

        if not data or not data.get("token"):
            raise BadRequest(
                translate(
                    _("No captcha token provided."),
                    context=self.request,
                )
            )
        token = data["token"]
        json_token = json.loads(token)
        view = api.content.get_view(
            context=self.context, request=self.request, name="norobots"
        )
        value = json_token.get("value")
        id = json_token.get("id")
        id_check = json_token.get("id_check")

        if not view.verify(input=value, question_id=id, id_check=id_check):
            raise BadRequest(
                translate(
                    _("The code you entered was wrong, please enter the new one."),
                    context=self.request,
                )
            )
