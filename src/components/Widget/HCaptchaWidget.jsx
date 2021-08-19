import React from 'react';
import { Grid } from 'semantic-ui-react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';

const HCaptchaWidget = ({ sitekey, onVerify, size, HCaptcha }) => {
  const HCaptchaComponent = HCaptcha.default;
  return (
    <Grid.Row centered className="row-padded-top">
      <Grid.Column textAlign="center">
        <HCaptchaComponent sitekey={sitekey} onVerify={onVerify} size={size} />
      </Grid.Column>
    </Grid.Row>
  );
};

export default injectLazyLibs(['HCaptcha'])(HCaptchaWidget);
