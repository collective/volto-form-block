from plone.dexterity.interfaces import IDexterityContent
from plone.restapi.bbb import IPloneSiteRoot
from plone.restapi.interfaces import IBlockFieldDeserializationTransformer
from Products.PortalTransforms.transforms.safe_html import SafeHTML
from zope.component import adapter
from zope.interface import implementer
from zope.publisher.interfaces.browser import IBrowserRequest


class FormBlockDeserializerBase:
    """FormBlockDeserializerBase."""

    order = 100

    block_type = "form"

    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, value):
        """
        Do not store html but only plaintext
        """
        if value.get("send_message", ""):
            transform = SafeHTML()
            value["send_message"] = transform.scrub_html(value["send_message"])
        return value


@adapter(IDexterityContent, IBrowserRequest)
@implementer(IBlockFieldDeserializationTransformer)
class FormBlockDeserializer(FormBlockDeserializerBase):
    """Deserializer for content-types that implements IBlocks behavior"""


@adapter(IPloneSiteRoot, IBrowserRequest)
@implementer(IBlockFieldDeserializationTransformer)
class FormBlockDeserializerRoot(FormBlockDeserializerBase):
    """Deserializer for site root"""
