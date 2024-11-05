#!/bin/bash
# i18ndude should be available in current $PATH (eg by running
# ``export PATH=$PATH:$BUILDOUT_DIR/bin`` when i18ndude is located in your buildout's bin directory)
#
# For every language you want to translate into you need a
# locales/[language]/LC_MESSAGES/collective.volto.formsupport.po
# (e.g. locales/de/LC_MESSAGES/collective.volto.formsupport.po)

domain=collective.volto.formsupport

pipx run i18ndude rebuild-pot --pot $domain.pot --create $domain ../
pipx run i18ndude sync --pot $domain.pot */LC_MESSAGES/$domain.po
