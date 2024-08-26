from collective.volto.formsupport import logger
from collective.volto.formsupport.interfaces import IFormDataStore
from collective.volto.formsupport.utils import get_blocks
from copy import deepcopy
from datetime import datetime
from plone.dexterity.interfaces import IDexterityContent
from plone.restapi.deserializer import json_body
from repoze.catalog.catalog import Catalog
from repoze.catalog.indexes.field import CatalogFieldIndex
from souper.interfaces import ICatalogFactory
from souper.soup import get_soup
from souper.soup import NodeAttributeIndexer
from souper.soup import Record
from zope.component import adapter
from zope.interface import implementer
from zope.interface import Interface


@implementer(ICatalogFactory)
class FormDataSoupCatalogFactory:
    def __call__(self, context):
        # do not set any index here..maybe on each form
        catalog = Catalog()
        block_id_indexer = NodeAttributeIndexer("block_id")
        catalog["block_id"] = CatalogFieldIndex(block_id_indexer)
        return catalog


@implementer(IFormDataStore)
@adapter(IDexterityContent, Interface)
class FormDataStore:
    def __init__(self, context, request):
        self.context = context
        self.request = request

    @property
    def soup(self):
        return get_soup("form_data", self.context)

    @property
    def block_id(self):
        data = json_body(self.request)
        if not data:
            data = self.request.form
        return data.get("block_id", "")

    def get_form_fields(self):
        blocks = get_blocks(self.context)
        if not blocks:
            return {}
        block = blocks.get(self.block_id, {})
        block_type = block.get("@type", "")
        if block_type == "schemaForm":
            return [
                {"field_id": name, "label": field.get("title", name)}
                for name, field in block["schema"]["properties"].items()
            ]
        elif block_type == "form":
            subblocks = block.get("subblocks", [])
            # Add the 'custom_field_id' field back in as this isn't stored with each
            # subblock
            for index, field in enumerate(subblocks):
                if block.get(field["field_id"]):
                    subblocks[index]["custom_field_id"] = block.get(field["field_id"])
            return subblocks
        return {}

    def add(self, data):
        form_fields = self.get_form_fields()
        if not form_fields:
            logger.error(
                f'Block with id {self.block_id} and type "form" not found in context: {self.context.absolute_url()}.'  # noqa: E501
            )
            return None

        fields = {
            x["field_id"]: x.get("custom_field_id", x.get("label", x["field_id"]))
            for x in form_fields
        }
        record = Record()
        fields_labels = {}
        fields_order = []
        for field_data in data:
            field_id = field_data.get("field_id", "")
            value = field_data.get("value", "")
            if field_id in fields:
                record.attrs[field_id] = value
                fields_labels[field_id] = fields[field_id]
                fields_order.append(field_id)
        record.attrs["fields_labels"] = fields_labels
        record.attrs["fields_order"] = fields_order
        record.attrs["date"] = datetime.now()
        record.attrs["block_id"] = self.block_id
        return self.soup.add(record)

    def length(self):
        return len([x for x in self.soup.data.values()])  # noQA: C416

    def search(self, query=None):
        if not query:
            records = sorted(
                self.soup.data.values(),
                key=lambda k: k.attrs.get("date", ""),
                reverse=True,
            )
        return records

    def delete(self, id_):
        record = self.soup.get(id_)
        del self.soup[record]

    def clear(self):
        self.soup.clear()
