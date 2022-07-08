import React from 'react';
import { Grid } from 'semantic-ui-react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';

const HCaptchaWidget = ({
  captchaRef,
  captchaToken,
  sitekey,
  size,
  HCaptcha,
}) => {
  const HCaptchaComponent = HCaptcha.default;
  // const captchaRef = React.useRef();

  const onVerify = (token) => {
    // console.log('hcaptcha onverify');
    captchaToken.current = token;
  };

  // React.useEffect(() => {
  //   console.log('hcaptcha execute');
  //   captchaRef.current.execute();
  // }, [captchaRef]);

  const onLoad = () => {
    // this reaches out to the hCaptcha JS API and runs the
    // execute function on it. you can use other functions as
    // documented here:
    // https://docs.hcaptcha.com/configuration#jsapi
    captchaRef.current.execute();
  };

  return (
    <Grid.Row centered className="row-padded-top">
      <Grid.Column textAlign="center">
        <HCaptchaComponent
          ref={captchaRef}
          sitekey={sitekey}
          onLoad={onLoad}
          onVerify={onVerify}
          // size={size}
        />
      </Grid.Column>
    </Grid.Row>
  );
};

export default injectLazyLibs(['HCaptcha'])(HCaptchaWidget);
