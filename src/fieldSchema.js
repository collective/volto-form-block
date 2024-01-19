import config from '@plone/volto/registry';
import { defineMessages } from 'react-intl';
import { useIntl } from 'react-intl';

const messages = defineMessages({
  field_label: {
    id: 'form_field_label',
    defaultMessage: 'Label',
  },
  field_description: {
    id: 'form_field_description',
    defaultMessage: 'Description',
  },
  field_required: {
    id: 'form_field_required',
    defaultMessage: 'Required',
  },
  field_type: {
    id: 'form_field_type',
    defaultMessage: 'Field type',
  },
  field_type_text: {
    id: 'form_field_type_text',
    defaultMessage: 'Text',
  },
  field_type_textarea: {
    id: 'form_field_type_textarea',
    defaultMessage: 'Textarea',
  },
  field_type_select: {
    id: 'form_field_type_select',
    defaultMessage: 'List',
  },
  field_type_single_choice: {
    id: 'form_field_type_single_choice',
    defaultMessage: 'Single choice',
  },
  field_type_multiple_choice: {
    id: 'form_field_type_multiple_choice',
    defaultMessage: 'Multiple choice',
  },
  field_type_checkbox: {
    id: 'form_field_type_checkbox',
    defaultMessage: 'Checkbox',
  },
  field_type_date: {
    id: 'form_field_type_date',
    defaultMessage: 'Date',
  },
  field_type_attachment: {
    id: 'form_field_type_attachment',
    defaultMessage: 'Attachment',
  },
  field_type_attachment_info_text: {
    id: 'form_field_type_attachment_info_text',
    defaultMessage: 'Any attachments can be emailed, but will not be saved.',
  },
  field_type_from: {
    id: 'form_field_type_from',
    defaultMessage: 'E-mail',
  },
  field_type_static_text: {
    id: 'form_field_type_static_text',
    defaultMessage: 'Static text',
  },
  field_type_hidden: {
    id: 'form_field_type_hidden',
    defaultMessage: 'Hidden',
  },
});

export default (props) => {
  var intl = useIntl();
  const baseFieldTypeChoices = [
    ['text', intl.formatMessage(messages.field_type_text)],
    ['textarea', intl.formatMessage(messages.field_type_textarea)],
    ['select', intl.formatMessage(messages.field_type_select)],
    ['single_choice', intl.formatMessage(messages.field_type_single_choice)],
    [
      'multiple_choice',
      intl.formatMessage(messages.field_type_multiple_choice),
    ],
    ['checkbox', intl.formatMessage(messages.field_type_checkbox)],
    ['date', intl.formatMessage(messages.field_type_date)],
    ['attachment', intl.formatMessage(messages.field_type_attachment)],
    ['from', intl.formatMessage(messages.field_type_from)],
    ['static_text', intl.formatMessage(messages.field_type_static_text)],
    ['hidden', intl.formatMessage(messages.field_type_hidden)],
  ];
  var attachmentDescription =
    props?.field_type === 'attachment'
      ? {
          description: intl.formatMessage(
            messages.field_type_attachment_info_text,
          ),
        }
      : {};

  var schemaExtender =
    config.blocks.blocksConfig.form.fieldTypeSchemaExtenders[props?.field_type];
  const schemaExtenderValues = schemaExtender
    ? schemaExtender(intl)
    : { properties: [], fields: [], required: [] };
  return {
    title: props?.label || '',
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [
          'label',
          'description',
          'field_type',
          ...schemaExtenderValues.fields,
          'required',
        ],
      },
    ],

    properties: {
      label: {
        title: intl.formatMessage(messages.field_label),
        send_to_backend: true,
      },
      description: {
        title: intl.formatMessage(messages.field_description),
      },
      field_type: {
        title: intl.formatMessage(messages.field_type),
        type: 'string',
        choices: [
          ...baseFieldTypeChoices,
          ...(config.blocks.blocksConfig.form.additionalFields?.map(
            (fieldType) => [fieldType.id, fieldType.label],
          ) ?? []),
        ],
        ...attachmentDescription,
      },
      required: {
        title: intl.formatMessage(messages.field_required),
        type: 'boolean',
        default: false,
      },
      ...schemaExtenderValues.properties,
    },
    required: [
      'label',
      'field_type',
      'input_values',
      ...schemaExtenderValues.required,
    ],
  };
};
