from ..interfaces import ICaptchaSupport
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
