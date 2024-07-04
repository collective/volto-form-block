import { defineMessages } from 'react-intl';
const messages = defineMessages({
  field_input_values: {
    id: 'form_field_input_values',
    defaultMessage: 'Possible values',
  },
});

export const SelectionSchemaExtender = (intl) => {
  return {
    fields: ['input_values'],
    properties: {
      input_values: {
        title: intl.formatMessage(messages.field_input_values),
        type: 'array',
        creatable: true,
      },
    },
    required: ['input_values'],
  };
};
