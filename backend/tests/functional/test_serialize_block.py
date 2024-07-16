import pytest


class TestBlockSerialization:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, document):
        self.portal = portal
        self.document = document()
        self.document_url = self.document.absolute_url()

    def test_serializer_return_full_block_data_to_admin(self, manager_request):
        response = manager_request.get(self.document_url)
        res = response.json()
        assert res["blocks"]["form-id"] == self.document.blocks["form-id"]

    def test_serializer_return_filtered_block_data_to_anon(self, anon_request):
        response = anon_request.get(self.document_url)
        res = response.json()
        assert res["blocks"]["form-id"] != self.document.blocks["form-id"]
        assert "default_from" not in res["blocks"]["form-id"]
        assert "default_foo" not in res["blocks"]["form-id"]
        assert "subblocks" in res["blocks"]["form-id"]


class TestBlockSerializationRecaptcha:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, document):
        self.portal = portal
        self.document = document("recaptcha")
        self.document_url = self.document.absolute_url()

    def test_serializer_with_recaptcha(self, anon_request):
        response = anon_request.get(self.document_url)
        res = response.json()
        captcha_props = res["blocks"]["form-id"]["captcha_props"]
        assert captcha_props == {"provider": "recaptcha", "public_key": "public"}


class TestBlockSerializationHCaptcha:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, document):
        self.portal = portal
        self.document = document("hcaptcha")
        self.document_url = self.document.absolute_url()

    def test_serializer_with_hcaptcha(self, anon_request):
        response = anon_request.get(self.document_url)
        res = response.json()
        captcha_props = res["blocks"]["form-id"]["captcha_props"]
        assert captcha_props == {"provider": "hcaptcha", "public_key": "public"}


class TestBlockSerializationAttachmentsLimit:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, document):
        self.portal = portal
        self.document = document()
        self.document_url = self.document.absolute_url()

    def test_serializer_without_attachments_limit(self, anon_request):
        response = anon_request.get(self.document_url)
        res = response.json()
        assert "attachments_limit" not in res["blocks"]["form-id"]
