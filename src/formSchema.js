import { defineMessages } from 'react-intl';
import { useIntl } from 'react-intl';

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
  submit_label: {
    id: 'form_submit_label',
    defaultMessage: 'Submit button label',
  },
  captcha: {
    id: 'captcha',
    defaultMessage: 'Captcha provider',
  },
  headers: {
    id: 'Headers',
    defaultMessage: 'Headers',
  },
  store: {
    id: 'form_save_persistent_data',
    defaultMessage: 'Store compiled data',
  },
  attachmentSendEmail: {
    id: 'form_attachment_send_email_info_text',
    defaultMessage: 'Attached file will be sent via email, but not stored',
  },
  send: {
    id: 'form_send_email',
    defaultMessage: 'Send email to recipient',
  },
});

export default (formData) => {
  var intl = useIntl();

  const fieldsets = [
    {
      id: 'default',
      title: 'Default',
      fields: [
        'title',
        'description',
        'default_to',
        'default_from',
        'default_subject',
        'submit_label',
        'captcha',
        'store',
        'send',
      ],
    },
  ];

  if (formData?.send) {
    fieldsets.push({
      id: 'sendingOptions',
      title: 'Sending options',
      fields: ['httpHeaders'],
    });
  }

  return {
    title: intl.formatMessage(messages.form),
    fieldsets: fieldsets,
    properties: {
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
      },
      submit_label: {
        title: intl.formatMessage(messages.submit_label),
      },
      captcha: {
        title: intl.formatMessage(messages.captcha),
        type: 'array',
        vocabulary: {
          '@id': 'collective.volto.formsupport.captcha.providers',
        },
      },
      store: {
        type: 'boolean',
        title: intl.formatMessage(messages.store),
        description: intl.formatMessage(messages.attachmentSendEmail),
      },
      send: {
        type: 'boolean',
        title: intl.formatMessage(messages.send),
      },
      httpHeaders: {
        type: 'boolean',
        title: intl.formatMessage(messages.headers),
        type: 'string',
        factory: 'Choice',
        default: '',
        isMulti: true,
        noValueOption: false,
        choices: [
          ['HTTP_X_FORWARDED_FOR','HTTP_X_FORWARDED_FOR'],
          ['HTTP_X_FORWARDED_PORT','HTTP_X_FORWARDED_PORT'],
          ['REMOTE_ADDR','REMOTE_ADDR'],
          ['PATH_INFO','PATH_INFO'],
          ['HTTP_USER_AGENT','HTTP_USER_AGENT'],
          ['HTTP_REFERER','HTTP_REFERER'],
        ],
      },
    },
    required: ['default_to', 'default_from', 'default_subject'],
  };
};
