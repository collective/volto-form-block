from collective.volto.formsupport.interfaces import IFormDataStore
from collective.volto.formsupport.utils import get_blocks
from datetime import datetime
from datetime import timedelta
from plone import api
from plone.memoize import view
from plone.restapi.interfaces import IExpandableElement
from plone.restapi.serializer.converters import json_compatible
from plone.restapi.services import Service
from zope.component import adapter
from zope.component import getMultiAdapter
from zope.interface import implementer
from zope.interface import Interface

import json


@implementer(IExpandableElement)
@adapter(Interface, Interface)
class FormData:
    def __init__(self, context, request, block_id=None):
        self.context = context
        self.request = request
        self.block_id = block_id or self.request.get("block_id")

    @view.memoize
    def get_items(self):
        block = self.form_block
        items = []
        if block:
            store = getMultiAdapter((self.context, self.request), IFormDataStore)
            data_wipe = int(block.get("data_wipe") or 0)
            data = store.search()
            if data_wipe > 0:
                expire_date = datetime.now() - timedelta(days=data_wipe)
            else:
                expire_date = None
            for record in data:
                if not self.block_id or record.attrs.get("block_id") == self.block_id:
                    expanded = self.expand_records(record)
                    expanded["__expired"] = (
                        expire_date and record.attrs["date"] < expire_date
                    )
                    items.append(expanded)
        else:
            items = []
        return items

    @view.memoize
    def get_expired_items(self):
        return [item for item in self.get_items() if item["__expired"]]

    def __call__(self, expand=False):
        if not self.show_component():
            return {}
        if self.block_id:
            service_id = (
                f"{self.context.absolute_url()}/@form-data?block_id={self.block_id}"
            )
        else:
            service_id = f"{self.context.absolute_url()}/@form-data"
        result = {"form_data": {"@id": service_id}}
        if not expand:
            return result
        items = self.get_items()
        expired_total = len(self.get_expired_items())
        result["form_data"] = {
            "@id": f"{self.context.absolute_url()}/@form-data",
            "items": items,
            "items_total": len(items),
            "expired_total": expired_total,
        }
        return result

    @property
    @view.memoize
    def form_block(self):
        blocks = get_blocks(self.context)
        if isinstance(blocks, str):
            blocks = json.loads(blocks)
        if not blocks:
            return {}
        for id_, block in blocks.items():
            is_form_block = block.get("@type", "") in ("form", "schemaForm")
            if is_form_block and block.get("store", False):
                if not self.block_id or self.block_id == id_:
                    return block
        return {}

    def show_component(self):
        if not api.user.has_permission("Modify portal content", obj=self.context):
            return False
        return (self.form_block and True) or False

    def expand_records(self, record):
        fields_labels = record.attrs.get("fields_labels", {})
        data = {}
        for k, v in record.attrs.items():
            if k in ["fields_labels", "fields_order"]:
                continue
            data[k] = {
                "value": json_compatible(v),
                "label": fields_labels.get(k, k),
            }
        data["id"] = record.intid
        return data


class FormDataGet(Service):
    def reply(self):
        block_id = self.request.get("block_id")
        form_data = FormData(self.context, self.request, block_id=block_id)
        return form_data(expand=True).get("form_data", {})
