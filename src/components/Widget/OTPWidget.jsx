/**
 * OTPWidget component.
 * @module components/Widget/OTPWidget
 */

import PropTypes from 'prop-types';
import React from 'react';
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
});

const OTPWidget = (props) => {
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
    (state) => state.sendOTP?.subrequests?.[block_id + '_' + fieldValue],
  );

  const displayWidget = isValidEmail(fieldValue);

  const sendOTPCode = () => {
    dispatch(sendOTP(path, block_id, fieldValue));
  };

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
          >
            {intl.formatMessage(messages.send_otp_to, { email: fieldValue })}
          </Button>
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

      {sendOTPResponse?.error && (
        <div className="otp-send-error">
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
