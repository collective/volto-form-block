import React from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { Grid } from 'semantic-ui-react';
import Field from '../Field';

const messages = defineMessages({
  resolveCaptcha: {
    id: 'resolveCaptcha',
    defaultMessage: 'Answer the question to prove that you are human',
  },
});

const NoRobotsCaptchaWidget = ({
  id,
  id_check,
  title,
  onChange,
  onVerify,
  value,
}) => {
  const createToken = (id, id_check, value) => {
    const token = {
      id: id,
      id_check: id_check,
      value: value,
    };
    return JSON.stringify(token);
  };
  const intl = useIntl();

  return (
    <Grid.Row key={'row-captcha'}>
      <Grid.Column>
        <Field
          id="captcha"
          name="captcha"
          label={title}
          title={title}
          description={intl.formatMessage(messages.resolveCaptcha)}
          onChange={(field, value) => {
            onVerify(createToken(id, id_check, value));
            onChange(field, value);
          }}
          field_type="text"
          required={true}
          value={value}
        />
      </Grid.Column>
    </Grid.Row>
  );
};

export default NoRobotsCaptchaWidget;
