import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { Form } from '@plone/volto/components/manage/Form';
import { submitForm } from 'volto-form-block/actions';
import { tryParseJSON, extractInvariantErrors } from '@plone/volto/helpers';
import { toast } from 'react-toastify';
import { Toast } from '@plone/volto/components';
import { useLocation } from 'react-router-dom';
import qs from 'query-string';
import { includes, keys, map, pickBy, without } from 'lodash';
import { Grid } from 'semantic-ui-react';
import config from '@plone/volto/registry';

const messages = defineMessages({
  error: {
    id: 'Error',
    defaultMessage: 'Error',
  },
  submit: {
    id: 'Submit',
    defaultMessage: 'Submit',
  },
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
  },
});

const FormBlockView = ({ data, id, properties, metadata, path }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const location = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState({});

  const propertyNames = keys(data.schema.properties);
  const queryParams = qs.parse(location.search);
  let initialData = {};
  propertyNames.map((property) => {
    if (queryParams[property] !== undefined) {
      initialData[property] = queryParams[property];
    }

    const queryParameterName =
      data.schema.properties[property].queryParameterName;

    if (
      queryParameterName !== undefined &&
      queryParams[queryParameterName] !== undefined
    ) {
      initialData[property] = queryParams[queryParameterName];
    }
  });

  const onCancel = () => {};

  const onSubmit = (formData) => {
    let submitData = { ...formData };
    let captcha = {
      provider: data.captcha,
      token: submitData.captchaToken,
    };
    if (data.captcha === 'honeypot') {
      captcha.value = submitData['captchaWidget']?.value ?? '';
      delete submitData.captchaToken;
    }

    submitData = pickBy(
      submitData,
      (value, field) =>
        !includes(
          config.blocks.blocksConfig.schemaForm.filterFactorySend,
          data.schema.properties[field].factory,
        ),
    );

    dispatch(submitForm(path, id, submitData, captcha))
      .then((resp) => {
        setSubmitted(true);
        setSubmittedData(submitData);
      })
      .catch((err) => {
        let message =
          err?.response?.body?.error?.message ||
          err?.response?.body?.message ||
          err?.response?.text ||
          '';
        const errorsList = tryParseJSON(message);
        let invariantErrors = [];
        if (Array.isArray(errorsList)) {
          invariantErrors = extractInvariantErrors(errorsList);
        }
        if (invariantErrors.length > 0) {
          toast.error(
            <Toast
              error
              title={intl.formatMessage(messages.error)}
              content={invariantErrors.join(' - ')}
            />,
          );
        }
      });
  };

  return (
    <div className="block schemaForm">
      {data.title && <h2>{data.title}</h2>}
      {data.description && (
        <p className="documentDescription">{data.description}</p>
      )}
      {submitted ? (
        <Grid stackable columns={2}>
          <p
            dangerouslySetInnerHTML={{
              __html: data.thankyou?.data || '',
            }}
          />
          {map(keys(submittedData), (property) => (
            <Grid.Row>
              <Grid.Column>
                {data.schema.properties[property].title}
              </Grid.Column>
              <Grid.Column>{submittedData[property]}</Grid.Column>
            </Grid.Row>
          ))}
        </Grid>
      ) : (
        <Form
          schema={{
            ...data.schema,
            fieldsets: map(data.schema.fieldsets, (fieldset) => ({
              ...fieldset,
              fields: includes(fieldset.fields, 'captchaWidget')
                ? [
                    ...without(fieldset.fields, 'captchaWidget'),
                    'captchaWidget',
                  ]
                : fieldset.fields,
            })),
          }}
          formData={initialData}
          onSubmit={onSubmit}
          resetOnCancel={true}
          onCancel={data.show_cancel ? onCancel : null}
          submitLabel={data.submit_label || intl.formatMessage(messages.submit)}
          cancelLabel={data.cancel_label || intl.formatMessage(messages.cancel)}
          textButtons={true}
        />
      )}
    </div>
  );
};

export default FormBlockView;
