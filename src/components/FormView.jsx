import React, { useCallback, useState, useEffect } from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { GoogleReCaptcha } from 'react-google-recaptcha-v3';
import {
  Segment,
  Message,
  Grid,
  Form,
  Progress,
  Button,
} from 'semantic-ui-react';
import { getFieldName } from 'volto-form-block/components/utils';
import Field from 'volto-form-block/components/Field';

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
    id: 'Email Success',
    defaultMessage: 'Email correctly sent',
  },
  empty_values: {
    id: 'form_empty_values_validation',
    defaultMessage: 'Fill in the required fields',
  },
});

const FormView = ({
  formState,
  formErrors,
  formData,
  onChangeFormData,
  data,
  onSubmit,
}) => {
  const intl = useIntl();

  const [loadedRecaptcha, setLoadedRecaptcha] = useState(null);
  let validToken = '';
  const onVerifyCaptcha = useCallback(
    (token) => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      validToken = token;
    },
    [validToken],
  );

  useEffect(() => {
    setLoadedRecaptcha(true);
  }, [loadedRecaptcha]);

  const isValidField = (field) => {
    return formErrors?.indexOf(field) < 0;
  };

  return (
    <div className="block form">
      <div className="public-ui">
        <Segment style={{ margin: '2rem 0' }} padded>
          {formState.error ? (
            <Message error role="alert">
              <Message.Header as="h4">
                {intl.formatMessage(messages.error)}
              </Message.Header>
              <p>{formState.error}</p>
            </Message>
          ) : formState.result ? (
            <Message positive role="alert">
              <Message.Header as="h4">
                {intl.formatMessage(messages.success)}
              </Message.Header>
              <p>{formState.result}</p>
            </Message>
          ) : (
            <Form loading={formState.loading} onSubmit={onSubmit} method="post">
              <Grid columns={1} padded="vertically">
                {data.static_fields?.map((field) => (
                  <Grid.Row key={field.field_id}>
                    <Grid.Column>
                      <Field
                        {...field}
                        name={field.label}
                        value={field.value}
                        onChange={() => {}}
                        disabled
                        valid
                      />
                    </Grid.Column>
                  </Grid.Row>
                ))}
                {data.subblocks?.map((subblock, index) => {
                  let name = getFieldName(subblock.label);
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
                          value={formData[name]?.value}
                          valid={isValidField(name)}
                        />
                      </Grid.Column>
                    </Grid.Row>
                  );
                })}

                {process.env.RAZZLE_RECAPTCHA_KEY && (
                  <Grid.Row>
                    <Grid.Column>
                      <GoogleReCaptcha onVerify={onVerifyCaptcha} />
                    </Grid.Column>
                  </Grid.Row>
                )}

                {formErrors.length > 0 && (
                  <Message error role="alert">
                    <Message.Header as="h4">
                      {intl.formatMessage(messages.error)}
                    </Message.Header>
                    <p>{intl.formatMessage(messages.empty_values)}</p>
                  </Message>
                )}

                <Grid.Row centered style={{ paddingTop: '3rem' }}>
                  <Grid.Column textAlign="center">
                    <Button
                      primary
                      type="submit"
                      disabled={
                        (!loadedRecaptcha &&
                          process.env.RAZZLE_RECAPTCHA_KEY) ||
                        formState.loading
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
