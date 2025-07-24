from collective.volto.formsupport.captcha import hcaptcha
from collective.volto.formsupport.captcha import recaptcha
from collective.z3cform.norobots.browser.interfaces import INorobotsWidgetSettings
from hashlib import md5
from plone.formwidget.hcaptcha.interfaces import IHCaptchaSettings
from plone.formwidget.recaptcha.interfaces import IReCaptchaSettings
from unittest.mock import Mock

import json
import pytest
import transaction


@pytest.fixture
def set_captcha_settings(registry):
    def func(iface, set_values: bool = False):
        settings = registry.forInterface(iface)
        if set_values:
            settings.public_key = "public"
            settings.private_key = "private"
        transaction.commit()

    return func


class TestCaptchaReCaptcha:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, document, registry):
        self.portal = portal
        self.document = document()
        self.document_url = self.document.absolute_url()
        self.iface = IReCaptchaSettings
        self.registry = registry
        self.registry.registerInterface(self.iface)
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

    def test_recaptcha_no_settings(self, submit_form, set_captcha_settings):
        set_captcha_settings(self.iface)
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
        assert response.status_code == 500
        assert response.json()["message"] == (
            "No recaptcha private key configured. Go to path/to/site/@@recaptcha-settings "  # noqa: E501
            "to configure."
        )

    def test_recaptcha_no_captcha(self, submit_form, set_captcha_settings):
        set_captcha_settings(self.iface, True)
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
        assert response.status_code == 400
        assert response.json()["message"] == "No captcha token provided."

    def test_recaptcha_wrong_captcha(
        self, monkeypatch, submit_form, set_captcha_settings
    ):
        set_captcha_settings(self.iface, True)
        mock_submit = Mock(return_value=Mock(is_valid=False))
        monkeypatch.setattr(recaptcha, "submit", mock_submit)
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
                "captcha": {"token": "12345"},
            },
        )
        mock_submit.assert_called_once_with("12345", "private", "127.0.0.1")
        assert response.status_code == 400
        assert (
            response.json()["message"]
            == "The code you entered was wrong, please enter the new one."
        )

    def test_recaptcha_correct_captcha(
        self, monkeypatch, submit_form, set_captcha_settings
    ):
        set_captcha_settings(self.iface, True)
        mock_submit = Mock(return_value=Mock(is_valid=True))
        monkeypatch.setattr(recaptcha, "submit", mock_submit)
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
                "captcha": {"token": "12345"},
            },
        )
        mock_submit.assert_called_once_with("12345", "private", "127.0.0.1")
        assert response.status_code == 200


class TestCaptchaHCaptcha:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, document, registry):
        self.portal = portal
        self.document = document()
        self.document_url = self.document.absolute_url()
        self.iface = IHCaptchaSettings
        self.registry = registry
        self.registry.registerInterface(self.iface)
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

    def test_hcaptcha_no_settings(self, submit_form, set_captcha_settings):
        set_captcha_settings(self.iface)
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
        assert response.status_code == 500
        assert response.json()["message"] == (
            "No hcaptcha private key configured. Go to path/to/site/@@hcaptcha-settings "  # noqa: E501
            "to configure."
        )

    def test_hcaptcha_no_captcha(self, submit_form, set_captcha_settings):
        set_captcha_settings(self.iface, True)
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
        assert response.status_code == 400
        assert response.json()["message"] == "No captcha token provided."

    def test_hcaptcha_wrong_captcha(
        self, monkeypatch, submit_form, set_captcha_settings
    ):
        set_captcha_settings(self.iface, True)
        mock_submit = Mock(return_value=Mock(is_valid=False))
        monkeypatch.setattr(hcaptcha, "submit", mock_submit)
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
                "captcha": {"token": "12345"},
            },
        )
        mock_submit.assert_called_once_with("12345", "private", "::1")
        assert response.status_code == 400
        assert (
            response.json()["message"]
            == "The code you entered was wrong, please enter the new one."
        )

    def test_hcaptcha_correct_captcha(
        self, monkeypatch, submit_form, set_captcha_settings
    ):
        set_captcha_settings(self.iface, True)
        mock_submit = Mock(return_value=Mock(is_valid=True))
        monkeypatch.setattr(hcaptcha, "submit", mock_submit)
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
                "captcha": {"token": "12345"},
            },
        )
        mock_submit.assert_called_once_with("12345", "private", "::1")
        assert response.status_code == 200


