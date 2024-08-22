import React, { useState, useEffect, useReducer, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Form } from '@plone/volto/components/manage/Form';
import { submitForm } from 'volto-form-block/actions';
import { Captcha } from 'volto-form-block/components/Widget';

const FormBlockView = ({ data, id, properties, metadata, path }) => {
  const dispatch = useDispatch();
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

    dispatch(submitForm(path, id, formData, attachments, captcha));
  };

  return <Form schema={data.schema} formData={{}} onSubmit={onSubmit} />;
};

export default FormBlockView;
