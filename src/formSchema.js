import { defineMessages, useIntl } from 'react-intl';

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
  attachXml: {
    id: 'form_attach_xml',
    defaultMessage: 'Attach XML to email',
  },
  storedDataIds: {
    id: 'form_stored_data_ids',
    defaultMessage: 'Data ID mapping',
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

  if (formData.send) {
    fieldsets.push({
      id: 'sendingOptions',
      title: 'Sending options',
      fields: ['attachXml'],
    });
  }

  if (formData.send || formData.store) {
    fieldsets.push({
      id: 'storedDataIds',
      title: intl.formatMessage(messages.storedDataIds),
      fields: formData.subblocks.map((subblock) => subblock.field_id),
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
      attachXml: {
        type: 'boolean',
        title: intl.formatMessage(messages.attachXml),
      },
      ...(formData.subblocks
        ? Object.assign(
            {},
            ...formData.subblocks.map((subblock) => {
              return { [subblock.field_id]: { title: subblock.label } };
            }),
          )
        : {}),
    },
    required: ['default_to', 'default_from', 'default_subject'],
  };
};
