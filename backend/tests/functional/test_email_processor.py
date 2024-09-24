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

    def test_email_not_sent_if_block_id_is_not_given(self, submit_form):
        response = submit_form(
            url=self.document_url,
            data={},
        )
        transaction.commit()

        res = response.json()
        assert response.status_code == 400
        assert res["message"] == "Missing block_id"

    def test_email_not_sent_if_block_id_is_incorrect_or_not_present(self, submit_form):
        response = submit_form(
            url=self.document_url,
            data={
                "block_id": "unknown",
            },
        )
        transaction.commit()
        res = response.json()
        assert response.status_code == 400
        assert res["message"] == (
            f'Block with @type "schemaForm" and id "unknown" not found in this context: {self.document_url}'  # noqa: E501
        )

        response = submit_form(
            url=self.document_url,
            data={
                "block_id": "text-id",
            },
        )
        transaction.commit()
        res = response.json()
        assert response.status_code == 400
        assert res["message"] == (
            f'Block with @type "schemaForm" and id "text-id" not found in this context: {self.document_url}'  # noqa: E501
        )

    def test_email_not_sent_if_block_id_is_correct_but_form_data_missing(
        self, submit_form
    ):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
            },
        }
        transaction.commit()
        response = submit_form(
            url=self.document_url,
            data={
                "block_id": "form-id",
            },
        )
        res = response.json()
        assert response.status_code == 400
        assert res["message"] == "Empty form data."

    def test_email_not_sent_if_all_fields_are_not_in_form_schema(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "block_id": "form-id",
                "data": {"xxx": "bar"},
            },
        )
        transaction.commit()
        res = response.json()
        assert response.status_code == 400
        assert res["message"] == "Empty form data."

    def test_email_sent_with_fallback_subject_and_sender(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["xxx"],
                        },
                    ],
                    "properties": {
                        "xxx": {},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "block_id": "form-id",
                "data": {"xxx": "bar"},
            },
        )
        transaction.commit()
        res = response.json()
        assert response.status_code == 200
        assert res["data"] == {"xxx": "bar"}

        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: Form Submission" in msg
        assert "From: site_addr@plone.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: site_addr@plone.com" in msg

    def test_email_sent_with_only_fields_from_schema(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
                "sender": "john@doe.com",
                "subject": "test subject",
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["xxx"],
                        },
                    ],
                    "properties": {
                        "xxx": {"title": "foo"},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "block_id": "form-id",
                "data": {"xxx": "foo", "yyy": "bar"},
            },
        )
        transaction.commit()
        res = response.json()
        assert response.status_code == 200
        assert res["data"] == {"xxx": "foo"}

        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: test subject" in msg
        assert "From: site_addr@plone.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>foo:</strong> foo" in msg
        assert "<strong>bar:</strong> bar" not in msg

    def test_email_sent_with_site_recipient(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
                "sender": "john@doe.com",
                "subject": "test subject",
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["message", "name"],
                        },
                    ],
                    "properties": {
                        "message": {"title": "Message"},
                        "name": {"title": "Name"},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "data": {"message": "just want to say hi", "name": "John"},
                "block_id": "form-id",
            },
        )
        transaction.commit()
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: test subject" in msg
        assert "From: site_addr@plone.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg

    def test_email_sent_with_forwarded_headers(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
                "sender": "john@doe.com",
                "subject": "test subject",
                "httpHeaders": [
                    "REMOTE_ADDR",
                    "PATH_INFO",
                ],
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["message", "name"],
                        },
                    ],
                    "properties": {
                        "message": {"title": "Message"},
                        "name": {"title": "Name"},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "data": {"message": "just want to say hi", "name": "John"},
                "block_id": "form-id",
            },
        )
        transaction.commit()
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: test subject" in msg
        assert "From: site_addr@plone.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg
        assert "REMOTE_ADDR" in msg
        assert "PATH_INFO" in msg

    def test_email_sent_with_block_recipient_if_set(self, submit_form):
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "schemaForm",
                "recipients": "to@block.com",
                "send": True,
                "sender": "john@doe.com",
                "subject": "test subject",
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["message", "name"],
                        },
                    ],
                    "properties": {
                        "message": {"title": "Message"},
                        "name": {"title": "Name"},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "data": {"message": "just want to say hi", "name": "John"},
                "block_id": "form-id",
            },
        )
        transaction.commit()
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: test subject" in msg
        assert "From: site_addr@plone.com" in msg
        assert "To: to@block.com" in msg
        assert "Reply-To: john@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg

    def test_email_sent_with_subject_from_form_data(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "subject": "${message}",
                "send": True,
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["message", "name"],
                        },
                    ],
                    "properties": {
                        "message": {"title": "Message"},
                        "name": {"title": "Name"},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "data": {"message": "just want to say hi", "name": "John"},
                "block_id": "form-id",
            },
        )
        transaction.commit()

        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "Subject: just want to say hi" in msg
        assert "From: site_addr@plone.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: site_addr@plone.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg

    def test_email_with_sender_from_form_data(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
                "sender": "${email}",
                "subject": "test subject",
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["message", "name", "email"],
                        },
                    ],
                    "properties": {
                        "message": {"title": "Message"},
                        "name": {"title": "Name"},
                        "email": {},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "data": {
                    "message": "just want to say hi",
                    "name": "Smith",
                    "email": "smith@doe.com",
                },
                "block_id": "form-id",
            },
        )
        transaction.commit()

        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "From: site_addr@plone.com" in msg
        assert "To: site_addr@plone.com" in msg
        assert "Reply-To: smith@doe.com" in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> Smith" in msg

    def test_email_with_bcc_from_form_data(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
                "subject": "test subject",
                "bcc": "${email}",
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["message", "name", "email"],
                        },
                    ],
                    "properties": {
                        "message": {"title": "Message"},
                        "name": {"title": "Name"},
                        "email": {},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "data": {
                    "message": "just want to say hi",
                    "name": "Smith",
                    "email": "smith@doe.com",
                },
                "block_id": "form-id",
            },
        )
        transaction.commit()

        assert response.status_code == 200
        assert len(self.mailhost.messages) == 2
        msg = self.mailhost.messages[0].decode("utf-8")
        assert "\nTo: site_addr@plone.com" in msg
        assert "\nTo: smith@doe.com" not in msg
        bcc_msg = self.mailhost.messages[1].decode("utf-8")
        assert "\nTo: site_addr@plone.com" not in bcc_msg
        assert "\nTo: smith@doe.com" in bcc_msg

    def test_send_attachment(self, submit_form, file_str):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
                "subject": "test subject",
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["attachment"],
                        },
                    ],
                    "properties": {
                        "attachment": {"factory": "File Upload", "type": "object"},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()
        response = submit_form(
            url=self.document_url,
            data={
                "data": {
                    "attachment": {
                        "data": base64.b64encode(file_str),
                        "filename": "test.pdf",
                    },
                },
                "block_id": "form-id",
            },
        )
        transaction.commit()

        assert response.status_code == 200
        assert len(self.mailhost.messages) == 1
        msg = self.mailhost.messages[0].decode("utf-8")
        assert 'Content-Disposition: attachment; filename="test.pdf"' in msg

    def test_send_attachment_validate_size(self, monkeypatch, submit_form, file_str):
        monkeypatch.setenv("FORM_ATTACHMENTS_LIMIT", "1")
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
                "subject": "test subject",
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["attachment"],
                        },
                    ],
                    "properties": {
                        "attachment": {"factory": "File Upload", "type": "object"},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

        # increase file dimension
        file_str = file_str * 100
        response = submit_form(
            url=self.document_url,
            data={
                "data": {
                    "attachment": {
                        "data": base64.b64encode(file_str),
                        "filename": "test.pdf",
                    },
                },
                "block_id": "form-id",
            },
        )
        transaction.commit()
        assert response.status_code == 400
        assert (
            "Attachments too big. You uploaded 7.1 MB, but limit is 1 MB"
            in response.json()["message"]
        )
        assert len(self.mailhost.messages) == 0

    def test_send_confirmation(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send_confirmation": True,
                "confirmation_recipients": "${email}",
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["message", "name", "email"],
                        },
                    ],
                    "properties": {
                        "message": {"title": "Message"},
                        "name": {"title": "Name"},
                        "email": {},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "data": {
                    "message": "just want to say hi",
                    "name": "Smith",
                    "email": "smith@doe.com",
                },
                "block_id": "form-id",
            },
        )
        transaction.commit()

        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        parsed_msg = Parser().parsestr(msg)
        msg = re.sub(r"\s+", " ", msg)
        assert parsed_msg.get("from") == "site_addr@plone.com"
        assert parsed_msg.get("to") == "smith@doe.com"
        assert parsed_msg.get("subject") == "Form Submission"
        assert "<strong>Name:</strong> Smith" in msg

    def test_email_body_formatted_as_table(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
                "email_format": "table",
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["message", "name"],
                        },
                    ],
                    "properties": {
                        "message": {"title": "Message"},
                        "name": {"title": "Name"},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "data": {"message": "just want to say hi", "name": "John"},
                "block_id": "form-id",
            },
        )
        transaction.commit()
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg).replace(" >", ">")

        assert """<table border="1">""" in msg
        assert "</table>" in msg
        assert (
            f"<caption>Form submission data for {self.document.title}</caption>" in msg
        )
        assert """<th align="left" role="columnheader" scope="col">Field</th>""" in msg
        assert """<th align="left" role="columnheader" scope="col">Value</th>""" in msg

        assert """<th align="left" role="rowheader" scope="row">Name</th>""" in msg

        assert f'<td align="left">John</td>' in msg
        assert """<th align="left" role="rowheader" scope="row">""" in msg
        assert f'<td align="left">just want to say hi</td>' in msg

    def test_email_body_formatted_as_list(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
                "email_format": "list",
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["message", "name"],
                        },
                    ],
                    "properties": {
                        "message": {"title": "Message"},
                        "name": {"title": "Name"},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "data": {"message": "just want to say hi", "name": "John"},
                "block_id": "form-id",
            },
        )
        transaction.commit()
        assert response.status_code == 200
        msg = self.mailhost.messages[0].decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Name:</strong> John" in msg
