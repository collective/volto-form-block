from collective.volto.formsupport.actions import filter_parameters
from collective.volto.formsupport.interfaces import IFormAction
from collective.volto.formsupport.interfaces import IFormDataStore
from collective.volto.formsupport.interfaces import FormActionContext
from zExceptions import BadRequest
from zope.component import adapter
from zope.component import getMultiAdapter
from zope.interface import implementer


@implementer(IFormAction)
@adapter(FormActionContext)
class StoreFormAction:
    """Stores submitted form data"""

    def __init__(self, context):
        self.context = context.context
        self.request = context.request
        self.block = context.block
        self.data = context.data

    def __call__(self):
        store = getMultiAdapter((self.context, self.request), IFormDataStore)
        res = store.add(data=filter_parameters(self.data, self.block))
        if not res:
            raise BadRequest("Unable to store data")
