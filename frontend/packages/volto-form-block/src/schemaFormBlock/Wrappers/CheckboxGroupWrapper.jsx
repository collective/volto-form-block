import { useRef } from 'react';
import PropTypes from 'prop-types';
import config from '@plone/volto/registry';
import { defineMessages, injectIntl } from 'react-intl';

import FormFieldWrapper from './FormFieldWrapper';

const messages = defineMessages({
  required: {
    id: 'Required',
    defaultMessage: 'Required',
  },
});

const CheckboxGroupWrapper = (props) => {
  const {
    id,
    value,
    choices,
    onChange,
    onClick,
    isDisabled,
    title,
    description,
    required,
    intl,
  } = props;

  const ref = useRef();
  const CheckboxGroup =
    config.blocks.blocksConfig.schemaForm.innerWidgets.checkboxGroup;
  const Checkbox =
    config.blocks.blocksConfig.schemaForm.innerWidgets.checkboxGroupOption;
  const Select = config.blocks.blocksConfig.schemaForm.innerWidgets.select;

  const options = choices || [];

  return (
    <FormFieldWrapper {...props} className="text">
      {options.length < 6 && (
        <CheckboxGroup
          id={`field-${id}`}
          name={id}
          value={value || []}
          label={title}
          description={description}
          isRequired={required}
          labelRequired={intl.formatMessage(messages.required)}
          disabled={isDisabled}
          onChange={(value) => onChange(id, value)}
          ref={ref}
          onClick={() => onClick()}
        >
          {options.map((option) => (
            <Checkbox value={option[0]}>{option[1]}</Checkbox>
          ))}
        </CheckboxGroup>
      )}
      {options.length > 5 && (
        <Select
          id={`field-${id}`}
          name={id}
          value={
            (value && { value, label: value }) ||
            (props.default && { value: props.default, label: props.default }) ||
            undefined
          }
          label={title}
          description={description}
          isRequired={required}
          isMulti={true}
          labelRequired={intl.formatMessage(messages.required)}
          disabled={isDisabled}
          onChange={(value) => onChange(id, value.value)}
          ref={ref}
          onClick={() => onClick()}
          options={options.map((option) => ({
            value: option[0],
            label: option[1],
          }))}
        />
      )}
    </FormFieldWrapper>
  );
};

export default injectIntl(CheckboxGroupWrapper);

CheckboxGroupWrapper.propTypes = {
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
