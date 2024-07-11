from collective.volto.formsupport.testing import (
    VOLTO_FORMSUPPORT_API_FUNCTIONAL_TESTING,  # ,
)
from copy import deepcopy
from plone import api
from plone.app.testing import setRoles
from plone.app.testing import SITE_OWNER_NAME
from plone.app.testing import SITE_OWNER_PASSWORD
from plone.app.testing import TEST_USER_ID
from plone.restapi.testing import RelativeSession

import transaction
import unittest


class TestBlockDeserialization(unittest.TestCase):
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

    def test_deserializer_cleanup_data_in_send_message_field(self):
        new_blocks = deepcopy(self.document.blocks)
        new_blocks["form-id"][
            "send_message"
        ] = "<b onmouseover=\"alert('XSS testing!')\">click here</b><p><i>keep tags</i></p>"  # noqa: E501
        self.api_session.patch(
            self.document_url,
            json={"blocks": new_blocks},
        )
        transaction.commit()

        self.assertEqual(
            self.document.blocks["form-id"]["send_message"],
            "<b>click here</b><p><i>keep tags</i></p>",
        )
