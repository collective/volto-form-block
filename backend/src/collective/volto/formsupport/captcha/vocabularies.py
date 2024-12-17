from ..interfaces import ICaptchaSupport
from plone import api
from zope.component import getAdapters
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


@provider(IVocabularyFactory)
def captcha_providers_vocabulary_factory(context):
    terms = []
    for name, adapter in getAdapters((context, context.REQUEST), ICaptchaSupport):
        if adapter.isEnabled():
            terms.append(SimpleTerm(value=name, token=name, title=adapter.name))
    return SimpleVocabulary(terms)


@provider(IVocabularyFactory)
def mail_templates_vocabulary_factory(context):
    name = "schemaform.mail_templates"
    registry_record_value = api.portal.get_registry_record(name)
    items = list(registry_record_value.keys())
    return SimpleVocabulary.fromItems([[item, item, item] for item in items])
