from copy import deepcopy

import pytest
import transaction


class TestBlockDeserialization:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, document):
        self.portal = portal
        self.document = document()
        self.document_url = self.document.absolute_url()

    def test_deserializer_cleanup_data_in_send_message_field(self, manager_request):
        new_blocks = deepcopy(self.document.blocks)
        new_blocks["form-id"]["send_message"] = (
            "<b onmouseover=\"alert('XSS testing!')\">click here</b><p><i>keep tags</i></p>"  # noqa: E501
        )
        manager_request.patch(
            self.document_url,
            json={"blocks": new_blocks},
        )
        transaction.commit()

        assert (
            self.document.blocks["form-id"]["send_message"]
            == "<b>click here</b><p><i>keep tags</i></p>"
        )
