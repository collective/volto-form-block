import React, { createRef } from 'react';
import GoogleReCaptchaWidget from './GoogleReCaptchaWidget';
import HCaptchaWidget from './HCaptchaWidget';


class Captcha extends React.Component {
  constructor(props) {
    // TODO: https://reactjs.org/docs/legacy-context.html
    super(props);
    this.captchaRef = createRef();
  }

  reset() {
    const { captcha } = this.props;
    const captchaRef = this.captchaRef;
    if (captcha === 'recaptcha') {
      // TODO?
    } else if (captcha === 'hcaptcha') {
      captchaRef.current.resetCaptcha();
    } else if (captcha === 'hcaptcha_invisible') {
      captchaRef.current.resetCaptcha();
    } else {
    }
  }

  execute() {
    const { captcha } = this.props;
    const captchaRef = this.captchaRef;
    if (captcha === 'recaptcha') {
      // TODO
    } else if (captcha === 'hcaptcha') {
      captchaRef.current.execute();
    } else if (captcha === 'hcaptcha_invisible') {
      captchaRef.current.execute();
    } else {
    }
  }

  render() {
    const { captchaToken, captcha, captcha_props } = this.props;
    const captchaRef = this.captchaRef;
    if (captcha === 'recaptcha') {
      return (
        <GoogleReCaptchaWidget
          captchaToken={captchaToken}
          sitekey={captcha_props?.public_key}
          ref={captchaRef}
        ></GoogleReCaptchaWidget>
      );
    } else if (captcha === 'hcaptcha') {
      return (
        <HCaptchaWidget
          captchaToken={captchaToken}
          sitekey={captcha_props?.public_key}
          size="normal"
          captchaRef={captchaRef}
        ></HCaptchaWidget>
      );
    } else if (captcha === 'hcaptcha_invisible') {
      return (
        <HCaptchaWidget
          captchaToken={captchaToken}
          sitekey={captcha_props?.public_key}
          size="invisible"
          captchaRef={captchaRef}
        ></HCaptchaWidget>
      );
    } else {
      return null;
    }
  }
}

export default Captcha;
