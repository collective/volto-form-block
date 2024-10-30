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
    id: 'send_description',
    defaultMessage:
      'When activated, an email will be sent to the admin recipients (see below) when a form is submitted',
  },
  recipients: {
    id: 'Admin email',
    defaultMessage: 'Admin email',
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
    id: 'Blind copy',
    defaultMessage: 'Blind copy',
  },
  bcc_description: {
    id: 'The email addresses the submitted form data will be sent to as blind carbon copy. Multiple email addresses can be entered separated by a semicolon.',
    defaultMessage:
      'The email addresses the submitted form data will be sent to as blind carbon copy. Multiple email addresses can be entered separated by a semicolon.',
  },
  admin_info: {
    id: 'admin_info',
    defaultMessage: 'Admin info',
  },
  admin_info_description: {
    id: 'admin_info_description',
    defaultMessage:
      'This field can be used to store additional information which should only be displayed in the email sent to the administration email (not for the user email).',
  },
  sender: {
    id: 'Sender',
    defaultMessage: 'Sender',
  },
  sender_description: {
    id: 'The email address of the sender',
    defaultMessage: 'The email address of the sender.',
  },
  sender_name: {
    id: 'Sender name',
    defaultMessage: 'Sender name',
  },
  sender_name_description: {
    id: 'The name of the sender',
    defaultMessage: 'The name of the sender.',
  },
  subject: {
    id: 'Subject',
    defaultMessage: 'Subject',
  },
  subject_description: {
    id: 'The subject used in the sent email.',
    defaultMessage: 'The subject used in the sent email.',
  },
  mail_header: {
    id: 'Email header',
    defaultMessage: 'Email header',
  },
  mail_header_description: {
    id: 'Text at the beginning of the email.',
    defaultMessage: 'Text at the beginning of the email.',
  },
  mail_footer: {
    id: 'Email footer',
    defaultMessage: 'Email footer',
  },
  mail_footer_description: {
    id: 'Text at the end of the email.',
    defaultMessage: 'Text at the end of the email.',
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
    defaultMessage: 'Send confirmation email',
  },
  confirmation_recipients: {
    id: 'confirmation_recipients',
    defaultMessage: 'Recipient',
  },
  confirmation_recipients_description: {
    id: 'confirmation_recipients_description',
    defaultMessage:
      'Send confirmation to the email entered in the following field',
  },
  fixed_attachment: {
    id: 'fixed_attachment',
    defaultMessage: 'Fixed attachment',
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
          ...(data?.send_confirmation
            ? ['confirmation_recipients', 'fixed_attachment']
            : []),
          'send',
          ...(data?.send ? ['recipients', 'bcc', 'admin_info'] : []),
          ...(data?.send || data?.send_confirmation
            ? ['sender', 'sender_name', 'subject', 'mail_header', 'mail_footer']
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
      admin_info: {
        title: intl.formatMessage(messages.admin_info),
        description: intl.formatMessage(messages.admin_info_description),
        widget: 'textarea',
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
        default: props.content?.title,
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
            keys(data.schema?.properties || {}),
            (value) =>
              data.schema.properties[value].factory === 'label_email' ||
              data.schema.properties[value].factory === 'Email',
          ),
          (property) => [property, data.schema.properties[property].title],
        ),
      },
      fixed_attachment: {
        title: intl.formatMessage(messages.fixed_attachment),
        type: 'object',
        widget: 'file',
      },
    },
    required: conditional_required,
  };
};
