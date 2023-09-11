import { defineMessages } from 'react-intl';
const messages = defineMessages({
  field_widget: {
    id: 'form_field_widget',
    defaultMessage: 'Widget',
  },
});

function InternalValueSchema() {
  return {
    title: 'Test',
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: ['yes', 'no'],
      },
    ],
    properties: {
      yes: {
        title: 'True',
      },
      no: {
        title: 'False',
      },
    },
  };
}

export const YesNoSchemaExtender = ({ intl, formData, ...props }) => {
  return {
    fields:
      props.widget === 'single_choice'
        ? ['widget', 'internal_value']
        : ['widget'],
    properties: {
      widget: {
        title: intl.formatMessage(messages.field_widget),
        type: 'string',
        choices: [
          ['checkbox', 'Checkbox'],
          ['single_choice', 'Radio'],
        ],
        default: 'checkbox',
      },
      internal_value: {
        title: 'Internal value',
        widget: 'object',
        schema: InternalValueSchema(),
        collapsible: true,
      },
    },
    required: ['widget'],
  };
};
