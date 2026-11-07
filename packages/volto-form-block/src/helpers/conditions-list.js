import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  is_empty: { id: 'condition_is_empty', defaultMessage: 'Is empty' },
  is_not_empty: {
    id: 'condition_is_not_empty',
    defaultMessage: 'Is not empty',
  },
  is_equal_to: { id: 'condition_is_equal_to', defaultMessage: 'Is equal to' },
  is_not_equal_to: {
    id: 'condition_is_not_equal_to',
    defaultMessage: 'Is not equal to',
  },
  contains: { id: 'condition_contains', defaultMessage: 'Contains' },
  not_contains: {
    id: 'condition_not_contains',
    defaultMessage: 'Not contains',
  },
  greater_than: {
    id: 'condition_greater_than',
    defaultMessage: 'Greater than',
  },
  less_than: { id: 'condition_less_than', defaultMessage: 'Less than' },
  greater_or_equal: {
    id: 'condition_greater_or_equal',
    defaultMessage: 'Greater or equal',
  },
  less_or_equal: {
    id: 'condition_less_or_equal',
    defaultMessage: 'Less or equal',
  },
});

export const ConditionsListOptions = () => {
  const intl = useIntl();
  const transformMessages = Object.keys(messages).map((condition) => ({
    value: condition,
    text: intl.formatMessage(messages[condition]),
  }));

  return transformMessages;
};

// For type text field
export const checkTypeTextField = (item) => {
  return (
    (item?.field?.field_type === 'text' ||
      item?.field?.field_type === 'textarea' ||
      item?.field?.field_type === 'from' ||
      item?.field?.field_type === 'static_text') &&
    (item?.condition === 'is_equal_to' ||
      item?.condition === 'is_not_equal_to' ||
      item?.condition === 'contains' ||
      item?.condition === 'not_contains')
  );
};

// For type number field
export const checkTypeNumberField = (item) => {
  return (
    item?.field?.field_type === 'number' &&
    (item?.condition === 'is_equal_to' ||
      item?.condition === 'is_not_equal_to' ||
      item?.condition === 'greater_than' ||
      item?.condition === 'less_than' ||
      item?.condition === 'greater_or_equal' ||
      item?.condition === 'less_or_equal')
  );
};

// For multi selection field
export const checkTypeSelectionField = (item) => {
  return (
    (item?.field?.field_type === 'select' ||
      item?.field?.field_type === 'single_choice' ||
      item?.field?.field_type === 'multiple_choice') &&
    (item?.condition === 'is_equal_to' ||
      item?.condition === 'is_not_equal_to' ||
      item?.condition === 'contains' ||
      item?.condition === 'not_contains')
  );
};

// For boolean field
export const checkTypeBooleanField = (item) => {
  return (
    item?.field?.field_type === 'checkbox' &&
    (item?.condition === 'is_equal_to' || item?.condition === 'is_not_equal_to')
  );
};

// For date field
export const checkTypeDateField = (item) => {
  return (
    item?.field?.field_type === 'date' &&
    (item?.condition === 'is_equal_to' ||
      item?.condition === 'is_not_equal_to' ||
      item?.condition === 'contains' ||
      item?.condition === 'not_contains' ||
      item?.condition === 'greater_than' ||
      item?.condition === 'less_than' ||
      item?.condition === 'greater_or_equal' ||
      item?.condition === 'less_or_equal')
  );
};

const toNumber = (value) => {
  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    try {
      // rimuove spazi e converte la virgola in punto
      const normalized = value.trim().replace(',', '.');
      const num = Number(normalized);
      return isNaN(num) ? null : num;
    } catch {
      return null;
    }
  }

  return null;
};
export const createConditionFormula = (
  condition,
  value_field_id,
  value_condition,
) => {
  // Type of condition
  switch (condition) {
    case 'is_empty':
      if (!value_field_id || value_field_id?.length === 0) return true;
      break;

    case 'is_not_empty':
      if (value_field_id || value_field_id?.length > 0) return true;
      break;

    case 'is_equal_to':
      if (value_field_id && Array.isArray(value_field_id)) {
        return value_field_id[0] === value_condition;
      } else if (value_field_id) {
        return value_field_id === value_condition;
      }
      break;

    case 'is_not_equal_to':
      if (value_field_id && Array.isArray(value_field_id)) {
        return value_field_id[0] !== value_condition;
      } else if (value_field_id) {
        return value_field_id !== value_condition;
      }
      break;

    case 'contains':
      if (value_field_id && value_field_id?.length > 0) {
        return value_field_id
          .toLowerCase()
          .includes(value_condition.toLowerCase());
      }
      break;

    case 'not_contains':
      if (value_field_id && value_field_id?.length > 0) {
        return !value_field_id
          .toLowerCase()
          ?.includes(value_condition.toLowerCase());
      }
      break;

    case 'greater_than':
      return toNumber(value_field_id) > toNumber(value_condition);

    case 'less_than':
      return toNumber(value_field_id) < toNumber(value_condition);

    case 'greater_or_equal':
      return toNumber(value_field_id) >= toNumber(value_condition);

    case 'less_or_equal':
      return toNumber(value_field_id) <= toNumber(value_condition);

    default:
      return true;
  }
};

export const evaluateAllConditions = (conditions = [], formData) => {
  if (conditions?.length > 0) {
    return conditions.every((conditionObj) => {
      return createConditionFormula(
        conditionObj.condition,
        formData[conditionObj.field_id]?.value,
        conditionObj.value_condition,
      );
    });
  } else {
    return true;
  }
};

export const createStringFormula = (conditions) => {
  let resultStrings = '';

  const operator = (operator) => {
    switch (operator) {
      case 'is_empty':
        return '=∅';

      case 'is_not_empty':
        return '!∅';

      case 'is_equal_to':
        return '=';

      case 'is_not_equal_to':
        return '!=';

      case 'contains':
        return '∈';

      case 'not_contains':
        return '∉';

      case 'greater_than':
        return '>';

      case 'less_than':
        return '<';

      case 'greater_or_equal':
        return '>=';

      case 'less_or_equal':
        return '<=';

      default:
        return '';
    }
  };

  if (conditions?.length > 0) {
    resultStrings = conditions.map(
      (obj) =>
        `{${obj.field_id}} ${operator(obj.condition)} {${obj.value_condition}}`,
    );
  }
  return resultStrings;
};
