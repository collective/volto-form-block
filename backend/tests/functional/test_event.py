import pytest
import re
import transaction


class TestEvent:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, mailhost, document, monkeypatch):
        monkeypatch.setenv("__TEST_EVENT_HANDLER", "1")
        self.portal = portal
        self.mailhost = mailhost
        self.document = document()
        self.document_url = self.document.absolute_url()
        self.document.blocks = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "schemaForm",
                "subject": "block subject",
                "sender": "john@doe.com",
                "send": True,
                "schema": {
                    "fieldsets": [
                        {
                            "id": "default",
                            "title": "Default",
                            "fields": ["message"],
                        },
                    ],
                    "properties": {
                        "message": {"title": "Message"},
                        "reply": {"title": "Reply"},
                    },
                    "required": [],
                },
            },
        }
        transaction.commit()

    def test_trigger_event(self, submit_form):
        response = submit_form(
            url=self.document_url,
            data={
                "data": {"message": "just want to say hi"},
                "block_id": "form-id",
            },
        )
        transaction.commit()
        assert response.status_code == 200
        assert len(self.mailhost.messages) == 1
        msg = self.mailhost.messages[0]
        msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "To: site_addr@plone.com" in msg
        assert "To: smith@doe.com" not in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Reply:</strong> hello" in msg
