import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import config from '@plone/volto/registry';

const messages = defineMessages({
  fill_required_config_fields: {
    id: 'form_edit_fill_required_configuration_fields',
    defaultMessage:
      'Please, fill-in required configuration fields in sidebar. The form will be not displayed in view mode until required fields are filled-in.',
  },
  other_errors: {
    id: 'form_edit_other_errors',
    defaultMessage:
      'Please, verify this configuration errors in sidebar. The form will be not displayed in view mode until this errors fields are not fixed.',
  },
});

const ValidateConfig = (data, blockSchema, intl) => {
  var SchemaValidators = config.blocks.blocksConfig.form.schemaValidators;

  const required_fields = blockSchema.required;
  const noRequired =
    required_fields.filter(
      (r) =>
        data[r] === null ||
        data[r] === undefined ||
        data[r] === '' ||
        (blockSchema.properties[r].type === 'boolean' && !data[r]),
    ).length === 0;

  let schema_validation = [];
  if (SchemaValidators) {
    Object.keys(SchemaValidators).forEach((fieldName) => {
      const validateFieldFN = SchemaValidators[fieldName];
      const validation = validateFieldFN(data, intl);

      if (validation) {
        schema_validation.push({ field: fieldName, message: validation });
      }
    });
  }

  let noInvalidFields = schema_validation.length === 0;

  const valid = noRequired && noInvalidFields;

  return { valid: valid, required_fields, schema_validation };
};

const ValidateConfigForm = ({ data = {}, children, onEdit, onChangeBlock }) => {
  const intl = useIntl();
  var Schema = config.blocks.blocksConfig.form.formSchema;
  var blockSchema = Schema(data);

  useEffect(() => {
    if (onEdit) {
      const validation = ValidateConfig(data, blockSchema, intl);
      if (
        JSON.stringify(validation) !== JSON.stringify(data.configValidation)
      ) {
        onChangeBlock({ ...data, configValidation: validation });
      }
    }
  }, [data]);

  const valid = data.configValidation?.valid || !data.configValidation; //!data.configValidation is for old configured form that doesn't have configValidation field

  return (
    <>
      {!valid && onEdit && (
        <div
          style={{
            padding: '1rem',

            backgroundColor: '#fff0f0',
            border: '1px solid #c40e00',
            borderRadius: '3px',
          }}
        >
          {data.configValidation.required_fields?.length > 0 && (
            <>{intl.formatMessage(messages.fill_required_config_fields)}</>
          )}
          {data.configValidation.schema_validation?.length > 0 && (
            <div>
              {intl.formatMessage(messages.other_errors)}
              <ul>
                {data.configValidation.schema_validation.map((v) => (
                  <li>{v.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {(valid || onEdit) && <>{children}</>}
    </>
  );
};

export default ValidateConfigForm;
