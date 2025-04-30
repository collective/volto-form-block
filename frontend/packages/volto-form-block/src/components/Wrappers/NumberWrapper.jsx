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

const NumberWrapper = (props) => {
  const {
    id,
    value,
    onChange,
    onClick,
    placeholder,
    isDisabled,
    title,
    description,
    required,
    error,
    intl,
  } = props;

  const Widget = config.blocks.blocksConfig.schemaForm.innerWidgets.number;

  return (
    <FormFieldWrapper {...props} className="text">
      <Widget
        id={`field-${id}`}
        name={id}
        value={value || ''}
        label={title}
        description={description}
        type="number"
        isRequired={required}
        labelRequired={intl.formatMessage(messages.required)}
        disabled={isDisabled}
        placeholder={placeholder}
        onChange={(value) => onChange(id, value === '' ? undefined : value)}
        errorMessage={error ? error[0] : ''}
        isInvalid={error}
        onClick={() => onClick()}
      />
    </FormFieldWrapper>
  );
};

export default injectIntl(NumberWrapper);

NumberWrapper.propTypes = {
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
