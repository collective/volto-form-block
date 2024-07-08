from collective.volto.formsupport.testing import (  # noqa: E501,
    VOLTO_FORMSUPPORT_API_FUNCTIONAL_TESTING,
)
from plone import api
from plone.app.testing import setRoles
from plone.app.testing import SITE_OWNER_NAME
from plone.app.testing import SITE_OWNER_PASSWORD
from plone.app.testing import TEST_USER_ID
from plone.formwidget.hcaptcha.interfaces import IHCaptchaSettings
from plone.formwidget.recaptcha.interfaces import IReCaptchaSettings
from plone.registry.interfaces import IRegistry
from plone.restapi.testing import RelativeSession
from zope.component import getUtility

import os
import transaction
import unittest


class TestBlockSerialization(unittest.TestCase):
    layer = VOLTO_FORMSUPPORT_API_FUNCTIONAL_TESTING

    def setUp(self):
        self.app = self.layer["app"]
        self.portal = self.layer["portal"]
        self.portal_url = self.portal.absolute_url()
        setRoles(self.portal, TEST_USER_ID, ["Manager"])

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
            "form-id": {
                "@type": "form",
                "default_from": "foo@foo.com",
                "default_bar": "bar",
                "subblocks": [
                    {"field_id": "name", "label": "Name", "type": "text"},
                    {"field_id": "surname", "label": "Surname", "type": "text"},
                ],
            },
        }
        self.document_url = self.document.absolute_url()
        api.content.transition(obj=self.document, transition="publish")
        transaction.commit()

    def tearDown(self):
        self.api_session.close()
        self.anon_api_session.close()

    def test_serializer_return_full_block_data_to_admin(self):
        response = self.api_session.get(self.document_url)
        res = response.json()
        self.assertEqual(res["blocks"]["form-id"], self.document.blocks["form-id"])

    def test_serializer_return_filtered_block_data_to_anon(self):
        response = self.anon_api_session.get(self.document_url)
        res = response.json()
        self.assertNotEqual(res["blocks"]["form-id"], self.document.blocks["form-id"])
        self.assertNotIn("default_from", res["blocks"]["form-id"].keys())
        self.assertNotIn("default_foo", res["blocks"]["form-id"].keys())
        self.assertIn("subblocks", res["blocks"]["form-id"].keys())


class TestBlockSerializationRecaptcha(unittest.TestCase):
    layer = VOLTO_FORMSUPPORT_API_FUNCTIONAL_TESTING

    def setUp(self):
        self.app = self.layer["app"]
        self.portal = self.layer["portal"]
        self.portal_url = self.portal.absolute_url()
        setRoles(self.portal, TEST_USER_ID, ["Manager"])

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
            "form-id": {
                "@type": "form",
                "default_from": "foo@foo.com",
                "default_bar": "bar",
                "subblocks": [
                    {"field_id": "name", "label": "Name", "type": "text"},
                    {"field_id": "surname", "label": "Surname", "type": "text"},
                ],
                "captcha": "recaptcha",
            },
        }
        self.document_url = self.document.absolute_url()
        api.content.transition(obj=self.document, transition="publish")

        self.registry = getUtility(IRegistry)
        self.registry.registerInterface(IReCaptchaSettings)
        settings = self.registry.forInterface(IReCaptchaSettings)
        settings.public_key = "public"
        settings.private_key = "private"
        transaction.commit()

    def tearDown(self):
        self.api_session.close()
        self.anon_api_session.close()

    def test_serializer_with_recaptcha(self):
        response = self.anon_api_session.get(self.document_url)
        res = response.json()
        self.assertEqual(
            res["blocks"]["form-id"]["captcha_props"],
            {"provider": "recaptcha", "public_key": "public"},
        )


class TestBlockSerializationHCaptcha(unittest.TestCase):
    layer = VOLTO_FORMSUPPORT_API_FUNCTIONAL_TESTING

    def setUp(self):
        self.app = self.layer["app"]
        self.portal = self.layer["portal"]
        self.portal_url = self.portal.absolute_url()
        setRoles(self.portal, TEST_USER_ID, ["Manager"])

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
            "form-id": {
                "@type": "form",
                "default_from": "foo@foo.com",
                "default_bar": "bar",
                "subblocks": [
                    {"field_id": "name", "label": "Name", "type": "text"},
                    {"field_id": "surname", "label": "Surname", "type": "text"},
                ],
                "captcha": "hcaptcha",
            },
        }
        self.document_url = self.document.absolute_url()
        api.content.transition(obj=self.document, transition="publish")

        self.registry = getUtility(IRegistry)
        self.registry.registerInterface(IHCaptchaSettings)
        settings = self.registry.forInterface(IHCaptchaSettings)
        settings.public_key = "public"
        settings.private_key = "private"
        transaction.commit()

    def tearDown(self):
        self.api_session.close()
        self.anon_api_session.close()

    def test_serializer_with_hcaptcha(self):
        response = self.anon_api_session.get(self.document_url)
        res = response.json()
        self.assertEqual(
            res["blocks"]["form-id"]["captcha_props"],
            {"provider": "hcaptcha", "public_key": "public"},
        )


class TestBlockSerializationAttachmentsLimit(unittest.TestCase):
    layer = VOLTO_FORMSUPPORT_API_FUNCTIONAL_TESTING

    def setUp(self):
        self.app = self.layer["app"]
        self.portal = self.layer["portal"]
        self.portal_url = self.portal.absolute_url()
        setRoles(self.portal, TEST_USER_ID, ["Manager"])

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
            "form-id": {
                "@type": "form",
                "default_from": "foo@foo.com",
                "default_bar": "bar",
                "subblocks": [
                    {"field_id": "name", "label": "Name", "type": "text"},
                    {"field_id": "surname", "label": "Surname", "type": "text"},
                ],
            },
        }
        self.document_url = self.document.absolute_url()
        api.content.transition(obj=self.document, transition="publish")

        transaction.commit()

    def tearDown(self):
        self.api_session.close()
        self.anon_api_session.close()
        os.environ["FORM_ATTACHMENTS_LIMIT"] = ""

    def test_serializer_without_attachments_limit(self):
        response = self.anon_api_session.get(self.document_url)
        res = response.json()
        self.assertNotIn("attachments_limit", res["blocks"]["form-id"])
