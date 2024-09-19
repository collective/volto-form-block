# collective.volto.formsupport

Add some helper routes and functionalities for Volto sites with ``form`` blocks provided by `volto-form-block <https://github.com/collective/volto-form-block>`_ Volto plugin.

## volto-form-block version

Works with volto-form-block >= v3.8.0

## plone.restapi endpoints

### `@schemaform-data`

Endpoint that the frontend should call as a submit action.

You can call it with a POST on the context where the block form is stored like this:

```shell
> curl -i -X POST http://localhost:8080/Plone/my-form/@submit-form -H 'Accept: application/json' -H 'Content-Type: application/json' --data-raw '{"block_id": "123456789", "data": [{"field_id": "foo", "value":"foo", "label": "Foo"},{"field_id": "from", "value": "support@foo.com"}, {"field_id":"name", "value": "John Doe", "label": "Name"}]}'
```

where:

- `my-form` is the context where we have a form block
- `block_id` is the id of the block
- `data` contains the submitted form data

Calling this endpoint, it will do some actions (based on block settings) and returns a `200` response with the submitted data.


### `@form-data`

This is an expansion component.

There is a rule that returns a `form-data` item into "components" slot if the user can edit the
context (**Modify portal content** permission) and there is a block that can store data.

Calling with "expand=true", this endpoint returns the stored data:

```shell
> curl -i -X GET http://localhost:8080/Plone/my-form/@form-data -H 'Accept: application/json' -H 'Content-Type: application/json' --user admin:admin
```

Specifying a block_id parameter returns only the records associated with a specific block on the page.

```shell
> curl -i -X GET http://localhost:8080/Plone/my-form/@form-data?block_id=123456789 -H 'Accept: application/json' -H 'Content-Type: application/json' --user admin:admin
```

And replies with something similar::

```json
    {
        "@id": "http://localhost:8080/Plone/my-form/@form-data?block_id=123456789",
        "items": [
            {
            "block_id": "123456789",
            "date": "2021-03-10T12:25:24",
            "from": "support@foo.com",
            "id": 912078826,
            "name": "John Doe"
            },
            ...
        ],
        "items_total": 42,
        "expired_total": 2
    }
```

### `@form-data-export`

Returns a csv file with all data (only for users that have **Modify portal content** permission):

```shell
> curl -i -X GET http://localhost:8080/Plone/my-form/@form-data-export -H 'Accept: application/json' -H 'Content-Type: application/json' --user admin:admin
```

If form fields changed between some submissions, you will see also columns related to old fields.

### `@form-data-clear`

Reset the store (only for users that have **Modify portal content** permission):

```shell
> curl -i -X DELETE http://localhost:8080/Plone/my-form/@form-data-clear --data-raw '{block_id: bbb}' -H 'Accept: application/json' -H 'Content-Type: application/json' --user admin:admin
```

Optional parameters could be passed in the payload:

* `block_id` to delete only data related to a specific block on the page, otherwise data from all form blocks on the page will be deleted
* `expired` a boolean that, if `true`, removes only records older than the value of days specified in the block configuration (the above `block_id` parameter is required)

### `@validate-email-address`

Send an message to the passed email with OTP code to verify the address.
Returns a HTTP 204 in case of success or HTTP 400 in case the email is badly composed.:

```shell
> curl -i -X POST http://localhost:8080/Plone/my-form/@validate-email-address --data-raw '{"email": "email@email.com", "uid": "ffffffff"}' -H 'Accept: application/json' -H 'Content-Type: application/json'
```

parameters:

* `email` email address.
* `uid` uid related to email field

### `@validate-email-token`

Supposed to validate the OTP code received by the user via email.
Returns HTTP 204 in case of success or HTTP 400 in case of failure ::

```shell
> curl -i -X POST http://localhost:8080/Plone/my-form/@validate-email-token --data-raw '{"email": "email@email.com", "otp": "blahblahblah"}' -H 'Accept: application/json' -H 'Content-Type: application/json'
```

parameters:

* `email` email address
* `uid` uid used to generate the OTP
* `otp` OTP code

## Form actions

Using `volto-form-block <https://github.com/collective/volto-form-block>`_ you can set if the form submit should send data to an email address
or store it into an internal catalog (or both).

### Send

If block is set to send data, an email with form data will be sent to the recipient set in block settings or (if not set) to the site address.

If there is an `attachments` field in the POST data, these files will be attached to the email sent.

#### XML attachments

An XML copy of the data can be optionally attached to the sent email by configuring the volto block's `attachXml` option.

