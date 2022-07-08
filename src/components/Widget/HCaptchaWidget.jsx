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
    console.log('onverify ', token);
    captchaToken.current = token;
  };

  const onSubmit = (token) => {
    console.log('onsubmit ', token);
    // captchaToken.current = token;
  };

  // React.useEffect(() => {
  //   console.log('hcaptcha execute');
  //   captchaRef.current.execute();
  // }, [captchaRef]);

  const onExpire = () => {
    captchaToken.current = null;
  };

  const onLoad = () => {
    // this reaches out to the hCaptcha JS API and runs the
    // execute function on it. you can use other functions as
    // documented here:
    // https://docs.hcaptcha.com/configuration#jsapi
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
            onSubmit={onSubmit}
            size={size}
          />
        </Grid.Column>
      </Grid.Row>
    );
};

export default injectLazyLibs(['HCaptcha'])(HCaptchaWidget);
