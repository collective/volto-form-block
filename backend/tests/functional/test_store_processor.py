from datetime import datetime
from io import StringIO

import csv
import pytest
import transaction


@pytest.fixture
def export_data(manager_request):
    def func(url):
        url = f"{url}/@form-data"
        response = manager_request.get(url)
        return response

    return func


@pytest.fixture
def export_csv(manager_request):
    def func(url):
        url = f"{url}/@form-data-export"
        response = manager_request.get(url)
        return response

    return func


@pytest.fixture
def clear_data(manager_request):
    def func(url):
        url = f"{url}/@form-data-clear"
        response = manager_request.delete(url)
        return response

    return func


class TestMailStore:
    @pytest.fixture(autouse=True)
    def _set_up(self, portal, document, registry):
        self.portal = portal
        self.document = document()
        self.document_url = self.document.absolute_url()
        transaction.commit()

    def test_unable_to_store_data(self, submit_form):
        """empty form data, unable to store data"""
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "store": True,
            },
        }
        transaction.commit()

        response = submit_form(
            url=self.document_url,
            data={
                "block_id": "form-id",
            },
        )
        transaction.commit()
        assert response.status_code == 400
        assert response.json()["message"] == "Empty form data."

    def test_store_data(self, submit_form, export_data, export_csv, clear_data):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "store": True,
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
                "data": {
                    "message": "just want to say hi",
                    "name": "John",
                    "foo": "skip this",
                },
                "block_id": "form-id",
            },
        )
        transaction.commit()
        assert response.status_code == 200
        response = export_data(self.document_url)
        data = response.json()
        assert len(data["items"]) == 1
        item = data["items"][0]
        assert sorted(item.keys()) == [
            "__expired",
            "block_id",
            "date",
            "id",
            "message",
            "name",
        ]
        assert item["message"] == {"label": "Message", "value": "just want to say hi"}
        assert item["name"] == {"label": "Name", "value": "John"}
        response = submit_form(
            url=self.document_url,
            data={
                "data": {"message": "bye", "name": "Sally"},
                "block_id": "form-id",
            },
        )
        transaction.commit()
        assert response.status_code == 200
        response = export_data(self.document_url)
        data = response.json()
        assert len(data["items"]) == 2
        for item in data["items"]:
            assert sorted(item.keys()) == [
                "__expired",
                "block_id",
                "date",
                "id",
                "message",
                "name",
            ]
        sorted_data = sorted(data["items"], key=lambda x: x["name"]["value"])
        assert sorted_data[0]["name"]["value"] == "John"
        assert sorted_data[0]["message"]["value"] == "just want to say hi"
        assert sorted_data[1]["name"]["value"] == "Sally"
        assert sorted_data[1]["message"]["value"] == "bye"

        # clear data
        response = clear_data(self.document_url)
        assert response.status_code == 204
        response = export_csv(self.document_url)
        data = [*csv.reader(StringIO(response.text), delimiter=",")]
        assert len(data) == 1
        assert data[0] == ["date"]

    def test_export_csv(self, submit_form, export_csv):
        self.document.blocks = {
            "form-id": {
                "@type": "schemaForm",
                "store": True,
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
                "data": {
                    "message": "just want to say hi",
                    "name": "John",
                    "foo": "skip this",
                },
                "block_id": "form-id",
            },
        )

        response = submit_form(
            url=self.document_url,
            data={
                "data": {"message": "bye", "name": "Sally"},
                "block_id": "form-id",
            },
        )

        assert response.status_code == 200
        response = export_csv(self.document_url)
        data = [*csv.reader(StringIO(response.text), delimiter=",")]
        assert len(data) == 3
        assert data[0] == ["Message", "Name", "date"]
        sorted_data = sorted(data[1:])
        assert sorted_data[0][:-1] == ["bye", "Sally"]
        assert sorted_data[1][:-1] == ["just want to say hi", "John"]

        # check date column. Skip seconds because can change during test
        now = datetime.now().strftime("%Y-%m-%dT%H:%M")
        assert sorted_data[0][-1].startswith(now)
        assert sorted_data[1][-1].startswith(now)
