from .form_data import FormData
from collective.volto.formsupport.interfaces import IFormDataStore
from plone.restapi.deserializer import json_body
from plone.restapi.services import Service
from zope.component import getMultiAdapter


class FormDataClear(Service):
    def reply(self):
        form_data = json_body(self.request)
        block_id = form_data.get("block_id")
        expired = form_data.get("expired")
        store = getMultiAdapter((self.context, self.request), IFormDataStore)

        if expired or block_id:
            data = FormData(self.context, self.request, block_id=block_id)
            if expired:
                for item in data.get_expired_items():
                    store.delete(item["id"])
            else:
                for item in data.get_items():
                    store.delete(item["id"])
        else:
            store.clear()
        return self.reply_no_content()
