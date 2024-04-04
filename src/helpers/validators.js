import { defineMessages } from 'react-intl';

const messages = defineMessages({
  invalid_default_from: {
    id: 'form_edit_invalid_from_email',
    defaultMessage:
      "The e-mail entered in the 'From' field must be a valid e-mail address.",
  },
  invalid_default_to: {
    id: 'form_edit_invalid_to_email',
    defaultMessage:
      "The e-mail entered in the 'Receipients' field must be a valid e-mail address.",
  },
});

export const isValidEmail = (email) => {
  // Email Regex taken from from WHATWG living standard:
  // https://html.spec.whatwg.org/multipage/input.html#e-mail-state-(type=email)
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9.](?:[a-zA-Z0-9-.]{0,61}[a-zA-Z0-9.])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)$/;
  const isValid = emailRegex.test(email);
  return isValid;
};

export const validateDefaultFrom = (from, intl) => {
  return isValidEmail(from)
    ? null
    : intl.formatMessage(messages.invalid_default_from);
};

export const validateDefaultTo = (to, intl) => {
  let valid = true;
  let emails = to?.split(',').map((e) => e.replaceAll(' ', '')) ?? [];
  emails.forEach((e) => {
    if (!isValidEmail(e)) {
      valid = false;
    }
  });
  return valid ? null : intl.formatMessage(messages.invalid_default_to);
};