The sent XML follows the same format as the feature in [collective.easyform](https://github.com/collective/collective.easyform). An example is shown below:

```xml
<?xml version='1.0' encoding='utf-8'?><form><field name="Custom field label">My value</field></form>
```

The field names in the XML will utilise the Data ID Mapping feature if it is used. Read more about this feature in the following Store section of the documentation.

#### Acknowledgement email

It is possible to also send an email to the user who filled in the form.

Set the 'Send to' value to include `acknowledgement` to enable this behaviour. The additional block field `acknowledgementMessage` can then be used to write the message being sent to the user and the `acknowledgementFields` block field used to choose the field that will contain the email address the acknowledgement will be sent to.

### Store

If block is set to store data, we store it into the content that has that block (with a `souper.plone <https://pypi.org/project/souper.plone>`_ catalog).

The store is an adapter registered for *IFormDataStore* interface, so you can override it easily.

Only fields that are also in block settings are stored. Missing ones will be skipped.

Each Record stores also two *service* attributes:

- **fields_labels**: a mapping of field ids to field labels. This is useful when we export csv files, so we can labels for the columns.
- **fields_order**: sorted list of field ids. This can be used in csv export to keep the order of fields.

We store these attributes because the form can change over time and we want to have a snapshot of the fields in the Record.

#### Data ID Mapping

The exported CSV file may need to be used by further processes which require specific values for the columns of the CSV. In such a case, the `Data ID Mapping` feature can be used to change the column name to custom text for each field.

## Block serializer

There is a custom block serializer for type ``form``.

This serializer removes all fields that start with "\**default_**\" if the user can't edit the current context.

This is useful because we don't want to expose some internals configurations (for example the recipient email address)
to external users that should only fill the form.

If the block has a field ``captcha``, an additional property ``captcha_props`` is serialized by the ``serialize``
method provided by the ICaptchaSupport named adapter, the result contains useful metadata for the client, as the
captcha public_key, ie:

```json
    {
        "subblocks": [
            ...
        ],
        "captcha": "recaptcha",
        "captcha_props": {
            "provider": "recaptcha",
            "public_key": "aaaaaaaaaaaaa"
        }
    }
```

## Captcha support

Captcha support requires a specific name adapter that implements `ICaptchaSupport`.
This product contains implementations for:

- HCaptcha (plone.formwidget.hcaptcha)
- Google ReCaptcha (plone.formwidget.recaptcha)
- Custom questions and answers (collective.z3cform.norobots)
- Honeypot (collective.honeypot)


Each implementation must be included, installed and configured separately.

To include one implementation, you need to install the egg with the needed extras_require:

- collective.volto.formsupport[recaptcha]
- collective.volto.formsupport[hcaptcha]
- collective.volto.formsupport[norobots]
- collective.volto.formsupport[honeypot]

During the form post, the token captcha will be verified with the defined captcha method.

For captcha support `volto-form-block` version >= 2.4.0 is required.

### Honeypot configuration

If honeypot dependency is available in the buildout, the honeypot validation is enabled and selectable in forms.

Default field name is `protected_1` and you can change it with an environment variable. See `collective.honeypot <https://github.com/collective/collective.honeypot#id7>`_ for details.

## Attachments upload limits

Forms can have one or more attachment field to allow users to upload some files.

These files will be sent via mail, so it could be a good idea setting a limit to them.
For example if you use Gmail as mail server, you can't send messages with attachments > 25MB.

There is an environment variable that you can use to set that limit (in MB):

```ini
    [instance]
    environment-vars =
        FORM_ATTACHMENTS_LIMIT 25
```

By default this is not set.

The upload limit is also passed to the frontend in the form data with the `attachments_limit` key.

## Content-transfer-encoding

It is possible to set the content-transfer-encoding for the email body, settings the environment
variable `MAIL_CONTENT_TRANSFER_ENCODING`:

```ini
    [instance]
    environment-vars =
        MAIL_CONTENT_TRANSFER_ENCODING base64
```

This is useful for some SMTP servers that have problems with `quoted-printable` encoding.

By default the content-transfer-encoding is `quoted-printable` as overridden in
https://github.com/zopefoundation/Products.MailHost/blob/master/src/Products/MailHost/MailHost.py#L65


## Email subject templating

You can also interpolate the form values to the email subject using the field id, in this way: ${123321123}


## Header forwarding

It is possible to configure some headers from the form POST request to be included in the email's headers by configuring the `httpHeaders` field in your volto block.

[volto-formblock](https://github.com/collective/volto-form-block) allows the following headers to be forwarded:

- `HTTP_X_FORWARDED_FOR`
- `HTTP_X_FORWARDED_PORT`
- `REMOTE_ADDR`
- `PATH_INFO`
- `HTTP_USER_AGENT`
- `HTTP_REFERER`

## Data retention

There is a script that implements data cleansing (i.e. for GDPR purpose):

```shell
    bin/instance -OPlone run bin/formsupport_data_cleansing  --help
    Usage: interpreter [OPTIONS]

    bin/instance -OPlone run bin/formsupport_data_cleansing [--dryrun|--no-dryrun]

    Options:
    --dryrun        --dryrun (default) simulate, --no-dryrun actually save the
                    changes

    --help          Show this message and exit.
```

The form block as an integer field `remove_data_after_days`, the retention days can be defined on a single block,
If the value is lower or equal to `0` there is no data cleaning for the specific form.

## Examples

This add-on can be seen in action at the following sites:

- https://www.comune.modena.it/form/contatti


## Translations

This product has been translated into

- Italian


## Installation

Install collective.volto.formsupport by adding it to your buildout::

```ini
    [buildout]

    ...

    eggs =
        collective.volto.formsupport
```

and then running ``bin/buildout``


## Contribute

- Issue Tracker: https://github.com/collective/volto-form-block/issues
- Source Code: https://github.com/collective/volto-form-block


## License

The project is licensed under the GPLv2.

## Authors

This product was developed by **RedTurtle Technology** team.

.. image:: https://avatars1.githubusercontent.com/u/1087171?s=100&v=4
   :alt: RedTurtle Technology Site
   :target: https://www.redturtle.it/


## Credits and Acknowledgements 🙏

Crafted with care by **This was generated by [cookiecutter-plone](https://github.com/plone/cookieplone-templates/backend_addon) on 2024-07-08 10:04:24**. A special thanks to all contributors and supporters!
