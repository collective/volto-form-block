const always = () => true;
const value_is = ({ value, target_value }) => value === target_value;
const value_is_not = ({ value, target_value }) => value !== target_value;

export const showWhenValidator = {
  '': always,
  always: always,
  value_is: value_is,
  value_is_not: value_is_not,
};
