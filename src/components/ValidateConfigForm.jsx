import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import config from '@plone/volto/registry';

const messages = defineMessages({
  fill_required_config_fields: {
    id: 'form_edit_fill_required_configuration_fields',
    defaultMessage:
      'Please, fill-in required configuration fields in sidebar. The form will be not displayed in view mode until required fields are filled-in.',
  },
});

const ValidateConfigForm = ({ data = {}, children, onEdit }) => {
  const intl = useIntl();
  var Schema = config.blocks.blocksConfig.form.formSchema;
  var blockSchema = Schema(data);
  const required_fields = blockSchema.required;
  const valid =
    required_fields.filter(
      (r) =>
        data[r] === null ||
        data[r] === undefined ||
        data[r] === '' ||
        (blockSchema.properties[r].type === 'boolean' && !data[r]),
    ).length === 0;

  return (
    <>
      {!valid && onEdit && (
        <div
          style={{
            padding: '1rem',
            textAlign: 'center',
            backgroundColor: '#fff0f0',
            border: '1px solid #c40e00',
            borderRadius: '3px',
          }}
        >
          {intl.formatMessage(messages.fill_required_config_fields)}
        </div>
      )}
      {(valid || onEdit) && <>{children}</>}
    </>
  );
};

export default ValidateConfigForm;
