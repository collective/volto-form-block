import { defineMessages } from 'react-intl';
const messages = defineMessages({
  field_input_values: {
    id: 'form_field_input_values',
    defaultMessage: 'Possible values',
  },
  field_input_values_description: {
    id: 'form_field_input_values_description',
    defaultMessage:
      'You can create value pairs separated by a "|" symbol to add a different addressee based on your choice, e.g. "Value | email.recipient@gmail.com"', // È possibile creare coppie di valori divisi da simbolo "|" per aggiungere un destinatario diverso in base alla scelta effettuata, es. "Valore | email.destinatario@gmail.com"
  },
});

export const SelectionSchemaExtender = (intl) => {
  return {
    fields: ['input_values'],
    properties: {
      input_values: {
        title: intl.formatMessage(messages.field_input_values),
        description: intl.formatMessage(
          messages.field_input_values_description,
        ),
        type: 'array',
        creatable: true,
      },
    },
    required: ['input_values'],
  };
};
