from collective.volto.formsupport.testing import (
    VOLTO_FORMSUPPORT_API_FUNCTIONAL_TESTING,  # ,
)
from collective.z3cform.norobots.browser.interfaces import INorobotsWidgetSettings
from hashlib import md5
from plone import api
from plone.app.testing import setRoles
from plone.app.testing import SITE_OWNER_NAME
from plone.app.testing import SITE_OWNER_PASSWORD
from plone.app.testing import TEST_USER_ID
from plone.formwidget.hcaptcha.interfaces import IHCaptchaSettings
from plone.formwidget.recaptcha.interfaces import IReCaptchaSettings
from plone.registry.interfaces import IRegistry
from plone.restapi.testing import RelativeSession
from Products.MailHost.interfaces import IMailHost
from unittest.mock import Mock
from unittest.mock import patch
from zope.component import getUtility

import json
import transaction
import unittest


class TestCaptcha(unittest.TestCase):
    layer = VOLTO_FORMSUPPORT_API_FUNCTIONAL_TESTING

    def setUp(self):
        self.app = self.layer["app"]
        self.portal = self.layer["portal"]
        self.portal_url = self.portal.absolute_url()
        setRoles(self.portal, TEST_USER_ID, ["Manager"])

        self.mailhost = getUtility(IMailHost)

        self.registry = getUtility(IRegistry)
        self.registry["plone.email_from_address"] = "site_addr@plone.com"
        self.registry["plone.email_from_name"] = "Plone test site"

        self.api_session = RelativeSession(self.portal_url)
        self.api_session.headers.update({"Accept": "application/json"})
        self.api_session.auth = (SITE_OWNER_NAME, SITE_OWNER_PASSWORD)
        self.anon_api_session = RelativeSession(self.portal_url)
        self.anon_api_session.headers.update({"Accept": "application/json"})

        self.document = api.content.create(
            type="Document",
            title="Example context",
            container=self.portal,
        )
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {"@type": "form"},
        }
        self.document_url = self.document.absolute_url()

        transaction.commit()

    def tearDown(self):
        self.api_session.close()
        self.anon_api_session.close()

        # set default block
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {"@type": "form"},
        }
        transaction.commit()

    def submit_form(self, data):
        url = f"{self.document_url}/@submit-form"
        response = self.api_session.post(
            url,
            json=data,
        )
        # transaction.commit()
        return response

    def test_recaptcha_no_settings(self):
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_subject": "block subject",
                "default_from": "john@doe.com",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "contact",
                        "field_type": "from",
                        "use_as_bcc": True,
                    },
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                ],
                "captcha": "recaptcha",
            },
        }
        self.registry.registerInterface(IReCaptchaSettings)
        transaction.commit()
        response = self.submit_form(
            data={
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                ],
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.json()["message"],
            "No recaptcha private key configured. Go to path/to/site/@@recaptcha-settings "  # noqa: E501
            "to configure.",
        )

    def test_recaptcha(self):
        self.registry.registerInterface(IReCaptchaSettings)
        settings = self.registry.forInterface(IReCaptchaSettings)
        settings.public_key = "public"
        settings.private_key = "private"

        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_subject": "block subject",
                "default_from": "john@doe.com",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "contact",
                        "field_type": "from",
                        "use_as_bcc": True,
                    },
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                ],
                "captcha": "recaptcha",
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                ],
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "No captcha token provided.")

        with patch(
            "collective.volto.formsupport.captcha.recaptcha.submit"
        ) as mock_submit:
            mock_submit.return_value = Mock(is_valid=False)
            response = self.submit_form(
                data={
                    "data": [
                        {
                            "field_id": "message",
                            "label": "Message",
                            "value": "just want to say hi",
                        },
                    ],
                    "block_id": "form-id",
                    "captcha": {"token": "12345"},
                },
            )
            transaction.commit()
            mock_submit.assert_called_once_with("12345", "private", "127.0.0.1")
            self.assertEqual(response.status_code, 400)
            self.assertEqual(
                response.json()["message"],
                "The code you entered was wrong, please enter the new one.",
            )

        with patch(
            "collective.volto.formsupport.captcha.recaptcha.submit"
        ) as mock_submit:
            mock_submit.return_value = Mock(is_valid=True)
            response = self.submit_form(
                data={
                    "data": [
                        {
                            "field_id": "message",
                            "label": "Message",
                            "value": "just want to say hi",
                        },
                    ],
                    "block_id": "form-id",
                    "captcha": {"token": "12345"},
                },
            )
            transaction.commit()
            mock_submit.assert_called_once_with("12345", "private", "127.0.0.1")
            self.assertEqual(response.status_code, 200)

    def test_hcaptcha(
        self,
    ):
        self.registry.registerInterface(IHCaptchaSettings)
        settings = self.registry.forInterface(IHCaptchaSettings)
        settings.public_key = "public"
        settings.private_key = "private"

        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_subject": "block subject",
                "default_from": "john@doe.com",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "contact",
                        "field_type": "from",
                        "use_as_bcc": True,
                    },
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                ],
                "captcha": "hcaptcha",
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                ],
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["message"], "No captcha token provided.")

        with patch(
            "collective.volto.formsupport.captcha.hcaptcha.submit"
        ) as mock_submit:
            mock_submit.return_value = Mock(is_valid=False)
            response = self.submit_form(
                data={
                    "data": [
                        {
                            "field_id": "message",
                            "label": "Message",
                            "value": "just want to say hi",
                        },
                    ],
                    "block_id": "form-id",
                    "captcha": {"token": "12345"},
                },
            )
            transaction.commit()
            mock_submit.assert_called_once_with("12345", "private", "127.0.0.1")
            self.assertEqual(response.status_code, 400)
            self.assertEqual(
                response.json()["message"],
                "The code you entered was wrong, please enter the new one.",
            )

        with patch(
            "collective.volto.formsupport.captcha.hcaptcha.submit"
        ) as mock_submit:
            mock_submit.return_value = Mock(is_valid=True)
            response = self.submit_form(
                data={
                    "data": [
                        {
                            "field_id": "message",
                            "label": "Message",
                            "value": "just want to say hi",
                        },
                    ],
                    "block_id": "form-id",
                    "captcha": {"token": "12345"},
                },
            )
            transaction.commit()
            mock_submit.assert_called_once_with("12345", "private", "127.0.0.1")
            self.assertEqual(response.status_code, 200)

    def test_get_vocabulary(self):
        response = self.api_session.get(
            "/@vocabularies/collective.volto.formsupport.captcha.providers"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # no adapters configured
        self.assertTrue(
            data["@id"].endswith(
                "@vocabularies/collective.volto.formsupport.captcha.providers"
            )
        )

        # honeypot is always active if it's in buildout
        self.assertEqual(data["items_total"], 1)
        self.assertEqual(
            data["items"], [{"title": "Honeypot Support", "token": "honeypot"}]
        )

        # configure recaptcha
        self.registry.registerInterface(IReCaptchaSettings)
        settings = self.registry.forInterface(IReCaptchaSettings)
        settings.public_key = "public"
        settings.private_key = "private"
        transaction.commit()
        response = self.api_session.get(
            "/@vocabularies/collective.volto.formsupport.captcha.providers"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # no adapters configured
        self.assertTrue(
            data["@id"].endswith(
                "@vocabularies/collective.volto.formsupport.captcha.providers"
            )
        )
        self.assertEqual(data["items_total"], 2)
        self.assertEqual(
            data["items"],
            [
                {"title": "Google ReCaptcha", "token": "recaptcha"},
                {"title": "Honeypot Support", "token": "honeypot"},
            ],
        )

    def test_norobots(self):
        """test that using norobots the captcha can be passed"""
        self.registry.registerInterface(INorobotsWidgetSettings)
        settings = self.registry.forInterface(INorobotsWidgetSettings)
        settings.questions = ("Write five using ciphers::5", "How much is 10 + 4::14")
        transaction.commit()

        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_subject": "block subject",
                "default_from": "john@doe.com",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "contact",
                        "field_type": "from",
                        "use_as_bcc": True,
                    },
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                ],
                "captcha": "norobots-captcha",
            },
        }
        transaction.commit()

        captcha_token = json.dumps(
            {
                "value": "5",
                "id": "question0",
                "id_check": md5(
                    "Write five using ciphers".encode("ascii", "ignore")
                ).hexdigest(),
            }
        )

        response = self.submit_form(
            data={
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                ],
                "block_id": "form-id",
                "captcha": {"provider": "norobots-captcha", "token": captcha_token},
            },
        )
        self.assertEqual(response.status_code, 200)

    def test_norobots_wrong_captcha(self):
        """test that using norobots and a wrong answer, the captcha is not passed"""
        self.registry.registerInterface(INorobotsWidgetSettings)
        settings = self.registry.forInterface(INorobotsWidgetSettings)
        settings.questions = ("Write five using ciphers::5", "How much is 10 + 4::14")
        transaction.commit()

        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_subject": "block subject",
                "default_from": "john@doe.com",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "contact",
                        "field_type": "from",
                        "use_as_bcc": True,
                    },
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                ],
                "captcha": "norobots-captcha",
            },
        }
        transaction.commit()

        captcha_token = json.dumps(
            {
                "value": "15",
                "id": "question0",
                "id_check": md5(
                    "Write five using ciphers".encode("ascii", "ignore")
                ).hexdigest(),
            }
        )

        response = self.submit_form(
            data={
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                ],
                "block_id": "form-id",
                "captcha": {"provider": "norobots-captcha", "token": captcha_token},
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"],
            "The code you entered was wrong, please enter the new one.",
        )
