import { defineMessages } from 'react-intl';
import config from '@plone/volto/registry';

const messages = defineMessages({
  form: {
    id: 'Form',
    defaultMessage: 'Form',
  },
  title: {
    id: 'Title',
    defaultMessage: 'Title',
  },
  description: {
    id: 'Description',
    defaultMessage: 'Description',
  },
  submit_label: {
    id: 'Submit button label',
    defaultMessage: 'Submit button label',
  },
  show_cancel: {
    id: 'Show cancel button',
    defaultMessage: 'Show cancel button',
  },
  cancel_label: {
    id: 'Cancel button label',
    defaultMessage: 'Cancel button label',
  },
  captcha: {
    id: 'captcha',
    defaultMessage: 'Captcha provider',
  },

  fieldset_email: {
    id: 'Send email',
    defaultMessage: 'Send email',
  },
  send: {
    id: 'Send email to admin',
    defaultMessage: 'Send email to admin',
  },
  send_description: {
    id: 'When activated, an email will be sent to the Admin Recipients (see below) when a form is submitted',
    defaultMessage:
      'When activated, an email will be sent to the Admin Recipients (see below) when a form is submitted',
  },
  recipients: {
    id: 'Admin Recipients',
    defaultMessage: 'Admin Recipients',
  },
  recipients_description: {
    id: 'The email addresses the submitted form data will be sent to. Multiple email addresses can be entered separated by a semicolon.',
    defaultMessage:
      'The email addresses the submitted form data will be sent to. Multiple email addresses can be entered separated by a semicolon.',
  },
  bcc: {
    id: 'Blind carbon copy',
    defaultMessage: 'Blind carbon copy',
  },
  bcc_description: {
    id: 'The email addresses the submitted form data will be sent to as blind carbon copy. Multiple email addresses can be entered separated by a semicolon.',
    defaultMessage:
      'The email addresses the submitted form data will be sent to as blind carbon copy. Multiple email addresses can be entered separated by a semicolon.',
  },
  sender: {
    id: 'Sender',
    defaultMessage: 'Sender',
  },
  sender_description: {
    id: 'The email address of the sender',
    defaultMessage:
      // eslint-disable-next-line no-template-curly-in-string
      'The email address of the sender. Use the ${field_id} syntax to use a form value as the sender.',
  },
  sender_name: {
    id: 'Sender name',
    defaultMessage: 'Sender name',
  },
  sender_name_description: {
    id: 'The name of the sender',
    defaultMessage:
      // eslint-disable-next-line no-template-curly-in-string
      'The name of the sender. Use the ${field_id} syntax to use a form value as the sender name.',
  },
  subject: {
    id: 'Subject',
    defaultMessage: 'Subject',
  },
  subject_description: {
    id:
      // eslint-disable-next-line no-template-curly-in-string
      'The subject used in the sent email. Use the ${field_id} syntax to add a form value to the email subject.',
    defaultMessage:
      // eslint-disable-next-line no-template-curly-in-string
      'The subject used in the sent email. Use the ${field_id} syntax to add a form value to the email subject.',
  },
  mail_header: {
    id: 'Email header',
    defaultMessage: 'Email header',
  },
  mail_header_description: {
    // eslint-disable-next-line no-template-curly-in-string
    id: 'Text at the beginning of the email. Use the ${field_id} syntax to add a form value.',
    // eslint-disable-next-line no-template-curly-in-string
    defaultMessage:
      // eslint-disable-next-line no-template-curly-in-string
      'Text at the beginning of the email. Use the ${field_id} syntax to add a form value.',
  },
  mail_footer: {
    id: 'Email footer',
    defaultMessage: 'Email footer',
  },
  mail_footer_description: {
    // eslint-disable-next-line no-template-curly-in-string
    id: 'Text at the end of the email. Use the ${field_id} syntax to add a form value.',
    defaultMessage:
      // eslint-disable-next-line no-template-curly-in-string
      'Text at the end of the email. Use the ${field_id} syntax to add a form value.',
  },

  fieldset_store: {
    id: 'Store data',
    defaultMessage: 'Store data',
  },
  store: {
    id: 'Store data',
    defaultMessage: 'Store data',
  },
  store_description: {
    id: 'When activated, the data will be stored for later use when the form is submitted',
    defaultMessage:
      'When activated, the data will be stored for later use when the form is submitted',
  },
  data_wipe: {
    id: 'Data wipe',
    defaultMessage: 'Data wipe',
  },
  data_wipe_description: {
    id: 'Number of days after which, the data should be deleted. Enter -1 to store indefinitely.',
    defaultMessage:
      'Number of days after which, the data should be deleted. Enter -1 to store indefinitely.',
  },

  fieldset_send_confirmation: {
    id: 'fieldset_send_confirmation',
    defaultMessage: 'Confirmation email',
  },
  send_confirmation: {
    id: 'send_confirmation',
    defaultMessage: 'Send confirmation email to user',
  },
  confirmation_recipients: {
    id: 'confirmation_recipients',
    defaultMessage: 'Recipients',
  },
  confirmation_recipients_description: {
    id: 'confirmation_recipients_description',
    defaultMessage:
      'Email addresses to send the confirmation to. ' +
      'Multiple email addresses can be entered separated by a semicolon. ' +
      // eslint-disable-next-line no-template-curly-in-string
      'Use the ${field_id} syntax to use a form value as the recipient.',
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

export const schemaFormBlockSchema = ({ intl, ...props }) => {
  let data = props.data || props.formData;
  let conditional_required = [];
  if (!data?.store && !data?.send) {
    conditional_required.push('store');
    conditional_required.push('send');
  }
  if (data?.send_confirmation) {
    conditional_required.push('confirmation_recipients');
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
          ...(data?.show_cancel ? ['cancel_label'] : []),
          'captcha',
        ],
      },
      {
        id: 'send_confirmation',
        title: intl.formatMessage(messages.fieldset_send_confirmation),
        fields: [
          'send_confirmation',
          ...(data?.send_confirmation ? ['confirmation_recipients'] : []),
        ],
      },
      {
        id: 'email',
        title: intl.formatMessage(messages.fieldset_email),
        fields: [
          'send',
          ...(data?.send
            ? [
                'recipients',
                'bcc',
                'sender',
                'sender_name',
                'subject',
                'mail_header',
                'mail_footer',
              ]
            : []),
        ],
      },
      {
        id: 'savedata',
        title: intl.formatMessage(messages.fieldset_store),
        fields: ['store', ...(data?.store ? ['data_wipe'] : [])],
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
      captcha: {
        title: intl.formatMessage(messages.captcha),
        type: 'string',
        vocabulary: {
          '@id': 'collective.volto.formsupport.captcha.providers',
        },
      },

      send: {
        type: 'boolean',
        title: intl.formatMessage(messages.send),
        description: intl.formatMessage(messages.send_description),
      },
      recipients: {
        title: intl.formatMessage(messages.recipients),
        description: intl.formatMessage(messages.recipients_description),
      },
      bcc: {
        title: intl.formatMessage(messages.bcc),
        description: intl.formatMessage(messages.bcc_description),
      },
      sender: {
        title: intl.formatMessage(messages.sender),
        description: intl.formatMessage(messages.sender_description),
        default: config.blocks?.blocksConfig?.schemaForm?.defaultSender,
      },
      sender_name: {
        title: intl.formatMessage(messages.sender_name),
        description: intl.formatMessage(messages.sender_name_description),
        default: config.blocks?.blocksConfig?.schemaForm?.defaultSenderName,
      },
      subject: {
        title: intl.formatMessage(messages.subject),
        description: intl.formatMessage(messages.subject_description),
      },
      mail_header: {
        title: intl.formatMessage(messages.mail_header),
        widget: 'richtext',
        type: 'string',
        description: intl.formatMessage(messages.mail_header_description),
      },
      mail_footer: {
        title: intl.formatMessage(messages.mail_footer),
        widget: 'richtext',
        type: 'string',
        description: intl.formatMessage(messages.mail_footer_description),
      },

      store: {
        type: 'boolean',
        title: intl.formatMessage(messages.store),
        description: intl.formatMessage(messages.store_description),
      },
      data_wipe: {
        type: 'integer',
        title: intl.formatMessage(messages.data_wipe),
        description: intl.formatMessage(messages.data_wipe_description),
        default: -1,
      },

      send_confirmation: {
        type: 'boolean',
        title: intl.formatMessage(messages.send_confirmation),
      },
      confirmation_recipients: {
        title: intl.formatMessage(messages.confirmation_recipients),
        description: intl.formatMessage(
          messages.confirmation_recipients_description,
        ),
      },
    },
    required: conditional_required,
  };
};
