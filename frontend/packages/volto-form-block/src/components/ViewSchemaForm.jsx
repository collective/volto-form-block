import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { Form } from '@plone/volto/components/manage/Form';
import { submitForm } from 'volto-form-block/actions';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { tryParseJSON } from '@plone/volto/helpers/FormValidation/FormValidation';
import { extractInvariantErrors } from '@plone/volto/helpers/FormValidation/FormValidation';
import { toast } from 'react-toastify';
import Toast from '@plone/volto/components/manage/Toast/Toast';
import { toBackendLang } from '@plone/volto/helpers/Utils/Utils';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
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
  isString,
  isBoolean,
  isUndefined,
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
  errorSend: {
    id: 'Your form could not be sent. Please reload the page and try again. The data you entered will be retained.',
    defaultMessage:
      'Your form could not be sent. Please reload the page and try again. The data you entered will be retained.',
  },
  errorCaptcha: {
    id: 'Your form could not be sent. Please try again later.',
    defaultMessage: 'Your form could not be sent. Please try again later.',
  },
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
  },
  yes: {
    id: 'Yes',
    defaultMessage: 'Yes',
  },
  no: {
    id: 'No',
    defaultMessage: 'No',
  },
  requiredCheckbox: {
    id: 'requiredCheckbox',
    defaultMessage: '{field} is required to be checked.',
  },
});

