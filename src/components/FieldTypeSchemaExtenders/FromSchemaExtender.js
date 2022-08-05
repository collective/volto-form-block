import { defineMessages } from 'react-intl';
const messages = defineMessages({
  field_input_values: {
    id: 'form_field_input_values',
    defaultMessage: 'Possible values',
  },
  useAsReplyTo: {
    id: 'form_useAsReplyTo',
    defaultMessage: "Use as 'reply to'",
  },
  useAsReplyTo_description: {
    id: 'form_useAsReplyTo_description',
    defaultMessage:
      'If selected, this will be the address the receiver can use to reply.',
  },
  useAsBCC: {
    id: 'form_useAsBCC',
    defaultMessage: 'Send an email copy to this address',
  },
  useAsBCC_description: {
    id: 'form_useAsBCC_description',
    defaultMessage:
      'If selected, a copy of email will alse be sent to this address.',
  },
});

export const FromSchemaExtender = (intl) => {
  return {
    fields: ['use_as_reply_to', 'use_as_bcc'],
    properties: {
      use_as_reply_to: {
        title: intl.formatMessage(messages.useAsReplyTo),
        description: intl.formatMessage(messages.useAsReplyTo_description),
        type: 'boolean',
        default: false,
      },
      use_as_bcc: {
        title: intl.formatMessage(messages.useAsBCC),
        description: intl.formatMessage(messages.useAsBCC_description),
        type: 'boolean',
        default: false,
      },
    },
    required: [],
  };
};
