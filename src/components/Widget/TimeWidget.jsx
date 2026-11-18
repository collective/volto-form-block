/**
 * TimeWidget component.
 * @module components/Widget/TimeWidget
 *
 * Timepicker without a date.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';
import loadable from '@loadable/component';
import FormFieldWrapper from '@plone/volto/components/manage/Widgets/FormFieldWrapper';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';

import 'rc-time-picker/assets/index.css';

const TimePicker = loadable(() => import('rc-time-picker'));

const TIME_FORMAT = 'HH:mm';

const messages = defineMessages({
  time: {
    id: 'Time',
    defaultMessage: 'Time',
  },
});

const TimeWidget = (props) => {
  const { id, value, onChange, isDisabled, required, invalid } = props;
  const moment = props.moment.default;
  const intl = useIntl();

  const time = value ? moment(value, TIME_FORMAT, true) : null;

  let attributes = {};
  if (required) {
    attributes.required = true;
    attributes['aria-required'] = true;
  }
  if (invalid === true || invalid === 'true') {
    attributes['aria-invalid'] = true;
  }

  return (
    <FormFieldWrapper {...props}>
      <div className="date-time-widget-wrapper">
        <div className="ui input time-input">
          <TimePicker
            id={`${id}-time`}
            name={id}
            disabled={isDisabled}
            value={time?.isValid() ? time : null}
            // Picking only the hour must not take the minutes from now
            defaultOpenValue={moment().startOf('day')}
            onChange={(t) => onChange(id, t ? t.format(TIME_FORMAT) : null)}
            allowEmpty
            showSecond={false}
            use12Hours={intl.locale === 'en'}
            format={moment.localeData(intl.locale).longDateFormat('LT')}
            placeholder={intl.formatMessage(messages.time)}
            focusOnOpen
            placement="bottomLeft"
            {...attributes}
          />
        </div>
      </div>
    </FormFieldWrapper>
  );
};

TimeWidget.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool,
  wrapped: PropTypes.bool,
};

TimeWidget.defaultProps = {
  description: null,
  required: false,
  error: [],
  value: null,
  isDisabled: false,
};

export default injectLazyLibs(['moment'])(TimeWidget);
