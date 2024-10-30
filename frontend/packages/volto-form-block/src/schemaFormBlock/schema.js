import { defineMessages } from 'react-intl';
import config from '@plone/volto/registry';
import { map, keys, filter } from 'lodash';

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
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
  },
  submit: {
    id: 'Submit',
    defaultMessage: 'Submit',
  },
  captcha: {
    id: 'captcha',
    defaultMessage: 'Captcha provider',
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
  forward_user_to: {
    id: 'forward_user_to',
    defaultMessage: 'Forward user to',
  },
  forward_user_to_description: {
    id: 'forward_user_to_description',
    defaultMessage:
      'If a page is specified, the user will be directed there after submitting the form. The thank you message will not be displayed.',
  },
  success: {
    id: 'success',
    defaultMessage: 'Success message',
  },
  success_default: {
    id: 'success_default',
    defaultMessage: 'Thank you! You have submitted the following data:',
  },
  thankyou: {
    id: 'thankyou',
    defaultMessage: 'Thank you message',
  },
  thankyou_description: {
    id: 'thankyou_description',
    defaultMessage:
      'A text with simple formatting can be entered. Also it is possible to use variables; ${field_id} can be used to display the value of a field inside the form. The ${formfields} variable lists all form fields in a tabular view.',
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
  fieldset_mailing: {
    id: 'fieldset_mailing',
    defaultMessage: 'Mailing',
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
          'forward_user_to',
          'success',
          'thankyou',
          'captcha',
        ],
      },
      {
        id: 'mailing',
        title: intl.formatMessage(messages.fieldset_mailing),
        fields: [
          'send_confirmation',
          ...(data?.send_confirmation ? ['confirmation_recipients'] : []),
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
        widget: 'textarea',
      },
      submit_label: {
        title: intl.formatMessage(messages.submit_label),
        default: intl.formatMessage(messages.submit),
      },
      show_cancel: {
        type: 'boolean',
        title: intl.formatMessage(messages.show_cancel),
        default: false,
      },
      cancel_label: {
        title: intl.formatMessage(messages.cancel_label),
        default: intl.formatMessage(messages.cancel),
      },
      forward_user_to: {
        title: intl.formatMessage(messages.forward_user_to),
        description: intl.formatMessage(messages.forward_user_to_description),
        widget: 'object_browser',
        mode: 'link',
        allowExternals: true,
      },
      success: {
        type: 'string',
        title: intl.formatMessage(messages.success),
        default: intl.formatMessage(messages.success_default),
      },
      thankyou: {
        type: 'string',
        title: intl.formatMessage(messages.thankyou),
        description: intl.formatMessage(messages.thankyou_description),
        widget: 'richtext',
        default: {
          data: '${formfields}',
        },
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
        choices: map(
          filter(
            keys(data.schema.properties),
            (value) =>
              data.schema.properties[value].factory === 'label_email' ||
              data.schema.properties[value].factory === 'Email',
          ),
          (property) => [property, data.schema.properties[property].title],
        ),
      },
    },
    required: conditional_required,
  };
};
