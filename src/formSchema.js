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
  headers: {
    id: 'Headers',
    defaultMessage: 'Headers',
  },
  headersDescription: {
    id: 'Headers Description',
    defaultMessage: "These headers aren't included in the sent email by default. Use this dropdown to include them in the sent email",
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
    defaultMessage: 'Send email to',
  },
  attachXml: {
    id: 'form_attach_xml',
    defaultMessage: 'Attach XML to email',
  },
  storedDataIds: {
    id: 'form_stored_data_ids',
    defaultMessage: 'Data ID mapping',
  },
  email_format: {
    id: 'form_email_format',
    defaultMessage: 'Email format',
  },
});

export default (formData) => {
  var intl = useIntl();
  const emailFields =
    formData?.subblocks?.reduce((acc, field) => {
      return ['from', 'email'].includes(field.field_type)
        ? [...acc, [field.id, field.label]]
        : acc;
    }, []) ?? [];

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
        ...(formData?.send &&
        Array.isArray(formData.send) &&
        formData.send.includes('acknowledgement')
          ? ['acknowledgementFields', 'acknowledgementMessage']
          : []),
      ],
    },
  ];

  if (formData?.send) {
    fieldsets.push({
      id: 'sendingOptions',
      title: 'Sending options',
      fields: ['attachXml', 'httpHeaders', 'email_format'],
    });
  }

  if (formData?.send || formData?.store) {
    fieldsets.push({
      id: 'storedDataIds',
      title: intl.formatMessage(messages.storedDataIds),
      fields: formData?.subblocks?.map((subblock) => subblock.field_id),
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
        type: 'string',
        vocabulary: {
          '@id': 'collective.volto.formsupport.captcha.providers',
        },
      },
      store: {
        type: 'boolean',
        title: intl.formatMessage(messages.store),
      },
      send: {
        title: intl.formatMessage(messages.send),
        isMulti: 'true',
        default: 'recipient',
        choices: [
          ['recipient', 'Recipient'],
          ['acknowledgement', 'Acknowledgement'],
        ],
      },
      acknowledgementMessage: {
        // TODO: i18n
        title: 'Acknowledgement message',
        widget: 'richtext',
      },
      acknowledgementFields: {
        // TODO: i18n
        title: 'Acknowledgement field',
        decription:
          'Select which fields will contain an email address to send an acknowledgement to.',
        isMulti: false,
        noValueOption: false,
        choices: formData?.subblocks ? emailFields : [],
        ...(emailFields.length === 1 && { default: emailFields[0][0] }),
      },
      attachXml: {
        type: 'boolean',
        title: intl.formatMessage(messages.attachXml),
      },
      // Add properties for each of the fields for use in the data mapping
      ...(formData?.subblocks
        ? Object.assign(
            {},
            ...formData?.subblocks?.map((subblock) => {
              return { [subblock.field_id]: { title: subblock.label } };
            }),
          )
        : {}),
      httpHeaders: {
        type: 'boolean',
        title: intl.formatMessage(messages.headers),
        description: intl.formatMessage(messages.headersDescription),
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
      email_format: {
        title: intl.formatMessage(messages.email_format),
        type: 'string',
        choices: [
          ['list', 'List'],
          ['table', 'Table'],
        ],
        noValueOption: false,
      },
    },
    required: ['default_to', 'default_from', 'default_subject'],
  };
};
