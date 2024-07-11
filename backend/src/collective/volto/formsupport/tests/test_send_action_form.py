from collective.volto.formsupport.testing import (
    VOLTO_FORMSUPPORT_API_FUNCTIONAL_TESTING,  # ,
)
from collective.volto.formsupport.utils import generate_email_token
from email.parser import Parser
from plone import api
from plone.app.testing import setRoles
from plone.app.testing import SITE_OWNER_NAME
from plone.app.testing import SITE_OWNER_PASSWORD
from plone.app.testing import TEST_USER_ID
from plone.registry.interfaces import IRegistry
from plone.restapi.testing import RelativeSession
from Products.MailHost.interfaces import IMailHost
from zope.component import getUtility

import base64
import os
import re
import transaction
import unittest
import xml.etree.ElementTree as ET


class TestMailSend(unittest.TestCase):
    layer = VOLTO_FORMSUPPORT_API_FUNCTIONAL_TESTING

    def setUp(self):
        self.app = self.layer["app"]
        self.portal = self.layer["portal"]
        self.portal_url = self.portal.absolute_url()
        setRoles(self.portal, TEST_USER_ID, ["Manager"])

        self.mailhost = getUtility(IMailHost)

        registry = getUtility(IRegistry)
        registry["plone.email_from_address"] = "site_addr@plone.com"
        registry["plone.email_from_name"] = "Plone test site"

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

        os.environ["FORM_ATTACHMENTS_LIMIT"] = ""

        transaction.commit()

    def submit_form(self, data):
        url = f"{self.document_url}/@submit-form"
        response = self.api_session.post(
            url,
            json=data,
        )
        transaction.commit()
        return response

    def test_email_not_send_if_block_id_is_not_given(self):
        response = self.submit_form(
            data={"from": "john@doe.com", "message": "Just want to say hi."},
        )
        transaction.commit()

        res = response.json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(res["message"], "Missing block_id")

    def test_email_not_send_if_block_id_is_incorrect_or_not_present(self):
        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "message": "Just want to say hi.",
                "block_id": "unknown",
            },
        )
        transaction.commit()

        res = response.json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            res["message"],
            'Block with @type "form" and id "unknown" not found in this context: {}'.format(  # noqa
                self.document_url
            ),
        )

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "message": "Just want to say hi.",
                "block_id": "text-id",
            },
        )
        transaction.commit()

        res = response.json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            res["message"],
            'Block with @type "form" and id "text-id" not found in this context: {}'.format(  # noqa
                self.document_url
            ),
        )

    def test_email_not_send_if_no_action_set(self):
        response = self.submit_form(
            data={"from": "john@doe.com", "block_id": "form-id"},
        )
        transaction.commit()
        res = response.json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            res["message"],
            'You need to set at least one form action between "send" and "store".',
        )

    def test_email_not_send_if_block_id_is_correct_but_form_data_missing(
        self,
    ):
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": ["recipient"],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        res = response.json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            res["message"],
            "Empty form data.",
        )

    def test_email_not_send_if_block_id_is_correct_but_required_fields_missing(
        self,
    ):
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "xxx",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "block_id": "form-id",
                "data": [{"field_id": "xxx", "label": "foo", "value": "bar"}],
            },
        )
        transaction.commit()
        res = response.json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            res["message"],
            "Missing required field: subject or from.",
        )

    def test_email_not_send_if_all_fields_are_not_in_form_schema(
        self,
    ):
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": ["recipient"],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "block_id": "form-id",
                "data": [{"label": "foo", "value": "bar"}],
            },
        )
        transaction.commit()
        res = response.json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(res["message"], "Empty form data.")

    def test_email_sent_with_only_fields_from_schema(
        self,
    ):
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "xxx",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "block_id": "form-id",
                "subject": "test subject",
                "data": [
                    {"label": "foo", "value": "foo", "field_id": "xxx"},
                    {"label": "bar", "value": "bar", "field_id": "yyy"},
                ],
            },
        )
        transaction.commit()
        res = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            res, {"data": [{"field_id": "xxx", "label": "foo", "value": "foo"}]}
        )

        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        self.assertIn("Subject: test subject", msg)
        self.assertIn("From: john@doe.com", msg)
        self.assertIn("To: site_addr@plone.com", msg)
        self.assertIn("Reply-To: john@doe.com", msg)
        self.assertIn("<strong>foo:</strong> foo", msg)
        self.assertNotIn("<strong>bar:</strong> bar", msg)

    def test_email_sent_with_site_recipient(
        self,
    ):
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                    {"field_id": "name", "label": "Name", "value": "John"},
                ],
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 200)
        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        self.assertIn("Subject: test subject", msg)
        self.assertIn("From: john@doe.com", msg)
        self.assertIn("To: site_addr@plone.com", msg)
        self.assertIn("Reply-To: john@doe.com", msg)
        self.assertIn("<strong>Message:</strong> just want to say hi", msg)
        self.assertIn("<strong>Name:</strong> John", msg)

    def test_email_sent_with_forwarded_headers(
        self,
    ):
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": True,
                "httpHeaders": [],
                "subblocks": [
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                    {"field_id": "name", "label": "Name", "value": "John"},
                ],
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 200)
        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        self.assertIn("Subject: test subject", msg)
        self.assertIn("From: john@doe.com", msg)
        self.assertIn("To: site_addr@plone.com", msg)
        self.assertIn("Reply-To: john@doe.com", msg)
        self.assertIn("<strong>Message:</strong> just want to say hi", msg)
        self.assertIn("<strong>Name:</strong> John", msg)
        self.assertNotIn("REMOTE_ADDR", msg)

        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": True,
                "httpHeaders": [
                    "REMOTE_ADDR",
                    "PATH_INFO",
                ],
                "subblocks": [
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                    {"field_id": "name", "label": "Name", "value": "John"},
                ],
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 200)

        msg = self.mailhost.messages[1]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        self.assertIn("Subject: test subject", msg)
        self.assertIn("From: john@doe.com", msg)
        self.assertIn("To: site_addr@plone.com", msg)
        self.assertIn("Reply-To: john@doe.com", msg)
        self.assertIn("<strong>Message:</strong> just want to say hi", msg)
        self.assertIn("<strong>Name:</strong> John", msg)
        self.assertIn("REMOTE_ADDR", msg)
        self.assertIn("PATH_INFO", msg)

    def test_email_sent_ignore_passed_recipient(
        self,
    ):
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "to": "to@spam.com",
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                    {"field_id": "name", "label": "Name", "value": "John"},
                ],
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 200)
        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        self.assertIn("Subject: test subject", msg)
        self.assertIn("From: john@doe.com", msg)
        self.assertIn("To: site_addr@plone.com", msg)
        self.assertIn("Reply-To: john@doe.com", msg)
        self.assertIn("<strong>Message:</strong> just want to say hi", msg)
        self.assertIn("<strong>Name:</strong> John", msg)

    def test_email_sent_with_block_recipient_if_set(
        self,
    ):
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_to": "to@block.com",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                    {"field_id": "name", "label": "Name", "value": "John"},
                ],
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 200)
        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        self.assertIn("Subject: test subject", msg)
        self.assertIn("From: john@doe.com", msg)
        self.assertIn("To: to@block.com", msg)
        self.assertIn("Reply-To: john@doe.com", msg)
        self.assertIn("<strong>Message:</strong> just want to say hi", msg)
        self.assertIn("<strong>Name:</strong> John", msg)

    def test_email_sent_with_block_subject_if_set_and_not_passed(
        self,
    ):
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_subject": "block subject",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                    {"field_id": "name", "label": "Name", "value": "John"},
                ],
                "block_id": "form-id",
            },
        )
        transaction.commit()

        self.assertEqual(response.status_code, 200)
        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        self.assertIn("Subject: block subject", msg)
        self.assertIn("From: john@doe.com", msg)
        self.assertIn("To: site_addr@plone.com", msg)
        self.assertIn("Reply-To: john@doe.com", msg)
        self.assertIn("<strong>Message:</strong> just want to say hi", msg)
        self.assertIn("<strong>Name:</strong> John", msg)

    def test_email_with_use_as_reply_to(
        self,
    ):
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
                        "use_as_reply_to": True,
                    },
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
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
                    {"field_id": "name", "label": "Name", "value": "Smith"},
                    {"field_id": "contact", "label": "Email", "value": "smith@doe.com"},
                ],
                "block_id": "form-id",
            },
        )
        transaction.commit()

        self.assertEqual(response.status_code, 200)
        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        self.assertIn("Subject: block subject", msg)
        self.assertIn("From: john@doe.com", msg)
        self.assertIn("To: site_addr@plone.com", msg)
        self.assertIn("Reply-To: smith@doe.com", msg)
        self.assertIn("<strong>Message:</strong> just want to say hi", msg)
        self.assertIn("<strong>Name:</strong> Smith", msg)

    def test_email_field_used_as_bcc(
        self,
    ):
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
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "data": [
                    {"label": "Message", "value": "just want to say hi"},
                    {"label": "Name", "value": "Smith"},
                    {
                        "field_id": "contact",
                        "label": "Email",
                        "value": "smith@doe.com",
                        "otp": generate_email_token(
                            uid="form-id", email="smith@doe.com"
                        ),
                    },
                ],
                "block_id": "form-id",
            },
        )
        transaction.commit()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(self.mailhost.messages), 2)
        msg = self.mailhost.messages[0]
        bcc_msg = self.mailhost.messages[1]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
            bcc_msg = bcc_msg.decode("utf-8")
        self.assertIn("To: site_addr@plone.com", msg)
        self.assertNotIn("To: smith@doe.com", msg)
        self.assertNotIn("To: site_addr@plone.com", bcc_msg)
        self.assertIn("To: smith@doe.com", bcc_msg)

    def test_send_attachment(
        self,
    ):
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_subject": "block subject",
                "default_from": "john@doe.com",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "test",
                        "field_type": "text",
                    },
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        filename = os.path.join(os.path.dirname(__file__), "file.pdf")
        with open(filename, "rb") as f:
            file_str = f.read()

        response = self.submit_form(
            data={
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                    {"field_id": "name", "label": "Name", "value": "Smith"},
                    {"field_id": "test", "label": "Test", "value": "test text"},
                ],
                "block_id": "form-id",
                "attachments": {"foo": {"data": base64.b64encode(file_str)}},
            },
        )
        transaction.commit()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(self.mailhost.messages), 1)

    def test_send_attachment_validate_size(
        self,
    ):
        os.environ["FORM_ATTACHMENTS_LIMIT"] = "1"
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_subject": "block subject",
                "default_from": "john@doe.com",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "test",
                        "field_type": "text",
                    },
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        filename = os.path.join(os.path.dirname(__file__), "file.pdf")
        with open(filename, "rb") as f:
            file_str = f.read()
        # increase file dimension
        file_str = file_str * 100
        response = self.submit_form(
            data={
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                    {"field_id": "name", "label": "Name", "value": "Smith"},
                    {"field_id": "test", "label": "Test", "value": "test text"},
                ],
                "block_id": "form-id",
                "attachments": {"foo": {"data": base64.b64encode(file_str)}},
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "Attachments too big. You uploaded 7.1 MB, but limit is 1 MB",
            response.json()["message"],
        )
        self.assertEqual(len(self.mailhost.messages), 0)

    def test_send_only_acknowledgement(self):
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_subject": "block subject",
                "default_from": "john@doe.com",
                "send": ["acknowledgement"],
                "acknowledgementFields": "contact",
                "acknowledgementMessage": {
                    "data": "<p>This message will be sent to the person filling in the form.</p><p>It is <strong>Rich Text</strong></p>"
                },
                "subblocks": [
                    {
                        "field_id": "contact",
                        "field_type": "from",
                    },
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
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
                    {"field_id": "name", "label": "Name", "value": "Smith"},
                    {"field_id": "contact", "label": "Email", "value": "smith@doe.com"},
                ],
                "block_id": "form-id",
            },
        )
        transaction.commit()

        self.assertEqual(response.status_code, 200)
        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")

        parsed_msg = Parser().parsestr(msg)
        self.assertEqual(parsed_msg.get("from"), "john@doe.com")
        self.assertEqual(parsed_msg.get("to"), "smith@doe.com")
        self.assertEqual(parsed_msg.get("subject"), "block subject")
        msg_body = parsed_msg.get_payload()[1].get_payload().replace("=\r\n", "")
        self.assertIn(
            "<p>This message will be sent to the person filling in the form.</p>",
            msg_body,
        )
        self.assertIn("<p>It is <strong>Rich Text</strong></p>", msg_body)

    def test_send_recipient_and_acknowledgement(self):
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_subject": "block subject",
                "default_from": "john@doe.com",
                "send": ["recipient", "acknowledgement"],
                "acknowledgementFields": "contact",
                "acknowledgementMessage": {
                    "data": "<p>This message will be sent to the person filling in the form.</p><p>It is <strong>Rich Text</strong></p>"
                },
                "subblocks": [
                    {
                        "field_id": "contact",
                        "field_type": "from",
                    },
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
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
                    {"field_id": "name", "label": "Name", "value": "Smith"},
                    {"field_id": "contact", "label": "Email", "value": "smith@doe.com"},
                ],
                "block_id": "form-id",
            },
        )
        transaction.commit()

        self.assertEqual(response.status_code, 200)

        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        parsed_msg = Parser().parsestr(msg)
        self.assertEqual(parsed_msg.get("from"), "john@doe.com")
        self.assertEqual(parsed_msg.get("to"), "site_addr@plone.com")
        self.assertEqual(parsed_msg.get("subject"), "block subject")

        msg_body = parsed_msg.get_payload()[1].get_payload()
        msg_body = re.sub(r"\s+", " ", msg_body)
        self.assertIn("<strong>Message:</strong> just want to say hi", msg_body)
        self.assertIn("<strong>Name:</strong> Smith", msg_body)

        acknowledgement_message = self.mailhost.messages[1]
        if isinstance(acknowledgement_message, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            acknowledgement_message = acknowledgement_message.decode("utf-8")

        parsed_ack_msg = Parser().parsestr(acknowledgement_message)
        self.assertEqual(parsed_ack_msg.get("from"), "john@doe.com")
        self.assertEqual(parsed_ack_msg.get("to"), "smith@doe.com")
        self.assertEqual(parsed_ack_msg.get("subject"), "block subject")

        ack_msg_body = (
            parsed_ack_msg.get_payload()[1].get_payload().replace("=\r\n", "")
        )
        self.assertIn(
            "<p>This message will be sent to the person filling in the form.</p>",
            ack_msg_body,
        )
        self.assertIn("<p>It is <strong>Rich Text</strong></p>", ack_msg_body)

    def test_email_body_formated_as_table(
        self,
    ):
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": True,
                "email_format": "table",
                "subblocks": [
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        subject = "test subject"
        name = "John"
        message = "just want to say hi"

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "data": [
                    {"field_id": "message", "label": "Message", "value": message},
                    {"field_id": "name", "label": "Name", "value": name},
                ],
                "subject": subject,
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 200)
        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg).replace(" >", ">")

        self.assertIn(f"Subject: {subject}", msg)
        self.assertIn("From: john@doe.com", msg)
        self.assertIn("To: site_addr@plone.com", msg)
        self.assertIn("Reply-To: john@doe.com", msg)

        self.assertIn("""<table border="1">""", msg)
        self.assertIn("</table>", msg)
        self.assertIn(
            f"<caption>Form submission data for {self.document.title}</caption>", msg
        )
        self.assertIn(
            """<th align="left" role="columnheader" scope="col">Field</th>""",
            msg,
        )
        self.assertIn(
            """<th align="left" role="columnheader" scope="col">Value</th>""",
            msg,
        )

        self.assertIn(
            """<th align="left" role="rowheader" scope="row">Name</th>""",
            msg,
        )

        self.assertIn(f'<td align="left">{name}</td>', msg)
        self.assertIn(
            """<th align="left" role="rowheader" scope="row">""",
            msg,
        )
        self.assertIn(f'<td align="left">{message}</td>', msg)

    def test_email_body_formated_as_list(
        self,
    ):
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": True,
                "email_format": "list",
                "subblocks": [
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                    {"field_id": "name", "label": "Name", "value": "John"},
                ],
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 200)
        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        self.assertIn("Subject: test subject", msg)
        self.assertIn("From: john@doe.com", msg)
        self.assertIn("To: site_addr@plone.com", msg)
        self.assertIn("Reply-To: john@doe.com", msg)
        self.assertIn("<strong>Message:</strong> just want to say hi", msg)
        self.assertIn("<strong>Name:</strong> John", msg)

    def test_send_xml(self):
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": True,
                "attachXml": True,
                "subblocks": [
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        form_data = [
            {"field_id": "message", "label": "Message", "value": "just want to say hi"},
            {"field_id": "name", "label": "Name", "value": "John"},
        ]

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "data": form_data,
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 200)
        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")

        parsed_msgs = Parser().parsestr(msg)
        # 1st index is the XML attachment
        msg_contents = parsed_msgs.get_payload()[1].get_payload(decode=True)

        xml_tree = ET.fromstring(msg_contents)
        for index, field in enumerate(xml_tree):
            self.assertEqual(field.get("name"), form_data[index]["label"])
            self.assertEqual(field.text, form_data[index]["value"])

    def test_submit_return_400_if_malformed_email_in_email_field(
        self,
    ):
        """
        email fields in frontend are set as "from" field_type
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
                    },
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
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
                    {"field_id": "name", "label": "Name", "value": "Smith"},
                    {"field_id": "contact", "label": "Email", "value": "foo"},
                ],
                "block_id": "form-id",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"], 'Email not valid in "Email" field.'
        )

        response = self.submit_form(
            data={
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                    {"field_id": "name", "label": "Name", "value": "Smith"},
                    {"field_id": "contact", "label": "Email", "value": "foo@"},
                ],
                "block_id": "form-id",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"], 'Email not valid in "Email" field.'
        )

        response = self.submit_form(
            data={
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                    {"field_id": "name", "label": "Name", "value": "Smith"},
                    {"field_id": "contact", "label": "Email", "value": "foo@asd"},
                ],
                "block_id": "form-id",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["message"], 'Email not valid in "Email" field.'
        )

    def test_submit_return_200_if_correct_email_in_email_field(
        self,
    ):
        """
        email fields in frontend are set as "from" field_type
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
                    },
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
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
                    {"field_id": "name", "label": "Name", "value": "Smith"},
                    {"field_id": "contact", "label": "Email", "value": "foo@plone.org"},
                ],
                "block_id": "form-id",
            },
        )
        self.assertEqual(response.status_code, 200)

    def test_submit_return_200_with_submitted_data(self):
        """
        This is needed for confirm message
        """
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "just want to say hi",
                    },
                    {"field_id": "name", "label": "Name", "value": "John"},
                ],
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 200)
        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        self.assertIn("Subject: test subject", msg)
        self.assertIn("From: john@doe.com", msg)
        self.assertIn("To: site_addr@plone.com", msg)
        self.assertIn("Reply-To: john@doe.com", msg)
        self.assertIn("<strong>Message:</strong> just want to say hi", msg)
        self.assertIn("<strong>Name:</strong> John", msg)

    def test_cleanup_html_in_submitted_data(self):
        """
        This is needed for confirm message
        """
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": ["recipient"],
                "subblocks": [
                    {
                        "field_id": "message",
                        "field_type": "text",
                    },
                    {
                        "field_id": "name",
                        "field_type": "text",
                    },
                ],
            },
        }
        transaction.commit()

        response = self.submit_form(
            data={
                "from": "john@doe.com",
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "<b onmouseover=\"alert('XSS testing!')\">click here</b><p><i>keep tags</i></p>",
                    },
                    {
                        "field_id": "name",
                        "label": "Name",
                        "value": "<script>alert(‘XSS’)</script> foo",
                    },
                ],
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        self.assertEqual(response.status_code, 200)
        res = response.json()
        self.assertEqual(
            res,
            {
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "click here keep tags",
                    },
                    {
                        "field_id": "name",
                        "label": "Name",
                        "value": "alert(‘XSS’)  foo",
                    },
                ]
            },
        )
        msg = self.mailhost.messages[0]
        if isinstance(msg, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        self.assertIn(
            "<strong>Message:</strong> click here keep tags",
            msg,
        )
        self.assertIn("<strong>Name:</strong> alert(=E2=80=98XSS=E2=80=99) foo", msg)
