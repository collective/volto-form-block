import React, { useCallback, useEffect, useRef } from 'react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import { useIntl } from 'react-intl';

const ReCaptchaComponent = (props) => {
  const { GoogleReCaptcha: recaptchalib, id, onChange } = props;
  const { useGoogleReCaptcha } = recaptchalib || {};

  const executeRecaptchaRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const idRef = useRef(id);
  // Keep track if the initial verification has been attempted/done
  const initialVerificationDoneRef = useRef(false);

  const { executeRecaptcha } = useGoogleReCaptcha ? useGoogleReCaptcha() : {};

  // Memoize the verification function
  const handleReCaptchaVerify = useCallback(async () => {
    const currentExecuteRecaptcha = executeRecaptchaRef.current;
    if (!currentExecuteRecaptcha) {
      console.warn(
        'Attempted to verify reCAPTCHA, but executeRecaptcha is not available.',
      );
      return;
    }
    try {
      const token = await currentExecuteRecaptcha();
      if (token && onChangeRef.current && idRef.current) {
        onChangeRef.current(idRef.current, token);
      } else if (!token) {
        console.warn('executeRecaptcha ran but returned no token.');
      }
    } catch (error) {
      console.error('Error executing reCAPTCHA:', error);
    }
  }, []);

  // Update refs for props
  useEffect(() => {
    onChangeRef.current = onChange;
    idRef.current = id;
  }, [onChange, id]);

  useEffect(() => {
    executeRecaptchaRef.current = executeRecaptcha;

    if (executeRecaptcha && !initialVerificationDoneRef.current) {
      initialVerificationDoneRef.current = true;
      handleReCaptchaVerify();
    }
  }, [executeRecaptcha, handleReCaptchaVerify]);

  useEffect(() => {
    const handleError = (event) => {
      console.log(
        'formBlockSubmitError event received, triggering reCAPTCHA verification.',
      );
      handleReCaptchaVerify();
    };

    document.addEventListener('formBlockSubmitError', handleError);
    return () => {
      document.removeEventListener('formBlockSubmitError', handleError);
    };
  }, [handleReCaptchaVerify]);

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
