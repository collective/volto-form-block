import React, { useCallback, useRef } from 'react';
import { useIntl, defineMessages } from 'react-intl';
import {
  Segment,
  Message,
  Grid,
  Form,
  Progress,
  Button,
} from 'semantic-ui-react';
import { getFieldName } from './utils';
import Field from 'volto-form-block/components/Field';
import GoogleReCaptchaWidget from 'volto-form-block/components/Widget/GoogleReCaptchaWidget';
import HCaptchaWidget from 'volto-form-block/components/Widget/HCaptchaWidget';
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

  let validToken = useRef('');
  const onVerifyCaptcha = useCallback(
    (token) => {
      validToken.current = token;
    },
    [validToken],
  );

  const isValidField = (field) => {
    return formErrors?.indexOf(field) < 0;
  };

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
                        name={field.label}
                        value={field.value}
                        onChange={() => {}}
                        disabled
                        valid
                        formHasErrors={formErrors?.length > 0}
                      />
                    </Grid.Column>
                  </Grid.Row>
                ))}
                {data.subblocks?.map((subblock, index) => {
                  let name = getFieldName(subblock.label, subblock.id);

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
                              subblock.label,
                            )
                          }
                          value={
                            subblock.field_type === 'static_text'
                              ? subblock.value
                              : formData[name]?.value
                          }
                          valid={isValidField(name)}
                          formHasErrors={formErrors?.length > 0}
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
                      disabled={
                        (captcha && !validToken?.current) || formState.loading
                      }
                    >
                      {data.submit_label ||
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
