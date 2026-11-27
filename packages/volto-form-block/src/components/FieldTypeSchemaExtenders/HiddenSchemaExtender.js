import { defineMessages } from 'react-intl';
const messages = defineMessages({
  field_input_value: {
    id: 'form_field_input_value',
    defaultMessage: 'Value for field',
  },
});

export const HiddenSchemaExtender = (intl) => {
  return {
    fields: ['value'],
    properties: {
      value: {
        title: intl.formatMessage(messages.field_input_value),
        type: 'text',
      },
    },
    required: ['value'],
  };
};
