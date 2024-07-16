import PropTypes from 'prop-types';

/**
 * Displays an `<input type="hidden" />`.
 */
export const HiddenWidget = ({ id, title, value, isOnEdit }) => {
  const inputId = `field-${id}`;
  return (
    <>
      {isOnEdit ? <label htmlFor={inputId}>Hidden: {title || id}</label> : null}
      <input type="hidden" id={inputId} name={id} value={value} />
    </>
  );
};

HiddenWidget.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.string,
  focus: PropTypes.bool,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  minLength: PropTypes.number,
  maxLength: PropTypes.number,
  wrapped: PropTypes.bool,
  placeholder: PropTypes.string,
};
