from plone import api
from Products.Five.browser import BrowserView


class EmailConfirmView(BrowserView):
    def __call__(self, token="alksdjfakls", *args, **kwargs):  # noqa: S107
        self.token = token

        return super().__call__(*args, **kwargs)

    def get_token(self):
        return self.token

    def get_portal(self):
        return api.portal.get()

    def context_url(self):
        return self.context.absolute_url()
