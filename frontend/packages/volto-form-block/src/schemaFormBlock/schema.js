import { defineMessages } from 'react-intl';

const messages = defineMessages({
  form: {
    id: 'form',
    defaultMessage: 'Form',
  },
  title: {
    id: 'title',
    defaultMessage: 'Title',
  },
  description: {
    id: 'description',
    defaultMessage: 'Description',
  },
  default_to: {
    id: 'form_to',
    defaultMessage: 'Recipients',
  },
  default_from: {
    id: 'form_default_from',
    defaultMessage: 'Default sender',
  },
  default_subject: {
    id: 'form_default_subject',
    defaultMessage: 'Mail subject',
  },
  default_subject_description: {
    id: 'form_default_subject_description',
    defaultMessage:
      // eslint-disable-next-line no-template-curly-in-string
      'Use the ${field_id} syntax to add a form value to the email subject',
  },
  submit_label: {
    id: 'form_submit_label',
    defaultMessage: 'Submit button label',
  },
  show_cancel: {
    id: 'form_show_cancel',
    defaultMessage: 'Show cancel button',
  },
  cancel_label: {
    id: 'form_cancel_label',
    defaultMessage: 'Cancel button label',
  },
  captcha: {
    id: 'captcha',
    defaultMessage: 'Captcha provider',
  },
  store: {
    id: 'form_save_persistent_data',
    defaultMessage: 'Store compiled data',
  },
  remove_data_after_days: {
    id: 'form_remove_data_after_days',
    defaultMessage: 'Data wipe',
  },
  remove_data_after_days_helptext: {
    id: 'form_remove_data_after_days_helptext',
    defaultMessage: 'Number of days after which, the data should be deleted',
  },
  attachmentSendEmail: {
    id: 'form_attachment_send_email_info_text',
    defaultMessage: 'Attached file will be sent via email, but not stored',
  },
  send: {
    id: 'form_send_email',
    defaultMessage: 'Send email to recipient',
  },
  send_message: {
    id: 'form_send_message',
    defaultMessage: 'Message of sending confirmed',
  },
  send_message_helptext: {
    id: 'form_send_message_helptext',
    defaultMessage:
      // eslint-disable-next-line no-template-curly-in-string
      'You can add the value of a filled field in the form by inserting its ID between curly brackets preceded by $, example: ${field_id}; you can add also html elements such as links <a>, new line <br />, bold <b> and italic <i> formatting.',
  },
  fieldset_confirmation: {
    id: 'fieldset_confirmation',
    defaultMessage: 'Confirmation',
  },
  fieldset_savedata: {
    id: 'fieldset_savedata',
    defaultMessage: 'Store data',
  },
  fieldset_email: {
    id: 'fieldset_email',
    defaultMessage: 'Send email',
  },
  mail_header_label: {
    id: 'mail_header_label',
    defaultMessage: 'Text at the beginning of the email',
  },
  mail_header_footer_description: {
    id: 'mail_header_description',
    defaultMessage: "If field isn't filled in, a default text will be used",
  },
  mail_footer_label: {
    id: 'mail_footer_label',
    defaultMessage: 'Text at the end of the email',
  },
});

const defaultEmptyData = {
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: [],
    },
  ],
  properties: {},
  required: [],
};

export const schemaFormBlockSchema = ({ formData, intl }) => {
  let conditional_required = [];
  if (!formData?.store && !formData?.send) {
    conditional_required.push('store');
    conditional_required.push('send');
  }

  return {
    title: intl.formatMessage(messages.form),
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [
          'title',
          'description',
          'submit_label',
          'show_cancel',
          ...(formData?.show_cancel ? ['cancel_label'] : []),
          'captcha',
        ],
      },
      {
        id: 'confirmation',
        title: intl.formatMessage(messages.fieldset_confirmation),
        fields: ['send_message'],
      },
      {
        id: 'email',
        title: intl.formatMessage(messages.fieldset_email),
        fields: [
          'send',
          'default_to',
          'default_from',
          'default_subject',
          'mail_header',
          'mail_footer',
        ],
      },
      {
        id: 'savedata',
        title: intl.formatMessage(messages.fieldset_savedata),
        fields: ['store', 'remove_data_after_days'],
      },
    ],
    properties: {
      schema: {
        title: 'Schema',
        default: defaultEmptyData,
      },
      title: {
        title: intl.formatMessage(messages.title),
      },
      description: {
        title: intl.formatMessage(messages.description),
        type: 'textarea',
      },
      default_to: {
        title: intl.formatMessage(messages.default_to),
      },
      default_from: {
        title: intl.formatMessage(messages.default_from),
      },
      default_subject: {
        title: intl.formatMessage(messages.default_subject),
        description: intl.formatMessage(messages.default_subject_description),
      },
      submit_label: {
        title: intl.formatMessage(messages.submit_label),
      },
      show_cancel: {
        type: 'boolean',
        title: intl.formatMessage(messages.show_cancel),
        default: false,
      },
      cancel_label: {
        title: intl.formatMessage(messages.cancel_label),
      },
      mail_header: {
        title: intl.formatMessage(messages.mail_header_label),
        widget: 'richtext',
        type: 'string',
        description: intl.formatMessage(
          messages.mail_header_footer_description,
        ),
      },
      mail_footer: {
        title: intl.formatMessage(messages.mail_footer_label),
        widget: 'richtext',
        type: 'string',
        description: intl.formatMessage(
          messages.mail_header_footer_description,
        ),
      },
      captcha: {
        title: intl.formatMessage(messages.captcha),
        type: 'string',
        vocabulary: {
          '@id': 'collective.volto.formsupport.captcha.providers',
        },
      },
      store: {
        type: 'boolean',
        title: intl.formatMessage(messages.store),
      },
      remove_data_after_days: {
        type: 'integer',
        title: intl.formatMessage(messages.remove_data_after_days),
        description: intl.formatMessage(
          messages.remove_data_after_days_helptext,
        ),
        default: -1,
      },
      send: {
        type: 'boolean',
        title: intl.formatMessage(messages.send),
        description: intl.formatMessage(messages.attachmentSendEmail),
      },
      send_message: {
        title: intl.formatMessage(messages.send_message),
        widget: 'textarea',
        description: intl.formatMessage(messages.send_message_helptext),
      },
    },
    required: ['default_from', 'captcha', ...conditional_required],
  };
};
