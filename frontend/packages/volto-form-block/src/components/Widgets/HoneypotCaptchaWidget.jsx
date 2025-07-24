import React, { useEffect } from 'react';
import TextWidget from '@plone/volto/components/manage/Widgets/TextWidget';

import 'volto-form-block/components/Widgets/HoneypotCaptchaWidget.css';

/* By default, captcha token is setted, and becames empty if user/bot fills the field. */
const HoneypotCaptchaWidget = ({
  id,
  value,
  onChange,
  onEdit,
  captcha_props,
}) => {
  const title = '';
  const createToken = (id, value) => {
    const token = {
      id: id,
      value: value,
    };
    return JSON.stringify(token);
  };

  useEffect(() => {
    onChange('captchaToken', createToken(id, new Date().toString()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return onEdit ? (
    <></>
  ) : (
    <div className="honey-wrapper2" key={'honeypot-captcha'}>
      <TextWidget
        id={captcha_props.id}
        name={captcha_props.id}
        label={title}
        title={title}
        onChange={onChange}
        value={value}
      />
    </div>
  );
};

export default HoneypotCaptchaWidget;
