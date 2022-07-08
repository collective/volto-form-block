import React, { useEffect, useCallback } from 'react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import { useSelector } from 'react-redux';

const GoogleReCaptchaWidget = ({
  action,
  sitekey,
  captchaToken,
  GoogleReCaptcha: recaptchalib,
}) => {
  const { GoogleReCaptchaProvider, useGoogleReCaptcha } = recaptchalib;
  const intl = useSelector((state) => state.intl);

  const ReCaptchaComponent = ({ action }) => {
    const { executeRecaptcha } = useGoogleReCaptcha();
    const handleReCaptchaVerify = useCallback(async () => {
      if (!executeRecaptcha) {
        return;
      }
      const token = await executeRecaptcha(action);
      captchaToken.current = token;
    }, [executeRecaptcha, action]);

    useEffect(() => {
      handleReCaptchaVerify();
    }, [handleReCaptchaVerify, action]);
    return null;
  };

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={sitekey}
      language={intl.locale ?? 'en'}
    >
      {action}
      <ReCaptchaComponent action={action} />
    </GoogleReCaptchaProvider>
  );
};

export default injectLazyLibs(['GoogleReCaptcha'])(GoogleReCaptchaWidget);
