/**
 * CheckboxWidget component.
 * @module components/manage/Widgets/CheckboxWidget
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from 'semantic-ui-react';
import FormFieldWrapper from '@plone/volto/components/manage/Widgets/FormFieldWrapper';

/* Style */
import 'volto-form-block/components/Widget/CheckboxListWidget.css';

/**
 * CheckboxListWidget component class.
 * @function CheckboxWidget
 * @returns {string} Markup of the component.
 */
const CheckboxListWidget = ({
  id,
  title,
  required,
  description,
  error,
  value = [],
  valueList,
  onChange,
  fieldSet,
  isDisabled,
  wrapped,
  invalid,
}) => {
  const updateValueList = (val, checked) => {
    let newValue = new Set([...(value || [])]);
    if (checked) newValue.add(val);
    else newValue.delete(val);

    onChange(id, [...newValue]);
  };

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
      <div className="checkbox-list-widget">
        <fieldset className="checkbox-group">
          <legend aria-hidden="false">{title}</legend>
          {valueList?.map((opt) => (
            <div className="checkbox-item" key={opt.value}>
              <Checkbox
                id={`field-${id}-${opt.value}`}
                name={`field-${id}-${opt.value}`}
                checked={value?.includes(opt.value)}
                disabled={isDisabled}
                onChange={(_event, { checked }) =>
                  updateValueList(opt.value, checked)
                }
                label={
                  <label htmlFor={`field-${id}-${opt.value}`}>
                    {opt.label}
                  </label>
                }
                {...attributes}
              />
            </div>
          ))}
        </fieldset>
      </div>
    </FormFieldWrapper>
  );
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
CheckboxListWidget.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.arrayOf(PropTypes.string),
  wrapped: PropTypes.bool,
};

/**
 * Default properties.
 * @property {Object} defaultProps Default properties.
 * @static
 */
CheckboxListWidget.defaultProps = {
  description: null,
  required: false,
  error: [],
  value: [],
  onChange: null,
  onEdit: null,
  onDelete: null,
};

export default CheckboxListWidget;
