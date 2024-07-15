from plone.app.contenttypes.testing import PLONE_APP_CONTENTTYPES_FIXTURE
from plone.app.testing import applyProfile
from plone.app.testing import FunctionalTesting
from plone.app.testing import IntegrationTesting
from plone.app.testing import PloneSandboxLayer
from plone.app.testing import quickInstallProduct
from plone.restapi.testing import PloneRestApiDXLayer
from plone.testing import z2

import collective.honeypot
import collective.MockMailHost
import collective.volto.formsupport
import plone.restapi


class VoltoFormsupportLayer(PloneSandboxLayer):
    defaultBases = (PLONE_APP_CONTENTTYPES_FIXTURE,)

    def setUpZope(self, app, configurationContext):
        # Load any other ZCML that is required for your tests.
        # The z3c.autoinclude feature is disabled in the Plone fixture base
        # layer.
        import plone.restapi

        self.loadZCML(package=plone.restapi)
        self.loadZCML(package=collective.volto.formsupport)

    def setUpPloneSite(self, portal):
        applyProfile(portal, "plone.restapi:blocks")
        applyProfile(portal, "collective.volto.formsupport:default")

        # Mock the validate email tocken function
        def validate_email_token_mock(*args, **kwargs):
            return True

        from collective.volto.formsupport import utils

        utils.validate_email_token = validate_email_token_mock


FIXTURE = VoltoFormsupportLayer()


INTEGRATION_TESTING = IntegrationTesting(
    bases=(FIXTURE,),
    name="VoltoFormsupportLayer:IntegrationTesting",
)


FUNCTIONAL_TESTING = FunctionalTesting(
    bases=(FIXTURE,),
    name="VoltoFormsupportLayer:FunctionalTesting",
)


class VoltoFormsupportRestApiLayer(PloneRestApiDXLayer):
    defaultBases = (PLONE_APP_CONTENTTYPES_FIXTURE,)

    def setUpZope(self, app, configurationContext):
        import collective.volto.formsupport.testing

        super().setUpZope(app, configurationContext)
        self.loadZCML(package=collective.MockMailHost)
        self.loadZCML(package=plone.restapi)
        self.loadZCML(package=collective.honeypot)
        self.loadZCML(package=collective.volto.formsupport)
        self.loadZCML(package=collective.volto.formsupport.testing)

    def setUpPloneSite(self, portal):
        applyProfile(portal, "collective.volto.formsupport:default")
        applyProfile(portal, "plone.restapi:blocks")
        quickInstallProduct(portal, "collective.MockMailHost")
        applyProfile(portal, "collective.MockMailHost:default")


API_FIXTURE = VoltoFormsupportRestApiLayer()
API_INTEGRATION_TESTING = IntegrationTesting(
    bases=(API_FIXTURE,),
    name="VoltoFormsupportRestApiLayer:Integration",
)

API_FUNCTIONAL_TESTING = FunctionalTesting(
    bases=(API_FIXTURE, z2.ZSERVER_FIXTURE),
    name="VoltoFormsupportRestApiLayer:Functional",
)
