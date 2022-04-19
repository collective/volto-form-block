import React from 'react';
import { useIntl } from 'react-intl';
import { Grid } from 'semantic-ui-react';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';

const GoogleReCaptchaWidget = ({ sitekey, onVerify, GoogleReCaptcha }) => {
  const intl = useIntl();
  const {
    GoogleReCaptcha: ReCaptcha,
    GoogleReCaptchaProvider,
  } = GoogleReCaptcha;

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={sitekey}
      language={intl.locale ?? 'en'}
    >
      <Grid.Row centered className="row-padded-top">
        <Grid.Column textAlign="center">
          <ReCaptcha onVerify={onVerify} />
        </Grid.Column>
      </Grid.Row>
    </GoogleReCaptchaProvider>
  );
};

export default injectLazyLibs(['GoogleReCaptcha'])(GoogleReCaptchaWidget);
