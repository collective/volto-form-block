/**
 * HoneypotCaptchaWidget component.
 * @module components/manage/Widgets/HoneypotCaptchaWidget
 */

import React, { useState } from 'react';

import TextWidget from '@plone/volto/components/manage/Widgets/TextWidget';
import './HoneypotCaptchaWidget.css';

/**
 * HoneypotCaptchaWidget component class.
 * @function HoneypotCaptchaWidget
 * @returns {string} Markup of the component.
 */
const HoneypotCaptchaWidget = ({ id, id_check, title, captchaToken }) => {
  const createToken = (id, id_check, value) => {
    const token = {
      id: id,
      id_check: id_check,
      value: value,
    };
    return JSON.stringify(token);
  };
  const [value, setValue] = useState();
  return (
    <div className="honey-wrapper" key={'honeypot-captcha'}>
      <TextWidget
        id={id}
        name={id}
        label={title}
        title={title}
        onChange={(field, value) => {
          captchaToken.current = createToken(id, id_check, value);
          setValue(value);
        }}
        value={value}
      />
    </div>
  );
};

export default HoneypotCaptchaWidget;
