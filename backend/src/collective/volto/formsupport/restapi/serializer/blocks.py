from collective.volto.formsupport.interfaces import ICaptchaSupport
from collective.volto.formsupport.interfaces import ICollectiveVoltoFormsupportLayer
from copy import deepcopy
from plone import api


try:
    from plone.base.interfaces import IPloneSiteRoot
except ImportError:
    from Products.CMFPlone.interfaces import IPloneSiteRoot

from plone.restapi.behaviors import IBlocks
from plone.restapi.interfaces import IBlockFieldSerializationTransformer
from zope.component import adapter
from zope.component import getMultiAdapter
from zope.interface import implementer

import os


class FormSerializer:
    """ """

    order = 200  # after standard ones
    block_type = "form"

    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, value):
        """
        If user can edit the context, return the full block data.
        Otherwise, skip default values because we need them only in edit and
        to send emails from the backend.
        """
        if value.get("captcha"):
            value["captcha_props"] = getMultiAdapter(
                (self.context, self.request),
                ICaptchaSupport,
                name=value["captcha"],
            ).serialize()
        attachments_limit = os.environ.get("FORM_ATTACHMENTS_LIMIT", "")
        if attachments_limit:
            value["attachments_limit"] = attachments_limit
        if api.user.has_permission("Modify portal content", obj=self.context):
            return value
        return {k: v for k, v in value.items() if not k.startswith("default_")}


@implementer(IBlockFieldSerializationTransformer)
@adapter(IBlocks, ICollectiveVoltoFormsupportLayer)
class FormSerializerContents(FormSerializer):
    """Deserializer for content-types that implements IBlocks behavior"""


@implementer(IBlockFieldSerializationTransformer)
@adapter(IPloneSiteRoot, ICollectiveVoltoFormsupportLayer)
class FormSerializerRoot(FormSerializer):
    """Deserializer for site-root"""


class SchemaFormBlockSerializer:
    """ """

    order = 200  # after standard ones
    block_type = "schemaForm"

    def __init__(self, context, request):
        self.context = context
        self.request = request

    def __call__(self, value):
        """
        If user can edit the context, return the full block data.
        Otherwise, skip default values because we need them only in edit and
        to send emails from the backend.
        """
        if value.get("captcha"):
            value["captcha_props"] = getMultiAdapter(
                (self.context, self.request),
                ICaptchaSupport,
                name=value["captcha"],
            ).serialize()

            new_schema = deepcopy(value["schema"])
            new_schema["properties"]["captchaWidget"] = {
                "title": value["captcha"],
                "widget": value["captcha"],
                "captcha_props": value["captcha_props"],
            }
            if "captchaWidget" not in new_schema["fieldsets"][0]["fields"]:
                new_schema["fieldsets"][0]["fields"].append("captchaWidget")
            value["schema"] = new_schema
        attachments_limit = os.environ.get("FORM_ATTACHMENTS_LIMIT", "")
        if attachments_limit:
            value["attachments_limit"] = attachments_limit
        if api.user.has_permission("Modify portal content", obj=self.context):
            return value
        return {k: v for k, v in value.items() if not k.startswith("default_")}


@implementer(IBlockFieldSerializationTransformer)
@adapter(IBlocks, ICollectiveVoltoFormsupportLayer)
class SchemaFormBlockSerializerContents(SchemaFormBlockSerializer):
    """Deserializer for content-types that implements IBlocks behavior"""


@implementer(IBlockFieldSerializationTransformer)
@adapter(IPloneSiteRoot, ICollectiveVoltoFormsupportLayer)
class SchemaFormBlockSerializerRoot(SchemaFormBlockSerializer):
    """Deserializer for site-root"""
