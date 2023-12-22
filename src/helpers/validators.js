function hasValue(value) {
  return !value === null || !value === undefined;
}

export const validations = {
  minLength: {
    fields: ['validation_value'],
    properties: {
      validation_value: {
        title: 'Minimum',
        type: 'number',
      },
    },
    validator: function ({ value, validation_value }) {
      if (!hasValue(value)) {
        return true;
      }
      return value.toString().length >= validation_value;
    },
  },
  maxLength: {
    fields: ['validation_value'],
    properties: {
      validation_value: {
        title: 'Maximum',
        type: 'number',
      },
    },
    validator: function ({ value, validation_value }) {
      if (!hasValue(value)) {
        return true;
      }
      return value.toString().length < validation_value;
    },
  },
};
