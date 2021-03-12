import React from 'react';
import { FormFieldWrapper } from '@plone/volto/components';
import './RadioWidget.css';

const RadioWidget = ({
  id,
  title,
  required,
  description,
  error,
  value,
  valueList,
  onChange,
  onEdit,
  onDelete,
  intl,
  fieldSet,
  wrapped,
}) => {
  return (
    <FormFieldWrapper
      id={id}
      title={title}
      description={description}
      required={required || null}
      error={error}
      fieldSet={fieldSet}
      wrapped={wrapped}
    >
      <div className="radio-widget">
        {valueList.map((opt) => (
          <div className="radio-button" key={opt.value}>
            <input
              type="radio"
              name={id}
              id={id + opt.value}
              value={opt.value}
              checked={opt.value === value}
              onChange={(e) => onChange(id, e.target.value)}
            />
            <label htmlFor={id + opt.value}>{opt.label}</label>
          </div>
        ))}
      </div>
    </FormFieldWrapper>
  );
};

export default RadioWidget;

