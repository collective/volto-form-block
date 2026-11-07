import React from 'react';
import FormFieldWrapper from '@plone/volto/components/manage/Widgets/FormFieldWrapper';

/* Style */
import 'volto-form-block/components/Widget/RadioWidget.css';

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
  invalid,
}) => {
  let attributes = {};
  if (required) {
    attributes.required = true;
    attributes['aria-required'] = true;
  }

  const isInvalid = invalid === true || invalid === 'true';
  if (isInvalid) {
    attributes['aria-invalid'] = true;
  }

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
        <fieldset className="radio-group">
          <legend aria-hidden="false">{title}</legend>
          {valueList.map((opt) => (
            <div className="radio-button" key={opt.value}>
              <input
                type="radio"
                name={id}
                id={id + opt.value}
                value={opt.value}
                checked={opt.value === value}
                onChange={(e) => onChange(id, e.target.value)}
                {...attributes}
              />
              <label htmlFor={id + opt.value}>{opt.label}</label>
            </div>
          ))}
        </fieldset>
      </div>
    </FormFieldWrapper>
  );
};

export default RadioWidget;
