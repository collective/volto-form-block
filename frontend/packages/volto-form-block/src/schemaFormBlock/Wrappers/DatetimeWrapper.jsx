import { useRef } from 'react';
import PropTypes from 'prop-types';
import config from '@plone/volto/registry';
import { defineMessages, injectIntl } from 'react-intl';
import {
  parseAbsolute,
  parseAbsoluteToLocal,
  parseDate,
  parseDateTime,
} from '@internationalized/date';
import moment from 'moment';

import FormFieldWrapper from './FormFieldWrapper';

const messages = defineMessages({
  required: {
    id: 'form_required',
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
  const onDateChange = (date) => {
    if (date) {
      const base = moment().set({
        year: date.year,
        month: date.month - 1,
        date: date.day,
        ...(widget === 'date'
          ? {}
          : {
              hour: date.hour,
              minute: date.minute,
              second: date.second,
            }),
      });
      onChange(
        id,
        widget === 'date' ? base.format('YYYY-MM-DD') : base.toISOString(),
      );
    } else {
      onChange(id, undefined);
    }
  };

  let dateValue = value
    ? widget === 'date'
      ? parseDate(value)
      : parseDateTime(moment(value).format('YYYY-MM-DDTHH:mm:ss'))
    : null;

  return (
    <FormFieldWrapper {...props} className="text">
      <Widget
        id={`field-${id}`}
        name={id}
        value={dateValue}
        label={title}
        locale={intl.locale}
        description={description}
        isRequired={required}
        labelRequired={intl.formatMessage(messages.required)}
        disabled={isDisabled}
        isDateOnly={widget === 'date'}
        onChange={onDateChange}
        onChangeTime={onDateChange}
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
