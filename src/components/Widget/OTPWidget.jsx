/**
 * OTPWidget component.
 * @module components/Widget/OTPWidget
 */

import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl, defineMessages } from 'react-intl';
import { isValidEmail } from 'volto-form-block/helpers/validators';
import Field from 'volto-form-block/components/Field';
import { Button } from 'volto-form-block/components/Widget';
import { sendOTP } from 'volto-form-block/actions';

import 'volto-form-block/components/Widget/OTPWidget.css';
export const OTP_FIELDNAME_EXTENDER = '_otp';

const messages = defineMessages({
  send_otp_to: {
    id: 'form_send_otp_to',
    defaultMessage: 'Send OTP code to {email}',
  },
  insert_otp: {
    id: 'form_insert_otp',
    defaultMessage: 'Insert here the OTP code received at {email}',
  },
  otp_sent: {
    id: 'form_otp_send',
    defaultMessage:
      'OTP code was sent to {email}. Check your email and insert the received OTP code into the field above.',
  },
  otp_countdown: {
    id: 'form_otp_countdown',
    defaultMessage: 'You can send a new OTP code in',
  },
});
const getCountDownValues = (countDown) => {
  // calculate time left
  const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

  return [days, hours, minutes, seconds];
};

const OTPWidget = (props) => {
  const OTP_EXIPIRE_MINUTES = 5;
  const {
    id,
    title,
    fieldValue,
    onChange,
    value,
    valid,
    disabled,
    isOnEdit,
    formHasErrors,
    errorMessage,
    path,
    block_id,
  } = props;
  const intl = useIntl();
  const dispatch = useDispatch();
  const _id = id + OTP_FIELDNAME_EXTENDER;
  const sendOTPResponse = useSelector(
    (state) =>
      state.sendOTP?.subrequests?.['otp_' + block_id + '_' + fieldValue],
  );
  const [countDownEnd, setCountDownEnd] = useState(null);
  const [countDown, setCountDown] = useState(null);

  const displayWidget = isValidEmail(fieldValue);

  const sendOTPCode = () => {
    dispatch(sendOTP(path, block_id, fieldValue));
  };

  useEffect(() => {
    if (sendOTPResponse?.loaded) {
      const end = new Date().getTime() + OTP_EXIPIRE_MINUTES * 60000;
      setCountDownEnd(end);
      setCountDown(end - new Date().getTime());

      const interval = setInterval(() => {
        setCountDown(countDownEnd - new Date().getTime());
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCountDown(null);
      setCountDownEnd(null);
    }
  }, [sendOTPResponse, countDownEnd]);

  return displayWidget ? (
    <div className="otp-widget">
      <div className="otp-widget-field-wrapper">
        <div className="button-wrapper">
          <Button
            basic
            size="mini"
            primary
            type="button"
            onClick={(e) => {
              e.preventDefault();
              sendOTPCode();
            }}
            className="send-otp-code"
            disabled={countDown > 0}
          >
            {intl.formatMessage(messages.send_otp_to, { email: fieldValue })}
          </Button>
          {countDown > 0 && (
            <div className="otp-button-message">
              {intl.formatMessage(messages.otp_countdown)}{' '}
              {getCountDownValues(countDown)
                .filter((v, index) => v > 0 || index === 2 || index === 3)
                .map((v) => (v < 10 ? '0' + v : v))
                .join(':')}
              .
            </div>
          )}
        </div>

        <Field
          label={
            title ??
            intl.formatMessage(messages.insert_otp, { email: fieldValue })
          }
          name={_id}
          id={id}
          field_type="text"
          required={true}
          value={value || ''}
          onChange={onChange}
          valid={valid}
          disabled={disabled}
          formHasErrors={formHasErrors}
          errorMessage={errorMessage}
          isOnEdit={isOnEdit}
        />
      </div>

      {sendOTPResponse?.loaded && !sendOTPResponse?.loading && (
        <div className="otp-alert otp-success">
          {intl.formatMessage(messages.otp_sent, { email: fieldValue })}
        </div>
      )}

      {sendOTPResponse?.error && (
        <div className="otp-alert otp-error">
          {JSON.stringify(sendOTPResponse.error)}
        </div>
      )}
    </div>
  ) : (
    <></>
  );
};

/**
 * Property types
 * @property {Object} propTypes Property types.
 * @static
 */
OTPWidget.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  minLength: PropTypes.number,
  maxLength: PropTypes.number,
  placeholder: PropTypes.string,
};

/**
 * Default properties.
 * @property {Object} defaultProps Default properties.
 * @static
 */
OTPWidget.defaultProps = {
  description: null,
  required: false,
  error: [],
  value: null,
  onChange: () => {},
  onBlur: () => {},
  onClick: () => {},
  minLength: null,
  maxLength: null,
};

export default OTPWidget;
