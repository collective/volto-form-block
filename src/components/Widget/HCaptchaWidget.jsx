import React from 'react';
import { Grid } from 'semantic-ui-react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';

const HCaptchaWidget = ({
  captchaRef,
  captchaToken,
  sitekey,
  size,
  HCaptcha: hcaptchalib,
}) => {
  const HCaptchaComponent = hcaptchalib.default;

  const onVerify = (token) => {
    captchaToken.current = token;
  };

  const onExpire = () => {
    captchaToken.current = null;
  };

  const onLoad = () => {
    captchaRef.current.execute();
  };

  // TODO: language
  if (size === 'invisible')
    return (
      <Grid.Row centered className="row-padded-top">
        <Grid.Column textAlign="center">
          <HCaptchaComponent
            ref={captchaRef}
            sitekey={sitekey}
            onLoad={onLoad}
            onVerify={onVerify}
            onExpire={onExpire}
            size={size}
          />
          This site is protected by hCaptcha and its
          <a href="https://www.hcaptcha.com/privacy">Privacy Policy</a> and
          <a href="https://www.hcaptcha.com/terms">Terms of Service</a> apply.
        </Grid.Column>
      </Grid.Row>
    );
  else
    return (
      <Grid.Row centered className="row-padded-top">
        <Grid.Column textAlign="center">
          <HCaptchaComponent
            ref={captchaRef}
            sitekey={sitekey}
            onLoad={onLoad}
            onVerify={onVerify}
            size={size}
          />
        </Grid.Column>
      </Grid.Row>
    );
};

export default injectLazyLibs(['HCaptcha'])(HCaptchaWidget);
