import { useRef } from 'react';
import PropTypes from 'prop-types';
import config from '@plone/volto/registry';

import FormFieldWrapper from './FormFieldWrapper';

const RadioGroupWrapper = (props) => {
  const {
    id,
    value,
    choices,
    onChange,
    onClick,
    isDisabled,
    title,
    description,
  } = props;

  const ref = useRef();
  const Widget = config.blocks.blocksConfig.schemaForm.innerWidgets.radioGroup;
  const OptionWidget =
    config.blocks.blocksConfig.schemaForm.innerWidgets.radioGroupOption;

  const options = choices || [];

  return (
    <FormFieldWrapper {...props} className="text">
      <Widget
        id={`field-${id}`}
        name={id}
        value={value || undefined}
        label={title}
        description={description}
        disabled={isDisabled}
        onChange={(value) => onChange(id, value === '' ? undefined : value)}
        ref={ref}
        onClick={() => onClick()}
      >
        {options.map((option) => (
          <OptionWidget value={option[0]}>{option[1]}</OptionWidget>
        ))}
      </Widget>
    </FormFieldWrapper>
  );
};

export default RadioGroupWrapper;

RadioGroupWrapper.propTypes = {
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
};
