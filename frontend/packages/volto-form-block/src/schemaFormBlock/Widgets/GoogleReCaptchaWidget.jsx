import React, { useEffect, useCallback, useRef } from 'react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import { useIntl } from 'react-intl';

const GoogleReCaptchaWidget = (props) => {
  const { captcha_props, GoogleReCaptcha: recaptchalib } = props;

  const { GoogleReCaptchaProvider, useGoogleReCaptcha } = recaptchalib;
  const intl = useIntl();
  const captchaRef = useRef();
  const ReCaptchaComponent = () => {
    const { executeRecaptcha } = useGoogleReCaptcha();
    const handleReCaptchaVerify = useCallback(async () => {
      if (!executeRecaptcha) {
        return;
      }
      const token = await executeRecaptcha();
      captchaToken.current = token;
    }, [executeRecaptcha]);

    useEffect(() => {
      captchaRef.current = { verify: handleReCaptchaVerify };
    }, []);
    return null;
  };

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={captcha_props.public_key}
      language={intl.locale ?? 'en'}
    >
      <ReCaptchaComponent />
    </GoogleReCaptchaProvider>
  );
};

export default injectLazyLibs(['GoogleReCaptcha'])(GoogleReCaptchaWidget);
