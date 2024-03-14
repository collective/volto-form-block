import React from 'react';
import { useIntl, defineMessages } from 'react-intl';
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
import config from '@plone/volto/registry';

/* Style */
import 'volto-form-block/components/FormView.css';

const messages = defineMessages({
  default_submit_label: {
    id: 'form_default_submit_label',
    defaultMessage: 'Submit',
  },
  default_cancel_label: {
    id: 'form_default_cancel_label',
    defaultMessage: 'Cancel',
  },
  error: {
    id: 'Error',
    defaultMessage: 'Error',
  },
  success: {
    id: 'form_submit_success',
    defaultMessage: 'Sent!',
  },
  form_errors: {
    id: 'form_errors_validation',
    defaultMessage: 'There are some errors in the form.',
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
  resetFormOnError,
  captcha,
  id,
  getErrorMessage,
}) => {
  const intl = useIntl();
  const FieldSchema = config.blocks.blocksConfig.form.fieldSchema;

  const isValidField = (field) => {
    return formErrors?.filter((e) => e.field === field).length === 0;
  };

  /* Function that replaces variables from the user customized message  */
  const replaceMessage = (text) => {
    let i = 0;
    while (i < data.subblocks.length) {
      let idField = getFieldName(
        data.subblocks[i].label,
        data.subblocks[i].field_id,
      );
      text = text.replaceAll(
        '${' + idField + '}',
        formData[idField]?.value || '',
      );
      i++;
    }
    return text;
  };

  const submit = (e) => {
    resetFormOnError();
    onSubmit(e);
  };

  return (
    <div className="block form">
      <div className="public-ui">
        <Segment style={{ margin: '2rem 0' }} padded>
          {data.title && <h2>{data.title}</h2>}
          {data.description && (
            <p className="description">{data.description}</p>
          )}
          {formState.result ? (
            <Message positive role="alert">
              {/* Custom message */}
              {data.send_message ? (
                <p
                  dangerouslySetInnerHTML={{
                    __html: replaceMessage(data.send_message),
                  }}
                />
              ) : (
                <>
                  {/* Default message */}
                  <Message.Header as="h4">
                    {intl.formatMessage(messages.success)}
                  </Message.Header>
                  <p>{formState.result}</p>
                </>
              )}
              {/* Back button */}
              <Button
                secondary
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  resetFormState();
                }}
              >
                {intl.formatMessage(messages.reset)}
              </Button>
            </Message>
          ) : (
            <Form
              id={id}
              loading={formState.loading}
              onSubmit={submit}
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
                      />
                    </Grid.Column>
                  </Grid.Row>
                ))}
                {data.subblocks?.map((subblock, index) => {
                  let name = getFieldName(subblock.label, subblock.id);

                  var fields_to_send = [];
                  var fieldSchemaProperties = FieldSchema(subblock)?.properties;
                  for (var key in fieldSchemaProperties) {
                    if (fieldSchemaProperties[key].send_to_backend) {
                      fields_to_send.push(key);
                    }
                  }

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
                          errorMessage={getErrorMessage(name)}
                          formHasErrors={formErrors?.length > 0}
                        />
                      </Grid.Column>
                    </Grid.Row>
                  );
                })}
                {captcha.render()}
                {formErrors.length > 0 && (
                  <Message error role="alert">
                    <Message.Header as="h4">
                      {intl.formatMessage(messages.error)}
                    </Message.Header>
                    <p>{intl.formatMessage(messages.form_errors)}</p>
                  </Message>
                )}

                {formState.error && (
                  <Message error role="alert">
                    <Message.Header as="h4">
                      {intl.formatMessage(messages.error)}
                    </Message.Header>
                    <p>{formState.error}</p>
                  </Message>
                )}
                <Grid.Row centered className="row-padded-top">
                  <Grid.Column textAlign="center">
                    {data?.show_cancel && (
                      <Button
                        secondary
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          resetFormState();
                        }}
                      >
                        {data.cancel_label ||
                          intl.formatMessage(messages.default_cancel_label)}
                      </Button>
                    )}
                    <Button primary type="submit" disabled={formState.loading}>
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
