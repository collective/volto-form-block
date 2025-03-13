import React, { useState } from 'react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import { useIntl } from 'react-intl';

const GoogleReCaptchaWidget = (props) => {
  const { captcha_props, GoogleReCaptcha: recaptchalib, id, onChange } = props;

  const { GoogleReCaptchaProvider, GoogleReCaptcha } = recaptchalib;
  const intl = useIntl();
  const [submitted, setSubmitted] = useState(false);

  return (
    !submitted && (
      <GoogleReCaptchaProvider
        reCaptchaKey={captcha_props.public_key}
        language={intl.locale ?? 'en'}
      >
        <GoogleReCaptcha
          onVerify={(token) => {
            setSubmitted(true);
            onChange(id, token);
          }}
        />
      </GoogleReCaptchaProvider>
    )
  );
};

export default injectLazyLibs(['GoogleReCaptcha'])(GoogleReCaptchaWidget);
