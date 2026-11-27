import React, { useEffect, useCallback } from 'react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import { useIntl } from 'react-intl';

const GoogleReCaptchaWidget = ({
  captchaRef,
  captchaToken,
  sitekey,
  GoogleReCaptcha: recaptchalib,
}) => {
  const { GoogleReCaptchaProvider, useGoogleReCaptcha } = recaptchalib;
  const intl = useIntl();
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
      // handleReCaptchaVerify();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
  };

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={sitekey}
      language={intl.locale ?? 'en'}
    >
      <ReCaptchaComponent />
    </GoogleReCaptchaProvider>
  );
};

export default injectLazyLibs(['GoogleReCaptcha'])(GoogleReCaptchaWidget);
