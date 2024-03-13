export const isValidEmail = (email) => {
  // Email Regex taken from from WHATWG living standard:
  // https://html.spec.whatwg.org/multipage/input.html#e-mail-state-(type=email)
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9.](?:[a-zA-Z0-9-.]{0,61}[a-zA-Z0-9.])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)$/;
  const isValid = emailRegex.test(email);
  return isValid;
};
