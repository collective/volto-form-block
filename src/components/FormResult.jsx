import React from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { Message, Button } from 'semantic-ui-react';
import { getFieldName } from 'volto-form-block/components/utils';

const messages = defineMessages({
  success: {
    id: 'form_submit_success',
    defaultMessage: 'Sent!',
  },
  success_warning: {
    id: 'form_submit_success_warning',
    defaultMessage: "You've been added to the waiting list",
  },
  success_warning_description: {
    id: 'form_submit_success_warning_description',
    defaultMessage:
      "Your data has been submitted, but the subscription limit has been reached and you've been added to the waiting list.",
  },
  reset: {
    id: 'form_reset',
    defaultMessage: 'Clear',
  },
});

/* Function that replaces variables from the user customized message  */
const replaceMessage = (text, sent_data) => {
  let i = 0;
  while (i < sent_data.length) {
    let idField = getFieldName(sent_data[i].label, sent_data[i].field_id);
    text = text.replaceAll('${' + idField + '}', sent_data[i].value ?? '');
    i++;
  }
  text = text.replaceAll(/\$\{[^}]*\}/gm, ''); //replace empty fields with nothing
  text = text.replaceAll('\n', '<br/>');
  return text;
};

const FormResult = ({ formState, data, resetFormState }) => {
  const intl = useIntl();
  return (
    <Message
      positive={!formState.warning}
      warning={formState.warning}
      role="alert"
    >
      {/* Custom message */}
      {data.send_message ? (
        <p
          dangerouslySetInnerHTML={{
            __html: replaceMessage(data.send_message, formState.result.data),
          }}
        />
      ) : (
        <>
          {/* Default message */}
          <Message.Header as="h4">
            {!formState.warning
              ? intl.formatMessage(messages.success)
              : intl.formatMessage(messages.success_warning)}
          </Message.Header>
          <p>
            {!formState.warning
              ? formState.result.message
              : intl.formatMessage(messages.success_warning_description)}
          </p>
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
  );
};
export default FormResult;
