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

const DatetimeWrapper = (props) => {
  const {
    id,
    value,
    onChange,
    onClick,
    isDisabled,
    title,
    description,
    widget,
    required,
    intl,
  } = props;

  const ref = useRef();
  const Widget = config.blocks.blocksConfig.schemaForm.innerWidgets.datetime;

  return (
    <FormFieldWrapper {...props} className="text">
      <Widget
        id={`field-${id}`}
        name={id}
        value={value || null}
        label={title}
        locale={intl.locale}
        description={description}
        isRequired={required}
        labelRequired={intl.formatMessage(messages.required)}
        disabled={isDisabled}
        isDateOnly={widget === 'date'}
        onChange={(newValue) => {
          console.log(newValue);
          return onChange(id, newValue === '' ? undefined : newValue);
        }}
        onChangeTime={(value) => {
          console.log(newValue);
          return onChange(id, newValue === '' ? undefined : newValue);
        }}
        ref={ref}
        onClick={() => onClick()}
      />
    </FormFieldWrapper>
  );
};

export default injectIntl(DatetimeWrapper);

DatetimeWrapper.propTypes = {
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
