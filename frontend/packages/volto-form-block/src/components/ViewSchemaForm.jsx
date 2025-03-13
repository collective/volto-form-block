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
import {
  flatten,
  includes,
  keys,
  map,
  omitBy,
  pickBy,
  without,
  isObject,
  fromPairs,
} from 'lodash';
import { Grid, Message } from 'semantic-ui-react';
import config from '@plone/volto/registry';
import { renderToString } from 'react-dom/server';
import { stripRequiredProperty } from '../helpers/schema';

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
  const [submitPressed, setSubmitPressed] = useState(false);
  const [submittedData, setSubmittedData] = useState({});
  data.schema = stripRequiredProperty(data.schema);

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
      delete submitData.captchaWidget;
    }

    if (data.captcha === 'recaptcha') {
      captcha.token = submitData.captchaWidget;
      delete submitData.captchaWidget;
    }

    setSubmitPressed(true);

    submitData = pickBy(
      submitData,
      (value, field) =>
        !includes(
          config.blocks.blocksConfig.schemaForm.filterFactorySend,
          data.schema.properties[field].factory,
        ),
    );

    map(keys(submitData), (field) => {
      if (
        data.schema.properties[field].factory === 'number' &&
        submitData[field] !== undefined
      ) {
        submitData[field] = parseInt(submitData[field]);
      }

      if (
        data.schema.properties[field].factory === 'time' &&
        isObject(submitData[field])
      ) {
        submitData[field] =
          `${submitData[field].hour}:${submitData[field].minute}`;
      }
    });

    // Order fields based on schema
    submitData = fromPairs(
      flatten(
        map(data.schema.fieldsets, (fieldset) =>
          map(fieldset.fields, (field) => [field, submitData[field]]),
        ),
      ),
    );

    // Remove empty values
    submitData = omitBy(submitData, (value) => value === null);

    dispatch(submitForm(path, id, submitData, captcha))
      .then((resp) => {
        setSubmitted(true);
        setSubmittedData(submitData);
        if (
          Array.isArray(data.forward_user_to) &&
          data.forward_user_to.length > 0
        ) {
          window.location.href = data.forward_user_to[0]['@id'];
        } else {
          const url = new URL(window.location);
          url.searchParams.set('send', 'true');
          history.pushState({}, '', url);
        }
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

  const formfields = renderToString(
    <Grid stackable columns={2}>
      {map(keys(submittedData), (property) => {
        const propertyType = data.schema.properties[property].type;

        // Only render if the type is not 'object'
        if (propertyType !== 'object') {
          return (
            <Grid.Row key={property}>
              <Grid.Column>
                {data.schema.properties[property].title}
              </Grid.Column>
              <Grid.Column>{submittedData[property]}</Grid.Column>
            </Grid.Row>
          );
        }

        // Return null to avoid rendering the row for object types
        return null;
      })}
    </Grid>,
  );

  let thankyou = data.thankyou || '';

  // Add formfields
  thankyou = thankyou.replace('${formfields}', formfields);

  // Add seperate fields
  map(keys(submittedData), (field) => {
    thankyou = thankyou.replace('${' + field + '}', submittedData[field]);
  });

  return (
    <div className="block schemaForm">
      {data.title && <h2>{data.title}</h2>}
      {data.description && <p>{data.description}</p>}
      {submitted ? (
        <div className="submitted">
          <Message positive>
            <p>{data.success}</p>
          </Message>
          <p
            dangerouslySetInnerHTML={{
              __html: thankyou,
            }}
          />
        </div>
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
          widgets={config.blocks.blocksConfig.schemaForm.widgets}
          component={config.blocks.blocksConfig.schemaForm.component}
          buttonComponent={
            config.blocks.blocksConfig.schemaForm.buttonComponent
          }
          onSubmit={!submitPressed && onSubmit}
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
