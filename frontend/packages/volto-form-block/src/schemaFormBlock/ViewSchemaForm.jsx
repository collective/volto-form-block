import React from 'react';
import { useDispatch } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { Form } from '@plone/volto/components/manage/Form';
import { submitForm } from 'volto-form-block/actions';
import { tryParseJSON, extractInvariantErrors } from '@plone/volto/helpers';
import { toast } from 'react-toastify';
import { Toast } from '@plone/volto/components';

const messages = defineMessages({
  error: {
    id: 'Error',
    defaultMessage: 'Error',
  },
});

const FormBlockView = ({ data, id, properties, metadata, path }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  let attachments = {};

  const onSubmit = (formData) => {
    let captcha = {
      provider: data.captcha,
      token: formData.captchaToken,
    };
    if (data.captcha === 'honeypot') {
      captcha.value = formData['captchaWidget']?.value ?? '';
      delete formData.captchaToken;
    }

    dispatch(submitForm(path, id, formData, attachments, captcha)).catch(
      (err) => {
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
      },
    );
  };

  return <Form schema={data.schema} formData={{}} onSubmit={onSubmit} />;
};

export default FormBlockView;
