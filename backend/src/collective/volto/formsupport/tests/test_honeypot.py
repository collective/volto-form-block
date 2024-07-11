from collective.volto.formsupport.testing import (
    VOLTO_FORMSUPPORT_API_FUNCTIONAL_TESTING,  # ,
)
from plone import api
from plone.app.testing import setRoles
from plone.app.testing import SITE_OWNER_NAME
from plone.app.testing import SITE_OWNER_PASSWORD
from plone.app.testing import TEST_USER_ID
from plone.registry.interfaces import IRegistry
from plone.restapi.testing import RelativeSession
from Products.MailHost.interfaces import IMailHost
from zope.component import getUtility

import json
import transaction
import unittest


class TestHoneypot(unittest.TestCase):
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
        return response

    def test_honeypot_installed_but_field_not_in_form(self):
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
                "captcha": "honeypot",
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

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"],
            "Error submitting form.",
        )

    def test_honeypot_field_in_form_empty_pass_validation(self):
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
                "captcha": "honeypot",
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
                    {"label": "protected_1", "value": ""},
                ],
                "block_id": "form-id",
            },
        )
        self.assertEqual(response.status_code, 200)

    def test_honeypot_field_in_form_compiled_fail_validation(self):
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
                    {
                        "field_id": "protected_1",
                        "field_type": "text",
                    },
                ],
                "captcha": "honeypot",
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
                    {"field_id": "protected_1", "label": "protected_1", "value": "foo"},
                ],
                "block_id": "form-id",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"],
            "Error submitting form.",
        )

    def test_form_submitted_from_volto_valid(self):
        """
        when you compile the form from volto, the honey field value is passed into captcha value
        """
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
                "captcha": "honeypot",
            },
        }
        transaction.commit()
        captcha_token = json.dumps({"id": "protected_1", "value": "foo"})
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
                "captcha": {
                    "provider": "honey",
                    "token": captcha_token,
                    "value": "",
                },
            },
        )

        self.assertEqual(response.status_code, 200)

    def test_form_submitted_from_volto_invalid_because_missing_value(self):
        """
        when you compile the form from volto, the honey field value is passed into captcha value
        """
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
                "captcha": "honeypot",
            },
        }
        transaction.commit()
        captcha_token = json.dumps({"id": "protected_1", "value": "foo"})
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
                "captcha": {
                    "provider": "honey",
                    "token": captcha_token,
                },
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"],
            "Error submitting form.",
        )

    def test_form_submitted_from_volto_invalid_because_compiled(self):
        """
        when you compile the form from volto, the honey field value is passed into captcha value
        """
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
                "captcha": "honeypot",
            },
        }
        transaction.commit()
        captcha_token = json.dumps({"id": "protected_1", "value": "foo"})
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
                "captcha": {
                    "provider": "honey",
                    "token": captcha_token,
                    "value": "i'm a bot",
                },
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"],
            "Error submitting form.",
        )
