from collective.volto.formsupport.utils import generate_email_token
from email.parser import Parser
from pathlib import Path

import base64
import pytest
import re
import transaction
import xml.etree.ElementTree as ET


@pytest.fixture
def file_str():
    filepath = Path(__file__).parent / "file.pdf"
    return filepath.read_bytes()


class TestMailSend:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, document, mailhost):
        self.portal = portal
        self.mailhost = mailhost
        self.document = document()
        self.document_url = self.document.absolute_url()
        transaction.commit()

    def test_email_not_send_if_block_id_is_not_given(self, submit_form):
        response = submit_form(
            url=self.document_url,
            data={"from": "john@doe.com", "message": "Just want to say hi."},
        )
        transaction.commit()

        res = response.json()
        assert response.status_code == 400
        assert res["message"] == "Missing block_id"

    def test_email_not_send_if_block_id_is_incorrect_or_not_present(self, submit_form):
        response = submit_form(
            url=self.document_url,
            data={
                "from": "john@doe.com",
                "message": "Just want to say hi.",
                "block_id": "unknown",
            },
        )
        transaction.commit()

        res = response.json()
        assert response.status_code == 400
        assert res["message"] == (
            f'Block with @type "form" and id "unknown" not found in this context: {self.document_url}'  # noqa: E501
        )
        response = submit_form(
            url=self.document_url,
            data={
                "from": "john@doe.com",
                "message": "Just want to say hi.",
                "block_id": "text-id",
            },
        )
        transaction.commit()

        res = response.json()
        assert response.status_code == 400
        assert res["message"] == (
            f'Block with @type "form" and id "text-id" not found in this context: {self.document_url}'  # noqa: E501
        )

    def test_email_not_send_if_no_action_set(self, submit_form):
        response = submit_form(
            url=self.document_url,
            data={"from": "john@doe.com", "block_id": "form-id"},
        )
        transaction.commit()
        res = response.json()
        assert response.status_code == 400
        assert res["message"] == (
            'You need to set at least one form action between "send" and "store".'
        )

    def test_email_not_send_if_block_id_is_correct_but_form_data_missing(
        self, submit_form
    ):
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": ["recipient"],
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "from": "john@doe.com",
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        res = response.json()
        assert response.status_code == 400
        assert res["message"] == "Empty form data."

    def test_email_not_send_if_block_id_is_correct_but_required_fields_missing(
        self, submit_form
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

        response = submit_form(
            url=self.document_url,
            data={
                "from": "john@doe.com",
                "block_id": "form-id",
                "data": [{"field_id": "xxx", "label": "foo", "value": "bar"}],
            },
        )
        transaction.commit()
        res = response.json()
        assert response.status_code == 400
        assert res["message"] == "Missing required field: subject or from."

    def test_email_not_send_if_all_fields_are_not_in_form_schema(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "form",
                "send": ["recipient"],
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "from": "john@doe.com",
                "block_id": "form-id",
                "data": [{"label": "foo", "value": "bar"}],
            },
        )
        transaction.commit()
        res = response.json()
        assert response.status_code == 400
        assert res["message"] == "Empty form data."

    def test_email_sent_with_only_fields_from_schema(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 200
        assert res["data"][0] == {"field_id": "xxx", "label": "foo", "value": "foo"}

        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: test subject" in msg
        assert "From: john@doe.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>foo:</strong> foo" in msg
        assert "<strong>bar:</strong> bar" not in msg

    def test_email_sent_with_site_recipient(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: test subject" in msg
        assert "From: john@doe.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg

    def test_email_sent_with_forwarded_headers(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: test subject" in msg
        assert "From: john@doe.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg
        assert "REMOTE_ADDR" not in msg

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

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 200

        msg = self.mailhost.messages[1].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: test subject" in msg
        assert "From: john@doe.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg
        assert "REMOTE_ADDR" in msg
        assert "PATH_INFO" in msg

    def test_email_sent_ignore_passed_recipient(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: test subject" in msg
        assert "From: john@doe.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg

    def test_email_sent_with_block_recipient_if_set(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: test subject" in msg
        assert "From: john@doe.com" in msg
        assert "To: to@block.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg

    def test_email_sent_with_block_subject_if_set_and_not_passed(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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

        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: block subject" in msg
        assert "From: john@doe.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg

    def test_email_with_use_as_reply_to(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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

        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: block subject" in msg
        assert "From: john@doe.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: smith@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> Smith" in msg

    def test_email_field_used_as_bcc(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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

        assert response.status_code == 200
        assert len(self.mailhost.messages) == 2
        msg = self.mailhost.messages[0].decode("utf-8")
        assert "To: site_addr@plone.com" in msg
        assert "To: smith@doe.com" not in msg
        bcc_msg = self.mailhost.messages[1].decode("utf-8")
        assert "To: site_addr@plone.com" not in bcc_msg
        assert "To: smith@doe.com" in bcc_msg

    def test_send_attachment(self, submit_form, file_str):
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
        response = submit_form(
            url=self.document_url,
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

        assert response.status_code == 200
        assert len(self.mailhost.messages) == 1

    def test_send_attachment_validate_size(self, monkeypatch, submit_form, file_str):
        monkeypatch.setenv("FORM_ATTACHMENTS_LIMIT", "1")
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

        # increase file dimension
        file_str = file_str * 100
        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 400
        assert (
            "Attachments too big. You uploaded 7.1 MB, but limit is 1 MB"
            in response.json()["message"]
        )
        assert len(self.mailhost.messages) == 0

    def test_send_only_acknowledgement(self, submit_form):
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_subject": "block subject",
                "default_from": "john@doe.com",
                "send": ["acknowledgement"],
                "acknowledgementFields": "contact",
                "acknowledgementMessage": {
                    "data": "<p>This message will be sent to the person filling in the form.</p><p>It is <strong>Rich Text</strong></p>"  # noqa: E501
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

        response = submit_form(
            url=self.document_url,
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

        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")

        parsed_msg = Parser().parsestr(msg)
        assert parsed_msg.get("from") == "john@doe.com"
        assert parsed_msg.get("to") == "smith@doe.com"
        assert parsed_msg.get("subject") == "block subject"
        msg_body = parsed_msg.get_payload()[1].get_payload().replace("=\r\n", "")
        assert (
            "<p>This message will be sent to the person filling in the form.</p>"
            in msg_body
        )
        assert "<p>It is <strong>Rich Text</strong></p>" in msg_body

    def test_send_recipient_and_acknowledgement(self, submit_form):
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_subject": "block subject",
                "default_from": "john@doe.com",
                "send": ["recipient", "acknowledgement"],
                "acknowledgementFields": "contact",
                "acknowledgementMessage": {
                    "data": "<p>This message will be sent to the person filling in the form.</p><p>It is <strong>Rich Text</strong></p>"  # noqa: E501
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

        response = submit_form(
            url=self.document_url,
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

        assert response.status_code == 200

        msg = self.mailhost.messages[0].decode("utf-8")
        parsed_msg = Parser().parsestr(msg)
        assert parsed_msg.get("from") == "john@doe.com"
        assert parsed_msg.get("to") == "site_addr@plone.com"
        assert parsed_msg.get("subject") == "block subject"

        msg_body = parsed_msg.get_payload()[1].get_payload()
        msg_body = re.sub(r"\s+", " ", msg_body)
        assert "<strong>Message:</strong> just want to say hi" in msg_body
        assert "<strong>Name:</strong> Smith" in msg_body

        acknowledgement_message = self.mailhost.messages[1]
        if isinstance(acknowledgement_message, bytes) and bytes is not str:
            # Python 3 with Products.MailHost 4.10+
            acknowledgement_message = acknowledgement_message.decode("utf-8")

        parsed_ack_msg = Parser().parsestr(acknowledgement_message)
        assert parsed_ack_msg.get("from") == "john@doe.com"
        assert parsed_ack_msg.get("to") == "smith@doe.com"
        assert parsed_ack_msg.get("subject") == "block subject"

        ack_msg_body = (
            parsed_ack_msg.get_payload()[1].get_payload().replace("=\r\n", "")
        )
        assert (
            "<p>This message will be sent to the person filling in the form.</p>"
            in ack_msg_body
        )
        assert "<p>It is <strong>Rich Text</strong></p>" in ack_msg_body

    def test_email_body_formated_as_table(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg).replace(" >", ">")

        assert f"Subject: {subject}" in msg
        assert "From: john@doe.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: john@doe.com" in msg

        assert """<table border="1">""" in msg
        assert "</table>" in msg
        assert (
            f"<caption>Form submission data for {self.document.title}</caption>" in msg
        )
        assert """<th align="left" role="columnheader" scope="col">Field</th>""" in msg
        assert """<th align="left" role="columnheader" scope="col">Value</th>""" in msg

        assert """<th align="left" role="rowheader" scope="row">Name</th>""" in msg

        assert f'<td align="left">{name}</td>' in msg
        assert """<th align="left" role="rowheader" scope="row">""" in msg
        assert f'<td align="left">{message}</td>' in msg

    def test_email_body_formated_as_list(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: test subject" in msg
        assert "From: john@doe.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg

    def test_send_xml(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
            data={
                "from": "john@doe.com",
                "data": form_data,
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")

        parsed_msgs = Parser().parsestr(msg)
        # 1st index is the XML attachment
        msg_contents = parsed_msgs.get_payload()[1].get_payload(decode=True)

        xml_tree = ET.fromstring(msg_contents)
        for index, field in enumerate(xml_tree):
            assert field.get("name") == form_data[index]["label"]
            assert field.text == form_data[index]["value"]

    def test_submit_return_400_if_malformed_email_in_email_field(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 400
        assert response.json()["message"] == 'Email not valid in "Email" field.'

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 400
        assert response.json()["message"] == 'Email not valid in "Email" field.'

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 400
        assert response.json()["message"] == 'Email not valid in "Email" field.'

    def test_submit_return_200_if_correct_email_in_email_field(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 200

    def test_submit_return_200_with_submitted_data(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: test subject" in msg
        assert "From: john@doe.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg

    def test_cleanup_html_in_submitted_data(self, submit_form):
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

        response = submit_form(
            url=self.document_url,
            data={
                "from": "john@doe.com",
                "data": [
                    {
                        "field_id": "message",
                        "label": "Message",
                        "value": "<b onmouseover=\"alert('XSS testing!')\">click here</b><p><i>keep tags</i></p>",  # noqa: E501
                    },
                    {
                        "field_id": "name",
                        "label": "Name",
                        "value": "<script>alert('XSS')</script> foo",
                    },
                ],
                "subject": "test subject",
                "block_id": "form-id",
            },
        )
        transaction.commit()
        assert response.status_code == 200
        res = response.json()
        assert res == ({
            "data": [
                {
                    "field_id": "message",
                    "label": "Message",
                    "value": "click here keep tags",
                },
                {
                    "field_id": "name",
                    "label": "Name",
                    "value": "alert('XSS')  foo",
                },
            ]
        })
        transaction.commit()
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "<strong>Message:</strong> click here keep tags" in msg
