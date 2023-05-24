export const validations = {
  minLength: {
    fields: ['validation_value'],
    properties: {
      validation_value: {
        title: 'Minimum',
        type: 'number',
      },
    },
    validator: ({ value, validation_value }) =>
      value?.toString().length >= validation_value,
  },
  maxLength: {
    fields: ['validation_value'],
    properties: {
      validation_value: {
        title: 'Maximum',
        type: 'number',
      },
    },
    validator: ({ value, validation_value }) =>
      value?.toString().length < validation_value,
  },
};
