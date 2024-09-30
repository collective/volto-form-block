import React from 'react';
import { useDispatch } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { Form } from '@plone/volto/components/manage/Form';
import { submitForm } from 'volto-form-block/actions';
import { tryParseJSON, extractInvariantErrors } from '@plone/volto/helpers';
import { toast } from 'react-toastify';
import { Toast } from '@plone/volto/components';
import { useLocation } from 'react-router-dom';
import qs from 'query-string';
import { pickBy, keys } from 'lodash';

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

  const propertyNames = keys(data.schema.properties);
  const initialData = pickBy(qs.parse(location.search), (value, key) =>
    propertyNames.includes(key),
  );

  const onCancel = () => {};

  const onSubmit = (formData) => {
    let captcha = {
      provider: data.captcha,
      token: formData.captchaToken,
    };
    if (data.captcha === 'honeypot') {
      captcha.value = formData['captchaWidget']?.value ?? '';
      delete formData.captchaToken;
    }

    dispatch(submitForm(path, id, formData, captcha)).catch((err) => {
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
    <>
      {data.title && <h2>{data.title}</h2>}
      {data.description && (
        <p className="documentDescription">{data.description}</p>
      )}
      <Form
        schema={data.schema}
        formData={initialData}
        onSubmit={onSubmit}
        resetOnCancel={true}
        onCancel={data.show_cancel ? onCancel : null}
        submitLabel={data.submit_label || intl.formatMessage(messages.submit)}
        cancelLabel={data.cancel_label || intl.formatMessage(messages.cancel)}
      />
    </>
  );
};

export default FormBlockView;