class TestCaptchaHoneypot:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, document, registry):
        self.portal = portal
        self.document = document()
        self.document_url = self.document.absolute_url()
        self.iface = IHCaptchaSettings
        self.registry = registry
        self.registry.registerInterface(self.iface)
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

    def test_honeypot_installed_but_field_not_in_form(self, submit_form):
        self.document.blocks["form-id"]["subblocks"] = self.document.blocks["form-id"][
            "subblocks"
        ][:-1]
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
                ],
                "block_id": "form-id",
            },
        )
        assert response.status_code == 400
        assert response.json()["message"] == "Error submitting form."

    def test_honeypot_field_in_form_empty_pass_validation(self, submit_form):
        response = submit_form(
            url=self.document_url,
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
        transaction.commit()
        assert response.status_code == 200

    def test_honeypot_field_in_form_compiled_fail_validation(self, submit_form):
        response = submit_form(
            url=self.document_url,
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
        assert response.status_code == 400
        assert response.json()["message"] == "Error submitting form."

    def test_form_submitted_from_volto_valid(self, submit_form):
        """
        when you compile the form from volto, the honey field value is passed into
        captcha value
        """
        self.document.blocks["form-id"]["subblocks"] = [
            {
                "field_id": "contact",
                "field_type": "from",
                "use_as_bcc": True,
            },
            {
                "field_id": "message",
                "field_type": "text",
            },
        ]
        transaction.commit()
        captcha_token = json.dumps({"id": "protected_1", "value": "foo"})
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
                "captcha": {
                    "provider": "honey",
                    "token": captcha_token,
                    "value": "",
                },
            },
        )
        assert response.status_code == 200


class TestCaptchaNoRobots:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, document, registry):
        self.portal = portal
        self.document = document()
        self.document_url = self.document.absolute_url()
        self.iface = INorobotsWidgetSettings
        self.registry = registry
        self.registry.registerInterface(self.iface)
        settings = self.registry.forInterface(self.iface)
        settings.questions = ("Write five using ciphers::5", "How much is 10 + 4::14")
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

    def test_no_robots_correct_captcha(self, submit_form):
        captcha_token = json.dumps({
            "value": "5",
            "id": "question0",
            "id_check": md5(
                "Write five using ciphers".encode("ascii", "ignore")
            ).hexdigest(),
        })
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
                "captcha": {"provider": "norobots-captcha", "token": captcha_token},
            },
        )
        assert response.status_code == 200

    def test_norobots_wrong_captcha(self, submit_form):
        captcha_token = json.dumps({
            "value": "15",
            "id": "question0",
            "id_check": md5(
                "Write five using ciphers".encode("ascii", "ignore")
            ).hexdigest(),
        })
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
                "captcha": {"provider": "norobots-captcha", "token": captcha_token},
            },
        )
        assert response.status_code == 400
        assert (
            response.json()["message"]
            == "The code you entered was wrong, please enter the new one."
        )


class TestCaptchaVocabulary:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, registry):
        self.portal = portal
        self.registry = registry

    def test_no_adapters(self, manager_request):
        url = "/@vocabularies/collective.volto.formsupport.captcha.providers"
        response = manager_request.get(url)
        assert response.status_code == 200
        data = response.json()
        # no adapters configured
        assert data["@id"].endswith(url)

        # honeypot is always active if it's in buildout
        assert data["items_total"] == 1
        assert data["items"] == [{"title": "Honeypot Support", "token": "honeypot"}]

    @pytest.mark.parametrize(
        "iface,token,title",
        [
            [IReCaptchaSettings, "recaptcha", "Google ReCaptcha"],
            [IHCaptchaSettings, "hcaptcha", "HCaptcha"],
        ],
    )
    def test_adapters(self, manager_request, set_captcha_settings, iface, token, title):
        url = "/@vocabularies/collective.volto.formsupport.captcha.providers"
        self.registry.registerInterface(iface)
        set_captcha_settings(iface, True)
        transaction.commit()
        response = manager_request.get(url)
        assert response.status_code == 200
        data = response.json()
        filtered_items = [item for item in data["items"] if item["token"] == token]
        assert filtered_items == [{"title": title, "token": token}]
        self.registry.registerInterface(iface)
