import { defineMessages } from 'react-intl';
const messages = defineMessages({
  field_widget: {
    id: 'form_field_widget',
    defaultMessage: 'Widget',
  },
  display_values_title: {
    id: 'form_field_display_values_title',
    defaultMessage: 'Display values as',
  },
  display_values_description: {
    id: 'form_field_display_values_description',
    defaultMessage:
      'Change how values appear in forms and emails. Data stores and sent, such as CSV exports and XML attachments, will remain unchanged.',
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
        placeholder: 'Yes',
      },
      no: {
        title: 'False',
        placeholder: 'No',
      },
    },
  };
}

export const YesNoSchemaExtender = ({ intl, formData }) => {
  return {
    fields: ['widget', 'display_values'],
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
      display_values: {
        title: 'Display values as',
        description: '',
        widget: 'object',
        schema: InternalValueSchema(),
        collapsible: true,
      },
    },
    required: ['widget'],
  };
};
