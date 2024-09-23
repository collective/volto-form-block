from plone import api
from plone.app.testing import SITE_OWNER_NAME
from plone.app.testing import SITE_OWNER_PASSWORD
from plone.formwidget.hcaptcha.interfaces import IHCaptchaSettings
from plone.formwidget.recaptcha.interfaces import IReCaptchaSettings
from plone.registry.interfaces import IRegistry
from plone.restapi.testing import RelativeSession
from Products.MailHost.interfaces import IMailHost
from zope.component import getUtility
from zope.component.hooks import setSite

import pytest
import transaction


@pytest.fixture
def app(api_functional):
    return api_functional["app"]


@pytest.fixture
def portal(api_functional):
    portal = api_functional["portal"]
    setSite(portal)
    api.portal.set_registry_record("plone.email_from_address", "site_addr@plone.com")
    api.portal.set_registry_record("plone.email_from_name", "Plone test site")
    transaction.commit()
    return portal


@pytest.fixture
def mailhost(portal):
    return getUtility(IMailHost)


@pytest.fixture
def submit_form(manager_request):
    def func(url, data):
        url = f"{url}/@schemaform-data"
        response = manager_request.post(
            url,
            json=data,
        )
        return response

    return func


@pytest.fixture()
def registry(portal):
    return getUtility(IRegistry)


@pytest.fixture()
def document(portal, registry):
    def func(captcha=None):
        payload = {
            "text-id": {"@type": "text"},
            "form-id": {
                "@type": "form",
                "default_from": "foo@foo.com",
                "default_bar": "bar",
                "subblocks": [
                    {"field_id": "name", "label": "Name", "type": "text"},
                    {"field_id": "surname", "label": "Surname", "type": "text"},
                ],
            },
        }
        if captcha:
            if captcha == "recaptcha":
                iface = IReCaptchaSettings
            elif captcha == "hcaptcha":
                iface = IHCaptchaSettings
            payload["form-id"]["captcha"] = captcha
            registry.registerInterface(iface)
            settings = registry.forInterface(iface)
            settings.public_key = "public"
            settings.private_key = "private"
        with api.env.adopt_roles(["Manager"]):
            document = api.content.create(
                id="document",
                type="Document",
                title="Example context",
                container=portal,
            )
            document.blocks = payload
            api.content.transition(obj=document, transition="publish")
        transaction.commit()
        return document

    return func


@pytest.fixture()
def http_request(api_functional):
    return api_functional["request"]


@pytest.fixture()
def request_factory(portal):
    def factory():
        url = portal.absolute_url()
        api_session = RelativeSession(url)
        api_session.headers.update({"Accept": "application/json"})
        return api_session

    return factory


@pytest.fixture()
def anon_request(request_factory):
    return request_factory()


@pytest.fixture()
def manager_request(request_factory):
    request = request_factory()
    request.auth = (SITE_OWNER_NAME, SITE_OWNER_PASSWORD)
    yield request
    request.auth = ()
