import React from 'react';
import PropTypes from 'prop-types';
import { useIntl, defineMessages } from 'react-intl';
import TextWidget from '@plone/volto/components/manage/Widgets/TextWidget';
import TextareaWidget from '@plone/volto/components/manage/Widgets/TextareaWidget';
import SelectWidget from '@plone/volto/components/manage/Widgets/SelectWidget';
import EmailWidget from '@plone/volto/components/manage/Widgets/EmailWidget';
import FileWidget from '@plone/volto/components/manage/Widgets/FileWidget';
import CheckboxWidget from '@plone/volto/components/manage/Widgets/CheckboxWidget';
import { DatetimeWidget } from '@plone/volto/components';

import CheckboxListWidget from './Widget/CheckboxListWidget';
import RadioWidget from './Widget/RadioWidget';

import './Field.css';

import config from '@plone/volto/registry';

const messages = defineMessages({
  select_a_value: {
    id: 'form_select_a_value',
    defaultMessage: 'Seleziona un valore',
  },
});

/**
 * Field class.
 * @class View
 * @extends Component
 */
const Field = ({
  label,
  description,
  name,
  field_type,
  required,
  input_values,
  value,
  onChange,
  isOnEdit,
  valid,
  disabled = false,
  formHasErrors = false,
}) => {
  const intl = useIntl();

  const isInvalid = () => {
    return !isOnEdit && !valid;
  };

  return (
    <div className="field">
      {field_type === 'text' && (
        <TextWidget
          id={name}
          name={name}
          title={label}
          description={description}
          required={required}
          onChange={onChange}
          value={value}
          isDisabled={disabled}
          invalid={isInvalid().toString()}
          {...(isInvalid() ? { className: 'is-invalid' } : {})}
        />
      )}
      {field_type === 'textarea' && (
        <TextareaWidget
          id={name}
          name={name}
          title={label}
          description={description}
          required={required}
          onChange={onChange}
          value={value}
          rows={10}
          isDisabled={disabled}
          invalid={isInvalid().toString()}
          {...(isInvalid() ? { className: 'is-invalid' } : {})}
        />
      )}
      {field_type === 'select' && (
        <SelectWidget
          id={name}
          name={name}
          title={label}
          description={description}
          getVocabulary={() => { }}
          getVocabularyTokenTitle={() => { }}
          choices={[...(input_values?.map((v) => [v, v]) ?? [])]}
          value={value}
          onChange={onChange}
          placeholder={intl.formatMessage(messages.select_a_value)}
          aria-label={intl.formatMessage(messages.select_a_value)}
          classNamePrefix="react-select"
          isDisabled={disabled}
          invalid={isInvalid().toString()}
          {...(isInvalid() ? { className: 'is-invalid' } : {})}
        />
      )}
      {field_type === 'single_choice' && (
        <RadioWidget
          id={name}
          title={label}
          description={description}
          required={required}
          onChange={onChange}
          valueList={[
            ...(input_values?.map((v) => ({ value: v, label: v })) ?? []),
          ]}
          value={value}
          isDisabled={disabled}
          invalid={isInvalid().toString()}
          {...(isInvalid() ? { className: 'is-invalid' } : {})}
        />
      )}
      {field_type === 'multiple_choice' && (
        <CheckboxListWidget
          id={name}
          name={name}
          title={label}
          description={description}
          required={required}
          onChange={onChange}
          valueList={[
            ...(input_values?.map((v) => ({ value: v, label: v })) ?? []),
          ]}
          value={value}
          isDisabled={disabled}
          invalid={isInvalid().toString()}
          {...(isInvalid() ? { className: 'is-invalid' } : {})}
        />
      )}
      {field_type === 'checkbox' && (
        <CheckboxWidget
          id={name}
          name={name}
          title={label}
          description={description}
          required={required}
          onChange={onChange}
          value={!!value}
          isDisabled={disabled}
          invalid={isInvalid().toString()}
          {...(isInvalid() ? { className: 'is-invalid' } : {})}
        />
      )}
      {field_type === 'date' && (
        <DatetimeWidget
          id={name}
          name={name}
          title={label}
          description={description}
          dateOnly={true}
          noPastDates={false}
          resettable={false}
          onChange={onChange}
          value={value}
          isDisabled={disabled}
          invalid={isInvalid().toString()}
          {...(isInvalid() ? { className: 'is-invalid' } : {})}
        />
      )}
      {field_type === 'attachment' && (
        <FileWidget
          id={name}
          name={name}
          title={label}
          description={description}
          type="file"
          required={required}
          invalid={isInvalid().toString()}
          isDisabled={disabled}
          onChange={onChange}
          value={value}
          multiple={false}
        />
      )}
      {(field_type === 'from' || field_type === 'email') && (
        <EmailWidget
          id={name}
          name={name}
          title={label}
          description={description}
          required={required}
          onChange={onChange}
          value={value}
          isDisabled={disabled}
          invalid={isInvalid().toString()}
          {...(isInvalid() ? { className: 'is-invalid' } : {})}
        />
      )}
      {config.blocks.blocksConfig.form.additionalFields?.reduce((acc, val) => {
        if (val.id === field_type)
          return [
            ...acc,
            <val.component
              id={name}
              name={name}
              title={label}
              description={description}
              required={required}
              onChange={onChange}
              value={value}
              isDisabled={disabled}
              formHasErrors={formHasErrors}
              invalid={isInvalid().toString()}
              {...(isInvalid() ? { className: 'is-invalid' } : {})}
            />,
          ];

        return acc;
      }, []) ?? []}
    </div>
  );
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
Field.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  description: PropTypes.string,
  required: PropTypes.bool,
  field_type: PropTypes.string,
  input_values: PropTypes.any,
  value: PropTypes.any,
  formHasErrors: PropTypes.bool,
  onChange: PropTypes.func,
};

export default Field;
