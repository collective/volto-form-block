import React, { useCallback, useEffect } from 'react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import { useIntl } from 'react-intl';

const ReCaptchaComponent = (props) => {
  const { GoogleReCaptcha: recaptchalib, id, onChange } = props;
  const { useGoogleReCaptcha } = recaptchalib;
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleReCaptchaVerify = useCallback(async () => {
    if (!executeRecaptcha) {
      return;
    }
    return await executeRecaptcha();
  }, [executeRecaptcha]);

  useEffect(() => {
    handleReCaptchaVerify();
    onChange(id, handleReCaptchaVerify);
  }, [handleReCaptchaVerify, id, onChange]);

  return null;
};

const GoogleReCaptchaWidget = (props) => {
  const intl = useIntl();

  const { captcha_props, GoogleReCaptcha: recaptchalib } = props;
  const { GoogleReCaptchaProvider } = recaptchalib;

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={captcha_props.public_key}
      language={intl.locale ?? 'en'}
    >
      <ReCaptchaComponent {...props} />
    </GoogleReCaptchaProvider>
  );
};

export default injectLazyLibs(['GoogleReCaptcha'])(GoogleReCaptchaWidget);
