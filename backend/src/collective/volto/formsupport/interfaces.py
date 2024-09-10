from plone.dexterity.content import DexterityContent
from zope.interface import Interface
from zope.publisher.interfaces.browser import IDefaultBrowserLayer
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
class FormActionContext:
    context: DexterityContent
    action: dict
    block: dict
    data: dict
    request: BaseRequest


class IFormAction(Interface):
    """Adapter which processes form data when it is submitted"""

    def __init__(context: FormActionContext):
        pass

    def __call__():
        """Process the data."""
