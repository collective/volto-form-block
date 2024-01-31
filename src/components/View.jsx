import { formatDate } from '@plone/volto/helpers/Utils/Date';
import config from '@plone/volto/registry';
import PropTypes from 'prop-types';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { submitForm } from 'volto-form-block/actions';
import FormView from 'volto-form-block/components/FormView';
import { Captcha } from 'volto-form-block/components/Widget';
import { getFieldName } from 'volto-form-block/components/utils';

const messages = defineMessages({
  formSubmitted: {
    id: 'formSubmitted',
    defaultMessage: 'Form successfully submitted',
  },
  field_is_required: {
    id: 'field_is_required',
    defaultMessage: '{fieldLabel} is required',
  },
  error: {
    id: 'There is a problem submitting your form',
    defaultMessage: 'There is a problem submitting your form',
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

const getInitialData = (data) => {
  const { static_fields = [], subblocks = [] } = data;

  return {
    ...subblocks.reduce(
      (acc, field) =>
        field.field_type === 'hidden'
          ? {
              ...acc,
              [getFieldName(field.label, field.id)]: {
                ...field,
                ...(data[field.id] && { custom_field_id: data[field.id] }),
              },
            }
          : acc,
      {},
    ),
    ...static_fields.reduce(
      (acc, field) => ({
        ...acc,
        [getFieldName(field.label, field.id)]: field,
      }),
      {},
    ),
  };
};

/**
 * Form view
 * @class View
 */
const View = ({ data, id, path }) => {
  const intl = useIntl();
  const dispatch = useDispatch();

  const [formData, setFormData] = useReducer((state, action) => {
    if (action.reset) {
      return getInitialData(data);
    }

    return {
      ...state,
      [action.field]: action.value,
    };
  }, getInitialData(data));

  const [formState, setFormState] = useReducer(formStateReducer, initialState);
  const [formErrors, setFormErrors] = useState({});
  const submitResults = useSelector((state) => state.submitForm);
  const captchaToken = useRef();
  const formid = `form-${id}`;

  const onChangeFormData = (field_id, field, value, extras) => {
    setFormData({
      field,
      value: {
        field_id,
        value,
        ...(data[field_id] && { custom_field_id: data[field_id] }), // Conditionally add the key. Nicer to work with than having a key with a null value
        ...extras,
      },
    });
  };

  useEffect(() => {
    // We have a form state updater already going on, why do we need to separately update the state again?
    if (Object.keys(formErrors).length > 0) {
      isValidForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const isValidForm = () => {
    const v = {};
    data.subblocks.forEach((subblock, index) => {
      const name = getFieldName(subblock.label, subblock.id);
      const fieldType = subblock.field_type;
      const additionalField =
        config.blocks.blocksConfig.form.additionalFields?.filter(
          (f) => f.id === fieldType && f.isValid !== undefined,
        )?.[0] ?? null;
      // TODO: Abstract all of this into a single 'field' definition where each fields defines it's own rules.
      if (subblock.required) {
        let fieldIsRequired = true;
        // Required field has a value
        if (formData[name]) {
          fieldIsRequired = false;
        }
        // Some field types can't be required. TODO: Make these field types use `isValid`
        else if (fieldType === 'static_text' || fieldType === 'hidden') {
          fieldIsRequired = false;
        }
        // Additional fields have their own validation
        else if (additionalField && !additionalField?.isValid(formData, name)) {
          fieldIsRequired = false;
        }
        // Checkboxes have their value stored slightly differently
        else if (fieldType === 'checkbox' && !formData[name]?.value) {
          fieldIsRequired = false;
        }
        // List/ multi-option handling
        else if (
          (formData[name]?.value && formData[name].value.length === 0) ||
          (typeof formData[name]?.value === 'object' &&
            JSON.stringify(formData[name]?.value) === '{}')
        ) {
          fieldIsRequired = false;
        }
        // Required yes/ no fields with a radio widget should still be able to select "No" as the value, unlike single-checkbox widgets
        else if (
          fieldType === 'yes_no' &&
          subblock.widget === 'single_choice' &&
          !formData[name]
        ) {
          fieldIsRequired = true;
        }
        // Default value handling. Boolean check is for Yes/ no fields
        if (
          Boolean(
            !formData[name] &&
              (subblock.default_value ||
                typeof subblock.default_value === 'boolean'),
          )
        ) {
          fieldIsRequired = false;
        }

        const errors = v[name] ?? [];

        if (fieldIsRequired) {
          errors.push(
            intl.formatMessage(messages.field_is_required, {
              fieldLabel: subblock.label,
            }),
          );
        }

        if (errors.length > 0) {
          v[name] = errors;
        }
      }
    });

    if (data.captcha && !captchaToken.current) {
      v['captcha'] = intl.formatMessage(messages.field_is_required, {
        fieldLabel: 'Captcha',
      });
    }

    setFormErrors({ ...formErrors, ...v });
    return Object.keys(v).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    captcha
      .verify()
      .then(() => {
        if (isValidForm()) {
          let attachments = {};
          let captcha = {
            provider: data.captcha,
            token: captchaToken.current,
          };
          if (data.captcha === 'honeypot') {
            captcha.value = formData[data.captcha_props.id]?.value ?? '';
          }

          let formattedFormData = data.subblocks.reduce(
            (returnValue, field) => {
              if (field.field_type === 'static_text') {
                return returnValue;
              }
              const fieldName = getFieldName(field.label, field.id);
              const dataToAdd = formData[fieldName] ?? {
                field_id: field.id,
                label: field.label,
                value: field.default_value,
                ...(data[field.id] && { custom_field_id: data[field.id] }), // Conditionally add the key. Nicer to work with than having a key with a null value
              };
              return { ...returnValue, [fieldName]: dataToAdd };
            },
            {},
          );
          data.subblocks.forEach((subblock) => {
            let name = getFieldName(subblock.label, subblock.id);
            if (formattedFormData[name]?.value) {
              formattedFormData[name].field_id = subblock.field_id;
              const isAttachment = config.blocks.blocksConfig.form.attachment_fields.includes(
                subblock.field_type,
              );

              if (isAttachment) {
                attachments[name] = formattedFormData[name].value;
                delete formattedFormData[name];
              }
            }
          });
          dispatch(
            submitForm(
              path,
              id,
              Object.keys(formattedFormData).map((name) => ({
                ...formattedFormData[name],
              })),
              attachments,
              captcha,
            ),
          );
          setFormState({ type: FORM_STATES.loading });
        } else {
          const errorBox = document.getElementById(`${formid}-errors`);
          if (errorBox) {
            errorBox.scrollIntoView({ behavior: 'smooth' });
          }
          setFormState({ type: FORM_STATES.error });
        }
      })
      .catch(() => {
        setFormState({ type: FORM_STATES.error });
      });
  };

  const resetFormState = () => {
    setFormData({ reset: true });
    setFormState({ type: FORM_STATES.normal });
  };

  const resetFormOnError = () => {
    setFormState({ type: FORM_STATES.normal });
  };

  const captcha = new Captcha({
    captchaToken,
    captcha: data.captcha,
    captcha_props: data.captcha_props,
    onChangeFormData,
  });

  useEffect(() => {
    if (submitResults?.loaded) {
      setFormState({
        type: FORM_STATES.success,
        result: intl.formatMessage(messages.formSubmitted),
      });
      captcha.reset();
      const formItem = document.getElementById(formid);
      if (formItem !== null) {
        const formItemPosition = formItem.getBoundingClientRect();
        formItemPosition !== null &&
          window.scrollTo({
            top: formItemPosition.x,
            left: formItemPosition.y,
            behavior: 'smooth',
          });
      }
    }
    // TODO: The general form state handling is a mess and needs refactoring.
    else if (submitResults?.error) {
      const errorType = submitResults.error.type;
      if (errorType === 'response') {
        let errorDescription = `${
          JSON.parse(submitResults.error.error ?? '{}')?.message
        }`;
        setFormState({ type: FORM_STATES.error, error: errorDescription });
      } else if (errorType === 'validation') {
        setFormState({ type: FORM_STATES.normal });

        const errors = submitResults.error?.error ?? {};
        const erroredFieldIds = Object.keys(errors);
        const errorMapping = {};
        data.subblocks.forEach((field) => {
          const name = getFieldName(field.label, field.id);
          // Adding an errored field
          if (erroredFieldIds.includes(field.id)) {
            errorMapping[name] = errors[field.id];
          }
          // Keep track of previously-errored fields incase we want to display a message to tell users it passes validation now
          else if (!!formErrors[name]) {
            errorMapping[name] = null;
          }
        });

        setFormErrors(errorMapping);
      } else {
        let errorMessage = 'Unknown error';
        // Handle an edge case where the reducer state is still the old-style without the error type in it
        if (submitResults.error.error) {
          errorMessage = `${
            JSON.parse(submitResults.error.error ?? '{}')?.message
          }`;
        }
        // TODO: i18n for unknown error type
        setFormState({ type: FORM_STATES.error, error: errorMessage });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitResults]);

  useEffect(() => {
    resetFormState();
  }, []);

  return (
    <FormView
      id={formid}
      formState={formState}
      formErrors={formErrors}
      formData={formData}
      captcha={captcha}
      onChangeFormData={onChangeFormData}
      data={data}
      onSubmit={submit}
      resetFormState={resetFormState}
      resetFormOnError={resetFormOnError}
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
