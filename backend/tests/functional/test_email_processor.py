from pathlib import Path

import base64
import email
import pytest
import re
import transaction


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

        msg = self.mailhost.messages[0]
        msg = email.message_from_bytes(msg, policy=email.policy.default)
        assert msg["Subject"] == "Form Submission"
        assert msg["From"] == "Plone test site <site_addr@plone.com>"
        assert msg["To"] == "site_addr@plone.com"
        assert msg["Reply-To"] == "Plone test site <site_addr@plone.com>"

    def test_email_sent_with_only_fields_from_schema(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
                "sender": "john@doe.com",
                "sender_name": "John Doe",
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

        msg = self.mailhost.messages[0]
        msg = email.message_from_bytes(msg, policy=email.policy.default)
        body = msg.get_body().get_content()
        assert msg["Subject"] == "test subject"
        assert msg["From"] == "Plone test site <site_addr@plone.com>"
        assert msg["To"] == "site_addr@plone.com"
        assert msg["Reply-To"] == "John Doe <john@doe.com>"
        assert "<th>foo</th><td>foo</td>" in body
        assert "<th>bar</th><td>bar</td>" not in body

    def test_email_sent_with_site_recipient(self, submit_form):
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
        msg = self.mailhost.messages[0]
        msg = email.message_from_bytes(msg, policy=email.policy.default)
        body = msg.get_body().get_content()
        assert msg["Subject"] == "test subject"
        assert msg["From"] == "Plone test site <site_addr@plone.com>"
        assert msg["To"] == "site_addr@plone.com"
        assert msg["Reply-To"] == "Plone test site <site_addr@plone.com>"
        assert "<th>Message</th><td>just want to say hi</td>" in body
        assert "<th>Name</th><td>John</td>" in body

    def test_email_sent_with_forwarded_headers(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
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
        msg = self.mailhost.messages[0]
        msg = email.message_from_bytes(msg, policy=email.policy.default)
        body = msg.get_body().get_content()
        assert msg["Subject"] == "test subject"
        assert msg["From"] == "Plone test site <site_addr@plone.com>"
        assert msg["To"] == "site_addr@plone.com"
        assert msg["Reply-To"] == "Plone test site <site_addr@plone.com>"
        assert "<th>Message</th><td>just want to say hi</td>" in body
        assert "<th>Name</th><td>John</td>" in body
        assert "REMOTE_ADDR" in msg
        assert "PATH_INFO" in msg

    def test_email_sent_with_block_recipient_if_set(self, submit_form):
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "schemaForm",
                "recipients": "to@block.com",
                "send": True,
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
        msg = self.mailhost.messages[0]
        msg = email.message_from_bytes(msg, policy=email.policy.default)
        body = msg.get_body().get_content()
        assert msg["Subject"] == "test subject"
        assert msg["From"] == "Plone test site <site_addr@plone.com>"
        assert msg["To"] == "to@block.com"
        assert msg["Reply-To"] == "Plone test site <site_addr@plone.com>"
        assert "<th>Message</th><td>just want to say hi</td>" in body
        assert "<th>Name</th><td>John</td>" in body

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
        msg = self.mailhost.messages[0]
        msg = email.message_from_bytes(msg, policy=email.policy.default)
        body = msg.get_body().get_content()
        assert msg["Subject"] == "just want to say hi"
        assert msg["From"] == "Plone test site <site_addr@plone.com>"
        assert msg["To"] == "site_addr@plone.com"
        assert msg["Reply-To"] == "Plone test site <site_addr@plone.com>"
        assert "<th>Message</th><td>just want to say hi</td>" in body
        assert "<th>Name</th><td>John</td>" in body

    def test_email_with_sender_from_form_data(self, submit_form):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "send": True,
                "sender": "${email}",
                "sender_name": "${name}",
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
        msg = self.mailhost.messages[0]
        msg = email.message_from_bytes(msg, policy=email.policy.default)
        body = msg.get_body().get_content()
        assert msg["From"] == "Plone test site <site_addr@plone.com>"
        assert msg["To"] == "site_addr@plone.com"
        assert msg["Reply-To"] == "Smith <smith@doe.com>"
        assert "<th>Message</th><td>just want to say hi</td>" in body
        assert "<th>Name</th><td>Smith</td>" in body

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
        msg = self.mailhost.messages[0]
        msg = email.message_from_bytes(msg, policy=email.policy.default)
        assert msg["To"] == "site_addr@plone.com"
        bcc_msg = self.mailhost.messages[1]
        msg = email.message_from_bytes(bcc_msg, policy=email.policy.default)
        assert msg["To"] == "smith@doe.com"

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
        msg = self.mailhost.messages[0]
        msg = email.message_from_bytes(msg, policy=email.policy.default)
        assert msg["From"] == "Plone test site <site_addr@plone.com>"
        assert msg["To"] == "smith@doe.com"
        assert msg["Subject"] == "Form Submission"
        assert "<th>Name</th><td>Smith</td>" in msg.get_body().get_content()
