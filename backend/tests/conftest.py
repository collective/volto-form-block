from collective.volto.formsupport.testing import API_FUNCTIONAL_TESTING
from collective.volto.formsupport.testing import FUNCTIONAL_TESTING
from collective.volto.formsupport.testing import INTEGRATION_TESTING
from pytest_plone import fixtures_factory


pytest_plugins = ["pytest_plone"]


globals().update(
    fixtures_factory((
        (API_FUNCTIONAL_TESTING, "api_functional"),
        (FUNCTIONAL_TESTING, "functional"),
        (INTEGRATION_TESTING, "integration"),
    ))
)
