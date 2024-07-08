"""Installer for the collective.volto.formsupport package."""

from pathlib import Path
from setuptools import find_packages
from setuptools import setup


long_description = f"""
{Path("README.md").read_text()}\n
{Path("CONTRIBUTORS.md").read_text()}\n
{Path("CHANGES.md").read_text()}\n
"""


setup(
    name="collective.volto.formsupport",
    version="3.1.1.dev0",
    description="Add support for customizable forms in Volto",
    long_description=long_description,
    long_description_content_type="text/markdown",
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Environment :: Web Environment",
        "Framework :: Plone",
        "Framework :: Plone :: Addon",
        "Framework :: Plone :: 5.2",
        "Framework :: Plone :: 6.0",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Operating System :: OS Independent",
        "License :: OSI Approved :: GNU General Public License v2 (GPLv2)",
    ],
    keywords="Python Plone CMS",
    author="RedTurtle Technology",
    author_email="sviluppo@redturtle.it",
    url="https://github.com/collective/volto-form-block",
    project_urls={
        "PyPI": "https://pypi.org/project/volto-form-block",
        "Source": "https://github.com/collective/volto-form-block",
        "Tracker": "https://github.com/collective/volto-form-block/issues",
    },
    license="GPL version 2",
    packages=find_packages("src", exclude=["ez_setup"]),
    namespace_packages=["collective", "collective.volto"],
    package_dir={"": "src"},
    include_package_data=True,
    zip_safe=False,
    python_requires=">=3.8",
    install_requires=[
        "setuptools",
        "z3c.jbot",
        "Zope",
        "plone.api>=1.8.4",
        "plone.dexterity",
        "plone.keyring",
        "plone.i18n",
        "plone.memoize",
        "plone.protect",
        "plone.registry",
        "plone.restapi>=8.36.0",
        "plone.schema",
        "Products.GenericSetup",
        "Products.PortalTransforms",
        "souper.plone",
        "click",
        "beautifulsoup4",
        "pyotp",
    ],
    extras_require={
        "test": [
            "zest.releaser[recommended]",
            "zestreleaser.towncrier",
            "plone.app.testing",
            "plone.restapi[test]",
            "pytest",
            "pytest-cov",
            "pytest-plone>=0.5.0",
            "Products.MailHost",
            "plone.browserlayer",
            "collective.MockMailHost",
            "collective.honeypot",
            "plone.formwidget.hcaptcha",
            "plone.formwidget.recaptcha",
            "collective.z3cform.norobots",
            "collective.honeypot",
        ],
        "hcaptcha": [
            "plone.formwidget.hcaptcha>=1.0.1",
        ],
        "recaptcha": [
            "plone.formwidget.recaptcha",
        ],
        "norobots": [
            "collective.z3cform.norobots",
        ],
        "honeypot": [
            "collective.honeypot>=2.1",
        ],
        "blocksfield": [
            "collective.volto.blocksfield",
        ],
    },
    entry_points="""
    [z3c.autoinclude.plugin]
    target = plone
    [console_scripts]
    update_locale = collective.volto.formsupport.locales.update:update_locale
    formsupport_data_cleansing = collective.volto.formsupport.scripts.cleansing:main
    """,
)