const FormBlockView = ({ data, id, path, moment: momentlib }) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const location = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [submitPressed, setSubmitPressed] = useState(false);
  const [submittedData, setSubmittedData] = useState({});
  data.schema = stripRequiredProperty(data.schema);
  const moment = momentlib.default;
  const lang = useSelector((state) => state.intl.locale);
  moment.locale(toBackendLang(lang));

  const propertyNames = keys(data.schema.properties);
  const queryParams = qs.parse(location.search);
  let initialData = {};

  let localStorageData = {};
  try {
    localStorageData = JSON.parse(localStorage.getItem('formBlocks'));
    if (!localStorageData) {
      localStorageData = {};
    }
  } catch (error) {
    localStorageData = {};
  }
  if (id in localStorageData) {
    initialData = localStorageData[id];
  }

  // Get captcha error
  let captchaErrors = {};
  let captchaError = false;
  try {
    captchaErrors = JSON.parse(localStorage.getItem('formBlocksError'));
    if (!captchaErrors) {
      captchaErrors = {};
    }
  } catch (error) {
    captchaErrors = {};
  }
  if (id in captchaErrors) {
    captchaError = captchaErrors[id] === 'error' ? true : false;
  }

  useEffect(() => {
    if (captchaError) {
      toast.error(
        <Toast
          error
          title={intl.formatMessage(messages.errorCaptcha)}
          content=""
        />,
      );
    }
  }, [captchaError, intl]);

  propertyNames.map((property) => {
    if (queryParams[property] !== undefined) {
      initialData[property] = queryParams[property];
    }

    const field = data.schema.properties[property];

    if (
      field.factory &&
      field.factory === 'checkbox_group' &&
      isString(field.default)
    ) {
      initialData[property] = field.default.split('\n');
    }

    const queryParameterName = field.queryParameterName;

    if (
      queryParameterName !== undefined &&
      queryParams[queryParameterName] !== undefined
    ) {
      initialData[property] = queryParams[queryParameterName];
    }

    return property;
  });

  const onCancel = () => {};

  const onChangeFormData = (formData) => {
    let localStorageData;
    try {
      localStorageData = JSON.parse(localStorage.getItem('formBlocks'));
    } catch (error) {
      localStorageData = {};
    }

    let storeData = { ...formData };
    delete storeData.captchaWidget;
    localStorage.setItem(
      'formBlocks',
      JSON.stringify({
        ...localStorageData,
        [id]: storeData,
      }),
    );
  };

  const onSubmit = async (formData) => {
    let submitData = { ...formData };
    let captcha = {
      provider: data.captcha,
    };

    if (data.captcha === 'recaptcha') {
      captcha.token = await submitData.captchaWidget();
      delete submitData.captchaWidget;
    }

    setSubmitPressed(true);

    submitData = pickBy(
      submitData,
      (value, field) =>
        !includes(
          config.blocks.blocksConfig.schemaForm.filterFactorySend,
          data.schema.properties[field]?.factory,
        ),
    );

    const requiredErrors = [];

    map(keys(submitData), (field) => {
      if (
        data.schema.properties[field]?.factory === 'number' &&
        submitData[field] !== undefined
      ) {
        submitData[field] = parseInt(submitData[field]);
      }

      if (
        data.schema.properties[field]?.factory === 'time' &&
        isObject(submitData[field])
      ) {
        submitData[field] =
          `${submitData[field].hour}:${submitData[field].minute}`;
      }

      if (
        data.schema.properties[field]?.factory === 'label_boolean_field' ||
        data.schema.properties[field]?.type === 'boolean'
      ) {
        if (!isBoolean(submitData[field])) {
          submitData[field] = false;
        }
        if (!submitData[field] && data.schema.required.includes(field)) {
          requiredErrors.push(
            intl.formatMessage(messages.requiredCheckbox, {
              field: data.schema.properties[field].title,
            }),
          );
        }
      }
    });

    if (requiredErrors.length > 0) {
      map(requiredErrors, (title) => {
        toast.error(<Toast error title={title} content="" />);
      });
      setSubmitPressed(false);
      return;
    }

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
        // Set submitted
        setSubmitted(true);
        setSubmittedData(submitData);

        // Clear error
        let captchaErrors;
        try {
          captchaErrors = JSON.parse(localStorage.getItem('formBlocksError'));
          if (!captchaErrors) {
            captchaErrors = {};
          }
        } catch (error) {
          captchaErrors = {};
        }

        delete captchaErrors[id];
        localStorage.setItem('formBlocks', JSON.stringify(captchaErrors));

        // Clear localstorage
        let localStorageData;
        try {
          localStorageData = JSON.parse(localStorage.getItem('formBlocks'));
        } catch (error) {
          localStorageData = {};
        }

        delete localStorageData[id];
        localStorage.setItem(
          'formBlocksError',
          JSON.stringify(localStorageData),
        );

        // Redirect after submit
        if (
          Array.isArray(data.forward_user_to) &&
          data.forward_user_to.length > 0
        ) {
          window.location.href = flattenToAppURL(
            data.forward_user_to[0]['@id'],
          );
        } else {
          const url = new URL(window.location);
          url.searchParams.set('send', 'true');
          history.pushState({}, '', url); // eslint-disable-line no-restricted-globals
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

        // Clear error
        let captchaErrors = {};
        try {
          captchaErrors = JSON.parse(localStorage.getItem('formBlocksError'));
          if (!captchaErrors) {
            captchaErrors = {};
          }
        } catch (error) {
          captchaErrors = {};
        }

        captchaErrors[id] = 'error';
        localStorage.setItem('formBlocksError', JSON.stringify(captchaErrors));

        if (
          err.status === 400 &&
          (err?.response?.body?.message === 'Kein Captcha-Token angegeben.' ||
            err?.response?.body?.error?.message ===
              'No captcha token provided.')
        ) {
          window.location.reload();
        }

        if (invariantErrors.length > 0) {
          toast.error(
            <Toast
              error
              title={intl.formatMessage(messages.error)}
              content={invariantErrors.join(' - ')}
            />,
            {
              autoClose: false,
            },
          );
        } else {
          toast.error(
            <Toast
              error
              title={intl.formatMessage(messages.errorSend)}
              content={message}
            />,
            {
              autoClose: false,
            },
          );
        }

        setSubmitPressed(false);
      });
  };

  const formatProperty = (factory, value) => {
    switch (factory) {
      case 'termsAccepted':
      case 'label_boolean_field':
        return value === true
          ? intl.formatMessage(messages.yes)
          : intl.formatMessage(messages.no);
      case 'checkbox_group':
        return Array.isArray(value)
          ? value.map((item) => [item, <br />]).flat() // eslint-disable-line react/jsx-key
          : value;
      case 'label_date_field':
        return isUndefined(value) ? '' : moment(value).format('l');
      case 'label_datetime_field':
        return isUndefined(value) ? '' : moment(value).format('LLL');
      default:
        return value;
    }
  };

  const formfields = renderToString(
    <Grid stackable columns={2}>
      {map(keys(submittedData), (property) => {
        const propertyType = data.schema.properties[property].type;

        if (
          propertyType !== 'object' &&
          property !== 'captchaWidget' &&
          data.schema.properties[property].factory !== 'hidden'
        ) {
          return (
            <Grid.Row key={property}>
              <Grid.Column className={`${property}-label`}>
                {data.schema.properties[property].title}
              </Grid.Column>
              <Grid.Column className={`${property}-value`}>
                {formatProperty(
                  data.schema.properties[property].factory,
                  submittedData[property],
                )}
              </Grid.Column>
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
  thankyou = thankyou.replace('${formfields}', formfields); // eslint-disable-line no-template-curly-in-string

  // Add seperate fields
  map(keys(submittedData), (field) => {
    thankyou = thankyou.replace('${' + field + '}', submittedData[field]);
  });

  return (
    <div className="block schemaForm">
      {data.title && <h2>{data.title}</h2>}
      {data.description && (
        <p className="formDescription">{data.description}</p>
      )}
      {submitted ? (
        <div className="submitted">
          <Message positive>
            <p>{data.success}</p>
          </Message>
          <p
            className="thankyou"
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
          onSubmit={submitPressed ? () => {} : onSubmit}
          resetOnCancel={true}
          onChangeFormData={onChangeFormData}
          onCancel={data.show_cancel ? onCancel : null}
          submitLabel={data.submit_label || intl.formatMessage(messages.submit)}
          cancelLabel={data.cancel_label || intl.formatMessage(messages.cancel)}
          textButtons={true}
        />
      )}
    </div>
  );
};

export default injectLazyLibs(['moment'])(FormBlockView);
