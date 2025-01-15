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
});

const CheckboxWrapper = (props) => {
  const {
    id,
    value,
    onChange,
    onClick,
    isDisabled,
    title,
    description,
    required,
    error,
    intl,
  } = props;

  const ref = useRef();
  const Widget = config.blocks.blocksConfig.schemaForm.innerWidgets.checkbox;

  return (
    <FormFieldWrapper {...props} className="text">
      <Widget
        id={`field-${id}`}
        name={id}
        value={value || ''}
        label={title}
        description={description}
        default={props.default}
        isRequired={required}
        labelRequired={intl.formatMessage(messages.required)}
        disabled={isDisabled}
        onChange={(value) => onChange(id, value === '' ? undefined : value)}
        ref={ref}
        onClick={() => onClick()}
        errorMessage={error ? error[0] : ''}
        isInvalid={error !== undefined}
      />
    </FormFieldWrapper>
  );
};

export default injectIntl(CheckboxWrapper);

CheckboxWrapper.propTypes = {
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
