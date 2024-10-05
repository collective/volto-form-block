from plone.dexterity.content import DexterityContent
from zope.interface import Attribute
from zope.interface import Interface
from zope.publisher.interfaces.browser import IDefaultBrowserLayer
from zope import schema
from ZPublisher.BaseRequest import BaseRequest

import dataclasses


class ICollectiveVoltoFormsupportLayer(IDefaultBrowserLayer):
    """Marker interface that defines a browser layer."""


class IFormDataStore(Interface):
    def add(data):
        """
        Add data to the store

        @return: record id
        """

    def length():
        """
        @return: number of items stored into store
        """

    def search(query):
        """
        @return: items that match query
        """


class IPostEvent(Interface):
    """
    Event fired when a form is submitted (before actions)
    """


class ICaptchaSupport(Interface):
    def __init__(context, request):
        """Initialize adapter"""

    def is_enabled():
        """Captcha method enabled
        @return: True if the method is enabled/configured
        """

    def verify(data):
        """Verify the captcha
        @return: True if verified, Raise exception otherwise
        """


@dataclasses.dataclass
class FormSubmissionContext:
    context: DexterityContent
    block: dict
    form_data: dict
    request: BaseRequest

    def get_records(self) -> list:
        """
        Return field id, value, and label.

        Skips file upload fields.
        """
        records = []
        for k, v in self.form_data.items():
            field = self.block["schema"]["properties"].get(k, {})
            if field.get("type") == "object":
                continue
            records.append({
                "field_id": k,
                "value": v,
                "label": field.get("title", k),
            })
        return records

    def get_attachments(self) -> dict:
        attachments = {}
        for k, v in self.form_data.items():
            field = self.block["schema"]["properties"].get(k, {})
            if field.get("factory") == "File Upload":
                attachments[k] = v
        return attachments


class IFormSubmissionProcessor(Interface):
    """Subscriber which processes form data when it is submitted"""

    order: int = Attribute("Processors with the lowest order are processed first")

    def __init__(context: FormSubmissionContext):
        pass

    def __call__():
        """Process the data."""


DEFAULT_TEMPLATE = """
${mail_header}
<hr />
${form_fields}
<hr />
${mail_footer}
"""

class IFormSettings(Interface):

    mail_templates = schema.Dict(
        title="Email templates",
        key_type=schema.TextLine(),
        value_type=schema.Text(),
        default={
            "default": DEFAULT_TEMPLATE
        }
    )
