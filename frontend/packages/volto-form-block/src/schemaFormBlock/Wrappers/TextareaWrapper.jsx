import { useRef } from 'react';
import PropTypes from 'prop-types';
import config from '@plone/volto/registry';

import FormFieldWrapper from './FormFieldWrapper';

const TextareaWrapper = (props) => {
  const {
    id,
    value,
    onChange,
    onClick,
    minLength,
    maxLength,
    placeholder,
    isDisabled,
    title,
    description,
  } = props;

  const ref = useRef();
  const Widget = config.blocks.blocksConfig.schemaForm.innerWidgets.textarea;

  return (
    <FormFieldWrapper {...props} className="text">
      <Widget
        id={`field-${id}`}
        name={id}
        value={value || ''}
        label={title}
        description={description}
        disabled={isDisabled}
        placeholder={placeholder}
        onChange={(value) => onChange(id, value === '' ? undefined : value)}
        ref={ref}
        onClick={() => onClick()}
        minLength={minLength || null}
        maxLength={maxLength || null}
      />
    </FormFieldWrapper>
  );
};

export default TextareaWrapper;

TextareaWrapper.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.string,
  focus: PropTypes.bool,
  onChange: PropTypes.func,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  minLength: null,
  maxLength: null,
};
