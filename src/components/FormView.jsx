import React, { useEffect } from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';
import jwtDecode from 'jwt-decode';
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
import { getUser } from '@plone/volto/actions';
import config from '@plone/volto/registry';

/* Style */
import 'volto-form-block/components/FormView.css';

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

const getFieldsToSendWithValue = (subblock) => {
  const FieldSchema = config.blocks.blocksConfig.form.fieldSchema;

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

  return fields_to_send_with_value;
};

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
}) => {
  const intl = useIntl();
  const userId = useSelector((state) =>
    state.userSession.token ? jwtDecode(state.userSession.token).sub : '',
  );
  const curUserEmail = useSelector(
    (state) => state.users?.user?.email || false,
  );
  const dispatch = useDispatch();
  useEffect(() => {
    if (userId?.length > 0 && curUserEmail === false) dispatch(getUser(userId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (curUserEmail?.length > 0) {
    data.subblocks.forEach((subblock) => {
      if (
        ['email', 'from'].includes(subblock.field_type) &&
        subblock.user_email_as_default
      ) {
        const name = getFieldName(subblock.label, subblock.id);
        if (!formData.hasOwnProperty(name)) {
          const fields_to_send_with_value = getFieldsToSendWithValue(subblock);
          onChangeFormData(
            subblock.id,
            name,
            curUserEmail,
            fields_to_send_with_value,
          );
        }
      }
    });
  }

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
              <Button secondary type="clear" onClick={resetFormOnError}>
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
              id={id}
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
                      />
                    </Grid.Column>
                  </Grid.Row>
                ))}
                {data.subblocks?.map((subblock, index) => {
                  let name = getFieldName(subblock.label, subblock.id);
                  const fields_to_send_with_value =
                    getFieldsToSendWithValue(subblock);
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
                    <p>{intl.formatMessage(messages.empty_values)}</p>
                  </Message>
                )}
                <Grid.Row centered className="row-padded-top">
                  <Grid.Column textAlign="center">
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
