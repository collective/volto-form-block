import React, { useState, useEffect, useReducer } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl, defineMessages } from 'react-intl';
import { submitForm } from '../actions';
import { getFieldName } from './utils';
import FormView from 'volto-form-block/components/FormView';

import config from '@plone/volto/registry';

const messages = defineMessages({
  formSubmitted: {
    id: 'formSubmitted',
    defaultMessage: 'Form successfully submitted',
  },
});

const initialState = {
  loading: false,
  error: null,
  result: null,
};

const FORM_STATES = {
  normal: 'normal',
  loading: 'loading',
  error: 'error',
  success: 'success',
};

const formStateReducer = (state, action) => {
  switch (action.type) {
    case FORM_STATES.normal:
      return initialState;

    case FORM_STATES.loading:
      return { loading: true, error: null, result: null };

    case FORM_STATES.error:
      return { loading: false, error: action.error, result: null };

    case FORM_STATES.success:
      return { loading: false, error: null, result: action.result };

    default:
      return initialState;
  }
};

const getInitialData = (data) => ({
  ...data.reduce(
    (acc, field) => ({ ...acc, [getFieldName(field.label)]: field }),
    {},
  ),
});

/**
 * Form viiew
 * @class View
 */
const View = ({ data, id, path }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { static_fields = [] } = data;

  const [formData, setFormData] = useReducer((state, action) => {
    if (action.reset) {
      return getInitialData(static_fields);
    }

    return {
      ...state,
      [action.field]: action.value,
    };
  }, getInitialData(static_fields));

  const [formState, setFormState] = useReducer(formStateReducer, initialState);
  const [formErrors, setFormErrors] = useState([]);
  const submitResults = useSelector((state) => state.submitForm);

  const onChangeFormData = (field_id, field, value, label) => {
    setFormData({ field, value: { field_id, value, label } });
  };

  useEffect(() => {
    if (formErrors.length > 0) {
      isValidForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const isValidForm = () => {
    let v = [];
    data.subblocks.forEach((subblock, index) => {
      let name = getFieldName(subblock.label);
      let fieldType = subblock.field_type;
      let additionalField =
        config.blocks.blocksConfig.form.additionalFields?.filter(
          (f) => f.id === fieldType && f.isValid !== undefined,
        )?.[0] ?? null;
      if (
        subblock.required &&
        additionalField &&
        !additionalField?.isValid(formData, name)
      )
        v.push(name);
      else if (
        subblock.required &&
        (!formData[name] ||
          formData[name]?.value?.length === 0 ||
          JSON.stringify(formData[name]?.value ?? {}) === '{}')
      ) {
        v.push(name);
      }
    });

    setFormErrors(v);
    return v.length === 0;
  };

  const submit = (e) => {
    e.preventDefault();

    if (isValidForm()) {
      let attachments = {};

      data.subblocks.forEach((subblock, index) => {
        let name = getFieldName(subblock.label);
        if (formData[name]?.value) {
          formData[name].field_id = subblock.field_id;
          const isAttachment = subblock.field_type === 'attachment';

          if (isAttachment) {
            attachments[name] = formData[name].value;
            delete formData[name];
          }
        }
      });

      dispatch(
        submitForm(
          path,
          id,
          Object.keys(formData).map((name) => ({
            field_id: formData[name].field_id,
            label: formData[name].label,
            value: formData[name].value,
          })),
          attachments,
        ),
      );
      setFormState({ type: FORM_STATES.loading });
    } else {
      setFormState({ type: FORM_STATES.error });
    }
  };

  const resetFormState = () => {
    setFormData({ reset: true });
    setFormState({ type: FORM_STATES.normal });
  };

  useEffect(() => {
    if (submitResults?.loaded) {
      setFormState({
        type: FORM_STATES.success,
        result: intl.formatMessage(messages.formSubmitted),
      });
    } else if (submitResults?.error) {
      let errorDescription = `${submitResults.error.status} ${
        submitResults.error.message
      } - ${JSON.parse(submitResults.error.response?.text ?? '{}')?.message}`;

      setFormState({ type: FORM_STATES.error, error: errorDescription });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitResults]);

  useEffect(() => {
    resetFormState();
  }, []);

  return (
    <FormView
      formState={formState}
      formErrors={formErrors}
      formData={formData}
      onChangeFormData={onChangeFormData}
      data={data}
      onSubmit={submit}
      resetFormState={resetFormState}
    />
  );
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
View.propTypes = {
  data: PropTypes.objectOf(PropTypes.any).isRequired,
};

export default View;
