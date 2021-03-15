import React from 'react';
import PropTypes from 'prop-types';
import { useIntl, defineMessages } from 'react-intl';
import TextWidget from '@plone/volto/components/manage/Widgets/TextWidget';
import TextareaWidget from '@plone/volto/components/manage/Widgets/TextareaWidget';
import SelectWidget from '@plone/volto/components/manage/Widgets/SelectWidget';
import EmailWidget from '@plone/volto/components/manage/Widgets/EmailWidget';
import CheckboxWidget from '@plone/volto/components/manage/Widgets/CheckboxWidget';
import FileWidget from '@plone/volto/components/manage/Widgets/FileWidget';
import { DatetimeWidget } from '@plone/volto/components';

import RadioWidget from 'volto-form-block/components/Widget/RadioWidget';

import './Field.css';

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
          getVocabulary={() => {}}
          getVocabularyTokenTitle={() => {}}
          choices={[...(input_values?.map((v) => [v, v]) ?? [])]}
          value={value}
          onChange={onChange}
          placeholder={intl.formatMessage(messages.select_a_value)}
          aria-label={intl.formatMessage(messages.select_a_value)}
          classNamePrefix="react-select"
          invalid={isInvalid().toString()}
          {...(isInvalid() ? { className: 'is-invalid' } : {})}
        />
      )}
      {field_type === 'radio' && (
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
          invalid={isInvalid().toString()}
          value={value}
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
          onChange={onChange}
          value={value}
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
          invalid={isInvalid().toString()}
          {...(isInvalid() ? { className: 'is-invalid' } : {})}
        />
      )}
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
  onChange: PropTypes.func,
};

export default Field;
