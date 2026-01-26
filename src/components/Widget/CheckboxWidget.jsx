/**
 * CheckboxWidget component.
 * @module components/manage/Widgets/CheckboxWidget
 * added aria- attributes
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from 'semantic-ui-react';

import { injectIntl } from 'react-intl';
import FormFieldWrapper from '@plone/volto/components/manage/Widgets/FormFieldWrapper';

/**
 * CheckboxWidget component class.
 * @function CheckboxWidget
 * @returns {string} Markup of the component.
 *
 * To use it, in schema properties, declare a field like:
 *
 * ```jsx
 * {
 *  title: "Active",
 *  type: 'boolean',
 * }
 * ```
 */
const CheckboxWidget = (props) => {
  const { id, title, value, onChange, isDisabled, required, invalid } = props;
  const randomSuffixId = Math.random().toString(36).substr(2, 5)

  let attributes = {};
  if (required) {
    attributes.required = true;
    attributes['aria-required'] = 'true';
  }

  const isInvalid = invalid === true || invalid === 'true';
  if (isInvalid) {
    attributes['aria-invalid'] = true;
  }

  return (
    <FormFieldWrapper {...props} columns={1}>
      <div className="wrapper">
        <Checkbox
          id={`field-${id}-${randomSuffixId}`}
          name={`field-${id}-${randomSuffixId}`}
          checked={value || false}
          disabled={isDisabled}
          onChange={(event, { checked }) => {
            onChange(id, checked);
          }}
          aria-required={required ? 'true' : 'false'}
          label={<label htmlFor={`field-${id}-${randomSuffixId}`}>{title}</label>}
          {...attributes}
        />
      </div>
    </FormFieldWrapper>
  );
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
CheckboxWidget.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.bool,
  onChange: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  wrapped: PropTypes.bool,
};

/**
 * Default properties.
 * @property {Object} defaultProps Default properties.
 * @static
 */
CheckboxWidget.defaultProps = {
  description: null,
  required: false,
  error: [],
  value: null,
  onChange: null,
  onEdit: null,
  onDelete: null,
};

export default injectIntl(CheckboxWidget);
