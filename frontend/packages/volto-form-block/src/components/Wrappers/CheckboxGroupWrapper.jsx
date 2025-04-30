import PropTypes from 'prop-types';
import config from '@plone/volto/registry';
import { defineMessages, injectIntl } from 'react-intl';
import { isString, map } from 'lodash';

import FormFieldWrapper from './FormFieldWrapper';

const messages = defineMessages({
  required: {
    id: 'form_required',
    defaultMessage: 'Required',
  },
  select: {
    id: 'select',
    defaultMessage: 'Select...',
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
    error,
    intl,
  } = props;

  const CheckboxGroup =
    config.blocks.blocksConfig.schemaForm.innerWidgets.checkboxGroup;
  const Checkbox =
    config.blocks.blocksConfig.schemaForm.innerWidgets.checkboxGroupOption;
  const Select = config.blocks.blocksConfig.schemaForm.innerWidgets.select;

  const options = choices || [];

  const curValue = value
    ? isString(value)
      ? value.split('\n')
      : value
    : undefined;

  const curDefault = props.default
    ? isString(props.default)
      ? props.default.split('\n')
      : props.default
    : undefined;

  return (
    <FormFieldWrapper {...props} className="text">
      {options.length < 6 && (
        <CheckboxGroup
          id={`field-${id}`}
          name={id}
          value={curValue || []}
          label={title}
          description={description}
          isRequired={required}
          labelRequired={intl.formatMessage(messages.required)}
          disabled={isDisabled}
          onChange={(value) => onChange(id, value)}
          errorMessage={error ? error[0] : ''}
          onClick={() => onClick()}
          isInvalid={error !== undefined}
        >
          {options.map((option) => (
            <Checkbox
              key={option}
              value={option[0]}
              isInvalid={error !== undefined}
            >
              {option[1]}
            </Checkbox>
          ))}
        </CheckboxGroup>
      )}
      {options.length > 5 && (
        <Select
          id={`field-${id}`}
          name={id}
          value={
            (curValue &&
              map(curValue, (item) => ({ value: item, label: item }))) ||
            (curDefault &&
              map(curDefault, (item) => ({
                value: item,
                label: item,
              }))) ||
            undefined
          }
          label={title}
          description={description}
          isRequired={required}
          isMulti={true}
          placeholder={intl.formatMessage(messages.select)}
          labelRequired={intl.formatMessage(messages.required)}
          disabled={isDisabled}
          onChange={(value) => {
            return onChange(
              id,
              map(value, (item) => item.value),
            );
          }}
          onClick={() => onClick()}
          options={options.map((option) => ({
            value: option[0],
            label: option[1],
          }))}
          errorMessage={error ? error[0] : ''}
          isInvalid={error}
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
