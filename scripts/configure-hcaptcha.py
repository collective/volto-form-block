import logging
import os

import transaction
from plone.formwidget.hcaptcha.interfaces import IHCaptchaSettings
from plone.registry.interfaces import IRegistry
from zope.component import getUtility
from zope.component.hooks import site


with site(globals()["app"][os.environ["SITE_ID"]]):
    settings = getUtility(IRegistry).forInterface(IHCaptchaSettings)
    settings.public_key = "10000000-ffff-ffff-ffff-000000000001"
    settings.private_key = "0x0000000000000000000000000000000000000000"
    transaction.commit()

logging.getLogger(__name__).warning(
    "hCaptcha test keys configured for development only; no anti-bot protection."
)
