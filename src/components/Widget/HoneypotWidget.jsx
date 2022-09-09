/**
 * HoneypotWidget component.
 * @module components/manage/Widgets/HoneypotWidget
 */

import React from 'react';
import PropTypes from 'prop-types';

import TextWidget from '@plone/volto/components/manage/Widgets/TextWidget';
import './HoneypotWidget.css';

/**
 * HoneypotWidget component class.
 * @function HoneypotWidget
 * @returns {string} Markup of the component.
 */
const HoneypotWidget = ({
  id,
  title,
  required,
  description,
  error,
  value = [],
  valueList,
  onChange,
}) => {
  return (
    <div className="honey-wrapper">
      <TextWidget
        id={id}
        name={id}
        title={title}
        description={description}
        onChange={onChange}
        value={value}
      />
    </div>
  );
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
HoneypotWidget.propTypes = {
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
HoneypotWidget.defaultProps = {
  description: null,
  required: false,
  error: [],
  value: [],
  onChange: null,
  onEdit: null,
  onDelete: null,
};

export default HoneypotWidget;
