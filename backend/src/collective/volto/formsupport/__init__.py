"""Init and utils."""

from zope.i18nmessageid import MessageFactory

import logging


PACKAGE_NAME = "collective.volto.formsupport"

logger = logging.getLogger(PACKAGE_NAME)
_ = MessageFactory(PACKAGE_NAME)
