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
  invisibleHCaptcha: {
    id: 'invisible_hcaptcha',
    defaultMessage: 'Invisible captcha',
  },
  invisibleHCaptchaDescription: {
    id: 'invisible_hcaptcha_desc',
    defaultMessage:
      'See https://docs.hcaptcha.com/faq#do-i-need-to-display-anything-on-the-page-when-using-hcaptcha-in-invisible-mode',
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

export default () => {
  var intl = useIntl();
  var invisibleHCaptcha = process.env.RAZZLE_HCAPTCHA_KEY
    ? ['invisibleHCaptcha']
    : [];
  return {
    title: intl.formatMessage(messages.form),
    fieldsets: [
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
          ...invisibleHCaptcha,
          'store',
          'send',
        ],
      },
    ],
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
      invisibleHCaptcha: {
        type: 'boolean',
        title: intl.formatMessage(messages.invisibleHCaptcha),
        description: intl.formatMessage(messages.invisibleHCaptchaDescription),
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
    },
    required: ['default_to', 'default_from', 'default_subject'],
  };
};
