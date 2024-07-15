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
            },
        }
        transaction.commit()

    def test_trigger_event(self, submit_form):
        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 200
        assert len(self.mailhost.messages) == 1
        msg = self.mailhost.messages[0]
        msg = msg.decode("utf-8")
        msg = re.sub(r"\s+", " ", msg)
        assert "To: site_addr@plone.com" in msg
        assert "To: smith@doe.com" not in msg
        assert "<strong>Message:</strong> just want to say hi" in msg
        assert "<strong>Reply:</strong> hello" in msg
