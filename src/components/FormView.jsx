import React, { useCallback } from 'react';
import { useIntl, defineMessages } from 'react-intl';
import {
  Segment,
  Message,
  Grid,
  Form,
  Progress,
  Button,
} from 'semantic-ui-react';

import Field from 'volto-form-block/components/Field';
import GoogleReCaptchaWidget from 'volto-form-block/components/Widget/GoogleReCaptchaWidget';
import HCaptchaWidget from 'volto-form-block/components/Widget/HCaptchaWidget';

import config from '@plone/volto/registry';

import { getFieldName } from './utils';

import './FormView.css';

const messages = defineMessages({
  default_submit_label: {
    id: 'form_default_submit_label',
    defaultMessage: 'Submit',
  },
  error: {
    id: 'Error',
    defaultMessage: 'Error',
  },
  success: {
    id: 'form_submit_success',
    defaultMessage: 'Sent!',
  },
  empty_values: {
    id: 'form_empty_values_validation',
    defaultMessage: 'Fill in the required fields',
  },
  reset: {
    id: 'form_reset',
    defaultMessage: 'Clear',
  },
  captchaInvalid: {
    id: 'captchaInvalid',
    defaultMessage: 'Waiting for captcha',
  },
});

const FormView = ({
  formState,
  formErrors,
  formData,
  onChangeFormData,
  data,
  onSubmit,
  resetFormState,
}) => {
  const intl = useIntl();

  const captcha = !!process.env.RAZZLE_HCAPTCHA_KEY
    ? 'HCaptcha'
    : !!process.env.RAZZLE_RECAPTCHA_KEY
    ? 'GoogleReCaptcha'
    : null;

  let [validToken, setValidToken] = React.useState();
  const onVerifyCaptcha = useCallback((token) => {
    setValidToken(token);
  }, []);

  const isValidField = (field) => {
    return formErrors?.indexOf(field) < 0;
  };

  var FieldSchema = config.blocks.blocksConfig.form.fieldSchema;
  var fieldSchemaProperties = FieldSchema()?.properties;
  var fields_to_send = [];
  for (var key in fieldSchemaProperties) {
    if (fieldSchemaProperties[key].send_to_backend) {
      fields_to_send.push(key);
    }
  }
  return (
    <div className="block form">
      <div className="public-ui">
        <Segment style={{ margin: '2rem 0' }} padded>
          {data.title && <h2>{data.title}</h2>}
          {data.description && (
            <p className="description">{data.description}</p>
          )}
          {formState.error ? (
            <Message error role="alert">
              <Message.Header as="h4">
                {intl.formatMessage(messages.error)}
              </Message.Header>
              <p>{formState.error}</p>
              <Button secondary type="clear" onClick={resetFormState}>
                {intl.formatMessage(messages.reset)}
              </Button>
            </Message>
          ) : formState.result ? (
            <Message positive role="alert">
              <Message.Header as="h4">
                {intl.formatMessage(messages.success)}
              </Message.Header>
              <p>{formState.result}</p>
              <Button secondary type="clear" onClick={resetFormState}>
                {intl.formatMessage(messages.reset)}
              </Button>
            </Message>
          ) : (
            <Form
              loading={formState.loading}
              onSubmit={onSubmit}
              autoComplete="off"
              method="post"
            >
              <Grid columns={1} padded="vertically">
                {data.static_fields?.map((field) => (
                  <Grid.Row key={field.field_id} className="static-field">
                    <Grid.Column>
                      <Field
                        {...field}
                        field_type={field.field_type || 'text'}
                        name={
                          'static_field_' +
                          (field.field_id ??
                            field.name?.toLowerCase()?.replace(' ', ''))
                        }
                        value={field.value}
                        onChange={() => {}}
                        disabled
                        valid
                        formHasErrors={formErrors?.length > 0}
                        labelsAsPlaceholders={data.labelsAsPlaceholders}
                      />
                    </Grid.Column>
                  </Grid.Row>
                ))}
                {data.subblocks?.map((subblock, index) => {
                  let name = getFieldName(subblock.label, subblock.id);
                  var fields_to_send_with_value = Object.assign(
                    {},
                    ...fields_to_send.map((field) => {
                      return {
                        [field]: subblock[field],
                      };
                    }),
                  );

                  return (
                    <Grid.Row key={'row' + index}>
                      <Grid.Column>
                        <Field
                          {...subblock}
                          name={name}
                          onChange={(field, value) =>
                            onChangeFormData(
                              subblock.id,
                              field,
                              value,
                              fields_to_send_with_value,
                            )
                          }
                          value={
                            subblock.field_type === 'static_text'
                              ? subblock.value
                              : formData[name]?.value
                          }
                          valid={isValidField(name)}
                          formHasErrors={formErrors?.length > 0}
                          labelsAsPlaceholders={data.labelsAsPlaceholders}
                        />
                      </Grid.Column>
                    </Grid.Row>
                  );
                })}

                {captcha === 'GoogleReCaptcha' && (
                  <GoogleReCaptchaWidget onVerify={onVerifyCaptcha} />
                )}

                {captcha === 'HCaptcha' && (
                  <HCaptchaWidget
                    sitekey={process.env.RAZZLE_HCAPTCHA_KEY}
                    onVerify={onVerifyCaptcha}
                    size={data.invisibleHCaptcha ? 'invisible' : 'normal'}
                  />
                )}

                {formErrors.length > 0 && (
                  <Message error role="alert">
                    <Message.Header as="h4">
                      {intl.formatMessage(messages.error)}
                    </Message.Header>
                    <p>{intl.formatMessage(messages.empty_values)}</p>
                  </Message>
                )}

                <Grid.Row centered className="row-padded-top">
                  <Grid.Column textAlign="center">
                    <Button
                      primary
                      type="submit"
                      disabled={(captcha && !validToken) || formState.loading}
                    >
                      {captcha && !validToken
                        ? intl.formatMessage(messages.captchaInvalid)
                        : data.submit_label ||
                          intl.formatMessage(messages.default_submit_label)}

                      {formState.loading && (
                        <Progress
                          role="progressbar"
                          percent={100}
                          active
                          success={false}
                          color="grey"
                        />
                      )}
                    </Button>
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Form>
          )}
        </Segment>
      </div>
    </div>
  );
};

export default FormView;
