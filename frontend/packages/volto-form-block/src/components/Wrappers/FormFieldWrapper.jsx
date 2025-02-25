/**
 * FormFieldWrapper component.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form, Icon as IconOld } from 'semantic-ui-react';
import cx from 'classnames';
import { defineMessages, injectIntl } from 'react-intl';

const messages = defineMessages({
  edit: {
    id: 'Edit',
    defaultMessage: 'Edit',
  },
  delete: {
    id: 'Delete',
    defaultMessage: 'Delete',
  },
});

/**
 * FormFieldWrapper component class.
 * @class FormFieldWrapper
 * @extends Component
 */
class FormFieldWrapper extends Component {
  /**
   * Property types.
   * @property {Object} propTypes Property types.
   * @static
   */
  static propTypes = {
    id: PropTypes.string.isRequired,
    isDisabled: PropTypes.bool,
    onEdit: PropTypes.func,
    className: PropTypes.string,
    onDelete: PropTypes.func,
    intl: PropTypes.object,
  };

  /**
   * Default properties
   * @property {Object} defaultProps Default properties.
   * @static
   */
  static defaultProps = {
    onDelete: null,
    intl: null,
    isDisabled: null,
    draggable: null,
  };

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    const {
      id,
      onEdit,
      className,
      isDisabled,
      onDelete,
      intl,
      multilingual_options,
    } = this.props;

    return (
      <Form.Field
        className={cx(
          className,
          `field-wrapper-${id}`,
          multilingual_options?.language_independent
            ? 'language-independent-field'
            : null,
        )}
      >
        {onEdit && !isDisabled && (
          <div className="toolbar" style={{ zIndex: '2' }}>
            <button
              aria-label={intl.formatMessage(messages.edit)}
              className="item ui noborder button"
              onClick={(evt) => {
                evt.preventDefault();
                onEdit(id);
              }}
            >
              <IconOld name="write square" size="large" color="blue" />
            </button>
            <button
              aria-label={intl.formatMessage(messages.delete)}
              className="item ui noborder button"
              onClick={(evt) => {
                evt.preventDefault();
                onDelete(id);
              }}
            >
              <IconOld name="close" size="large" color="red" />
            </button>
          </div>
        )}
        {this.props.children}
      </Form.Field>
    );
  }
}

export default injectIntl(FormFieldWrapper);
