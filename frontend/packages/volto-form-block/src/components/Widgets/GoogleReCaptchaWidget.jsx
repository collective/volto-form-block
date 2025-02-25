import React, { useEffect, useCallback, useRef } from 'react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import { useIntl } from 'react-intl';

const GoogleReCaptchaWidget = (props) => {
  const { captcha_props, GoogleReCaptcha: recaptchalib, id, onChange } = props;

  const { GoogleReCaptchaProvider, GoogleReCaptcha } = recaptchalib;
  const intl = useIntl();

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={captcha_props.public_key}
      language={intl.locale ?? 'en'}
    >
      <GoogleReCaptcha onVerify={(token) => onChange(id, token)} />
    </GoogleReCaptchaProvider>
  );
};

export default injectLazyLibs(['GoogleReCaptcha'])(GoogleReCaptchaWidget);
