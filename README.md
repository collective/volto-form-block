# Volto Add-on (volto-form-block)

Volto addon which adds a customizable form using a block.
Intended to be used with [collective.volto.formsupport](https://github.com/collective/collective.volto.formsupport).

[![npm](https://img.shields.io/npm/v/volto-form-block)](https://www.npmjs.com/package/volto-form-block)
[![](https://img.shields.io/badge/-Storybook-ff4785?logo=Storybook&logoColor=white&style=flat-square)](https://collective.github.io/volto-form-block/)
[![Code analysis checks](https://github.com/collective/volto-form-block/actions/workflows/code.yml/badge.svg)](https://github.com/collective/volto-form-block/actions/workflows/code.yml)
[![Unit tests](https://github.com/collective/volto-form-block/actions/workflows/unit.yml/badge.svg)](https://github.com/collective/volto-form-block/actions/workflows/unit.yml)

## Compatibility

> **Note**: Since version v2.0.0 of this addon, it's required [collective.volto.formsupport](https://github.com/collective/collective.volto.formsupport) 2.0.0 or higher (and its upgrade steps).
>
> **Note**: Since version v2.1.2 of this addon, it's required Volto 14.2.0
>
> **Note**: Since version v3.0.0 of this addon, it's required Volto >= 16.0.0-alpha.38

## Features

This addon will add in your project the Form block and the needed reducers.

<img alt="Form block in chooser" src="./docs/form-block-chooser.png" width="300" />

![Form block view](./docs/form-block-view.png)

Using the engine of subblocks, you can manage form fields adding, sorting and deleting items.

For each field, you can select the field type from:

- Text
- Textarea
- Select
- Single choice (radio buttons)
- Multiple choice (checkbox buttons)
- Checkbox
- Date picker
- File upload with DnD
- E-mail
- Static rich text (not a fillable field, just text to display between other fields)

For every field you can set a label and a help text.
For select, radio and checkbox fields, you can select a list of values.

## Captcha verification

This form addon is configured to work with [HCaptcha](https://www.hcaptcha.com), [ReCaptcha](https://www.google.com/recaptcha/) and
[NoRobot](https://github.com/collective/collective.z3cform.norobots) to prevent spam.

In order to make one of these integrations work, you need to add
[https://github.com/plone/plone.formwidget.hcaptcha](https://github.com/plone/plone.formwidget.hcaptcha) and/or
[https://github.com/plone/plone.formwidget.recaptcha](https://github.com/plone/plone.formwidget.recaptcha) and/or
[https://github.com/collective/collective.z3cform.norobots](https://github.com/collective/collective.z3cform.norobots)
Plone addon and configure public and private keys in controlpanels.

### HCaptcha

With HCaptcha integration, you also have an additional option in the sidebar in 'Captcha provider' to enable or disable the invisible captcha (see implications [here](https://docs.hcaptcha.com/faq#do-i-need-to-display-anything-on-the-page-when-using-hcaptcha-in-invisible-mode)).

In some test scenarios it's found that the "Passing Threshold" of HCaptcha must be configured as "Auto" to get the best results. In some test cases if one sets the Threshold to "Moderate" HCaptcha starts to fail.

### OTP email validation

To prevent sending spam emails to users via the email address configured as sender, the 'email' fields type flagged as BCC will require the user to enter an OTP code received at the address entered in the field when user fills out the form.

## Export

With backend support, you can store data submitted from the form.
In Edit, you can export and clear stored data from the sidebar.

<img alt="Form export" src="./docs/store-export-data.png" width="400" />

## Additional fields

In addition to the fields described above, you can add any field you want.
If you need a field that is not supported, PRs are always welcome, but if you have to use a custom field tailored on your project needs, then you can add additional custom fields.

```jsx
config.blocks.blocksConfig.form.additionalFields.push({
  id: 'field type id',
  label:
    intl.formatMessage(messages.customFieldLabel) ||
    'Label for field type select, translation obj or string',
  component: MyCustomWidget,
  isValid: (formData, name) => true,
});
```

The widget component should have the following firm:

```js
({
  id,
  name,
  title,
  description,
  required,
  onChange,
  value,
  isDisabled,
  invalid,
}) => ReactElement;
```

You should also pass a function to validate your field's data.
The `isValid` function accepts `formData` (the whole form data) and the name of the field, thus you can access to your fields' data as `formData[name]` but you also have access to other fields.

`isValid` has the firm:

```js
(formData, name) => boolean;
```

Example custom field [here](https://gist.github.com/nzambello/30949078616328e6ee0293e5b302bb40).

## Static fields

In backend integration, you can add in block data an object called `static_fields` and the form block will show those in form view as readonly and will aggregate those with user compiled data.

i.e.: aggregated data from user federated authentication:

![Static fields](./docs/form-static-fields.png)

## Schema validators

If you want to validate configuration field (for example, testing if 'From email' is an address of a specific domain), you could add your validation functions to block config:

```js
config.blocks.blocksConfig.form = {
  ...config.blocks.blocksConfig.form,
  schemaValidators: {
    fieldname: yourValidationFN(data),
  },
};
```

`yourValidationFN` have to return:

- null if field is valid
- a string with the error message if field is invalid.

## Upgrade guide

To upgrade to version 2.4.0 you need to:

- remove the env vars
- install [https://github.com/plone/plone.formwidget.hcaptcha](https://github.com/plone/plone.formwidget.hcaptcha) or [https://github.com/plone/plone.formwidget.recaptcha](https://github.com/plone/plone.formwidget.recaptcha) or both in Plone.
- insert private and public keys in Plone HCaptcha controlpanel or/and Plone ReCaptcha controlpanel.

## Video demos

- [Form usage](https://youtu.be/v5KtjEACRmI)
- [Form editing](https://youtu.be/wmTpzYBtNCQ)
- [Export stored data](https://youtu.be/3zVUaGaaVOg)

## VERSIONS

With volto-form-block@2.5.0 you need to upgrade collective.volto.formsupport to version 2.4.0

## Installation

To install your project, you must choose the method appropriate to your version of Volto.


### Volto 17 and earlier

Create a new Volto project (you can skip this step if you already have one):

```
npm install -g yo @plone/generator-volto
yo @plone/volto my-volto-project --addon volto-form-block
cd my-volto-project
```

Add `volto-form-block` to your package.json:

```JSON
"addons": [
    "volto-form-block"
],

"dependencies": {
    "volto-form-block": "*"
}
```

Download and install the new add-on by running:

```
yarn install
```

Start volto with:

```
yarn start
```

### Volto 18 and later

Add `volto-form-block` to your add-on `package.json`:

```json
"dependencies": {
    "volto-form-block": "*"
}
```

## Test installation

Visit http://localhost:3000/ in a browser, login, and check the awesome new features.


## Development

The development of this add-on is done in isolation using a new approach using pnpm workspaces and latest `mrs-developer` and other Volto core improvements.
For this reason, it only works with pnpm and Volto 18 (currently in alpha).


### Pre-requisites

-   [Node.js](https://6.docs.plone.org/install/create-project.html#node-js)
-   [Make](https://6.docs.plone.org/install/create-project.html#make)
-   [Docker](https://6.docs.plone.org/install/create-project.html#docker)


### Make convenience commands

Run `make help` to list the available commands.

```text
help                             Show this help
install                          Installs the add-on in a development environment
start                            Starts Volto, allowing reloading of the add-on during development
build                            Build a production bundle for distribution of the project with the add-on
i18n                             Sync i18n
ci-i18n                          Check if i18n is not synced
format                           Format codebase
lint                             Lint, or catch and remove problems, in code base
release                          Release the add-on on npmjs.org
release-dry-run                  Dry-run the release of the add-on on npmjs.org
test                             Run unit tests
ci-test                          Run unit tests in CI
backend-docker-start             Starts a Docker-based backend for development
storybook-start                  Start Storybook server on port 6006
storybook-build                  Build Storybook
acceptance-frontend-dev-start    Start acceptance frontend in development mode
acceptance-frontend-prod-start   Start acceptance frontend in production mode
acceptance-backend-start         Start backend acceptance server
ci-acceptance-backend-start      Start backend acceptance server in headless mode for CI
acceptance-test                  Start Cypress in interactive mode
ci-acceptance-test               Run cypress tests in headless mode for CI
```

### Development environment set up

Install package requirements.

```shell
make install
```

### Start developing

Start the backend.

```shell
make backend-docker-start
```

In a separate terminal session, start the frontend.

```shell
make start
```

### Lint code

Run ESlint, Prettier, and Stylelint in analyze mode.

```shell
make lint
```

### Format code

Run ESlint, Prettier, and Stylelint in fix mode.

```shell
make format
```

### i18n

Extract the i18n messages to locales.

```shell
make i18n
```

### Unit tests

Run unit tests.

```shell
make test
```

### Run Cypress tests

Run each of these steps in separate terminal sessions.

In the first session, start the frontend in development mode.

```shell
make acceptance-frontend-dev-start
```

In the second session, start the backend acceptance server.

```shell
make acceptance-backend-start
```

In the third session, start the Cypress interactive test runner.

```shell
make acceptance-test
```

## License

The project is licensed under the MIT license.

## Credits and Acknowledgements 🙏

Crafted with care by **Generated using [Cookieplone (0.7.1)](https://github.com/plone/cookieplone) and [cookiecutter-plone (aee0d59)](https://github.com/plone/cookiecutter-plone/commit/aee0d59c18bd0dd8af1da9c961014ff87a66ccfa) on 2024-07-04 10:49:50.444730**. A special thanks to all contributors and supporters!
