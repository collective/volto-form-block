import { useRef } from 'react';
import PropTypes from 'prop-types';
import config from '@plone/volto/registry';
import { defineMessages, injectIntl } from 'react-intl';

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

const SelectWrapper = (props) => {
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
  const Widget = config.blocks.blocksConfig.schemaForm.innerWidgets.select;

  const options = choices || [];

  return (
    <FormFieldWrapper {...props} className="select">
      <Widget
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
        labelRequired={intl.formatMessage(messages.required)}
        disabled={isDisabled}
        placeholder={intl.formatMessage(messages.select)}
        onChange={(value) => onChange(id, value.value)}
        ref={ref}
        onClick={() => onClick()}
        options={options.map((option) => ({
          value: option[0],
          label: option[1],
        }))}
      />
    </FormFieldWrapper>
  );
};

export default injectIntl(SelectWrapper);

SelectWrapper.propTypes = {
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
