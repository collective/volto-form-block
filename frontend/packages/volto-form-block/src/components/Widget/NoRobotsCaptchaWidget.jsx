import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Grid } from 'semantic-ui-react';
import TextWidget from '@plone/volto/components/manage/Widgets/TextWidget';

const messages = defineMessages({
  resolveCaptcha: {
    id: 'resolveCaptcha',
    defaultMessage: 'Answer the question to prove that you are human',
  },
});

const NoRobotsCaptchaWidget = ({ id, id_check, title, captchaToken }) => {
  const createToken = (id, id_check, value) => {
    const token = {
      id: id,
      id_check: id_check,
      value: value,
    };
    return JSON.stringify(token);
  };
  const intl = useIntl();
  const [value, setValue] = useState();

  return (
    <Grid.Row key={'row-captcha'}>
      <Grid.Column>
        <TextWidget
          id="captcha"
          name="captcha"
          label={title}
          title={title}
          description={intl.formatMessage(messages.resolveCaptcha)}
          onChange={(field, value) => {
            captchaToken.current = createToken(id, id_check, value);
            setValue(value);
          }}
          required={true}
          value={value}
        />
      </Grid.Column>
    </Grid.Row>
  );
};

export default NoRobotsCaptchaWidget;
