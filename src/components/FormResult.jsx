import React from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { Message, Button } from 'semantic-ui-react';

const messages = defineMessages({
  success: {
    id: 'form_submit_success',
    defaultMessage: 'Sent!',
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
    let idField = sent_data[i].label;
    text = text.replaceAll('${' + idField + '}', sent_data[i].value ?? '');
    i++;
  }
  text = text.replaceAll('\n', '<br/>');
  return text;
};

const FormResult = ({ formState, data, resetFormState }) => {
  const intl = useIntl();
  return (
    <Message positive role="alert">
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
  );
};
export default FormResult;
