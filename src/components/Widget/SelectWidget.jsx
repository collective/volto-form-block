/**
 * SelectWidget component.
 * @module components/manage/Widgets/SelectWidget
 * added aria- attributes
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { map } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import {
  getVocabFromHint,
  getVocabFromField,
  getVocabFromItems,
} from '@plone/volto/helpers/Vocabularies/Vocabularies';
import FormFieldWrapper from '@plone/volto/components/manage/Widgets/FormFieldWrapper';
import { getVocabulary, getVocabularyTokenTitle } from '@plone/volto/actions';
import { normalizeValue } from '@plone/volto/components/manage/Widgets/SelectUtils';

import {
  customSelectStyles,
  DropdownIndicator,
  ClearIndicator,
  Option,
  selectTheme,
  MenuList,
} from '@plone/volto/components/manage/Widgets/SelectStyling';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import {
  getReactSelectAriaLiveMessages,
  getReactSelectScreenReaderStatus,
} from 'volto-form-block/helpers/react-select';

const messages = defineMessages({
  default: {
    id: 'Default',
    defaultMessage: 'Default',
  },
  idDescription: {
    id: 'Used for programmatic access to the fieldset.',
    defaultMessage: 'Used for programmatic access to the fieldset.',
  },
  title: {
    id: 'Title',
    defaultMessage: 'Title',
  },
  description: {
    id: 'Description',
    defaultMessage: 'Description',
  },
  close: {
    id: 'Close',
    defaultMessage: 'Close',
  },
  choices: {
    id: 'Choices',
    defaultMessage: 'Choices',
  },
  required: {
    id: 'Required',
    defaultMessage: 'Required',
  },
  select: {
    id: 'Select…',
    defaultMessage: 'Select…',
  },
  no_value: {
    id: 'No value',
    defaultMessage: 'No value',
  },
});

/**
 * SelectWidget component class.
 * @function SelectWidget
 * @returns {string} Markup of the component.
 */
class SelectWidget extends Component {
  /**
   * Property types.
   * @property {Object} propTypes Property types.
   * @static
   */
  static propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    required: PropTypes.bool,
    error: PropTypes.arrayOf(PropTypes.string),
    getVocabulary: PropTypes.func.isRequired,
    getVocabularyTokenTitle: PropTypes.func.isRequired,
    choices: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    ),
    items: PropTypes.shape({
      vocabulary: PropTypes.object,
    }),
    widgetOptions: PropTypes.shape({
      vocabulary: PropTypes.object,
    }),
    value: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string,
      PropTypes.bool,
      PropTypes.func,
      PropTypes.array,
    ]),
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    onClick: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    wrapped: PropTypes.bool,
    noValueOption: PropTypes.bool,
    customOptionStyling: PropTypes.any,
    isMulti: PropTypes.bool,
    placeholder: PropTypes.string,
  };

  /**
   * Default properties
   * @property {Object} defaultProps Default properties.
   * @static
   */
  static defaultProps = {
    description: null,
    required: false,
    items: {
      vocabulary: null,
    },
    widgetOptions: {
      vocabulary: null,
    },
    error: [],
    choices: [],
    value: null,
    onChange: () => {},
    onBlur: () => {},
    onClick: () => {},
    onEdit: null,
    onDelete: null,
    noValueOption: true,
    customOptionStyling: null,
  };

  /**
   * Component did mount
   * @method componentDidMount
   * @returns {undefined}
   */
  componentDidMount() {
    if (
      (!this.props.choices || this.props.choices?.length === 0) &&
      this.props.vocabBaseUrl
    ) {
      this.props.getVocabulary({
        vocabNameOrURL: this.props.vocabBaseUrl,
        size: -1,
        subrequest: this.props.intl.locale,
      });
    }
  }

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    const { id, choices, value, intl, onChange, required, invalid, title } =
      this.props;
    const normalizedValue = normalizeValue(choices, value, intl);
    // Make sure that both disabled and isDisabled (from the DX layout feat work)
    const disabled = this.props.disabled || this.props.isDisabled;
    const Select = this.props.reactSelect.default;

    let options = this.props.vocabBaseUrl
      ? this.props.choices
      : [
          ...map(choices, (option) => ({
            value: option[0],
            label:
              // Fix "None" on the serializer, to remove when fixed in p.restapi
              option[1] !== 'None' && option[1] ? option[1] : option[0],
          })),
          // Only set "no-value" option if there's no default in the field
          // TODO: also if this.props.defaultValue?
          ...(this.props.noValueOption && !this.props.default
            ? [
                {
                  label: this.props.intl.formatMessage(messages.no_value),
                  value: 'no-value',
                },
              ]
            : []),
        ];

    const isMulti = this.props.isMulti
      ? this.props.isMulti
      : id === 'roles' || id === 'groups';

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
      <FormFieldWrapper {...this.props}>
        <Select
          id={`field-${id}`}
          key={choices}
          name={id}
          isDisabled={disabled}
          isSearchable={true}
          className="react-select-container"
          classNamePrefix="react-select"
          isMulti={isMulti}
          options={options}
          {...attributes}
          styles={customSelectStyles}
          theme={selectTheme}
          components={{
            ...(options?.length > 25 && {
              MenuList,
            }),
            DropdownIndicator,
            ClearIndicator,
            Option: this.props.customOptionStyling || Option,
          }}
          value={normalizedValue}
          placeholder={
            this.props.placeholder ??
            this.props.intl.formatMessage(messages.select)
          }
          onChange={(selectedOption) => {
            if (isMulti) {
              return onChange(
                id,
                selectedOption.map((el) => el.value),
              );
            }
            return onChange(
              id,
              selectedOption && selectedOption.value !== 'no-value'
                ? selectedOption.value
                : undefined,
            );
          }}
          isClearable
          aria-label={title}
          ariaLiveMessages={getReactSelectAriaLiveMessages(intl)}
          screenReaderStatus={getReactSelectScreenReaderStatus(intl)}
        />
      </FormFieldWrapper>
    );
  }
}

export const SelectWidgetComponent = injectIntl(SelectWidget);

export default compose(
  injectLazyLibs(['reactSelect']),
  connect(
    (state, props) => {
      const vocabBaseUrl = !props.choices
        ? getVocabFromHint(props) ||
          getVocabFromField(props) ||
          getVocabFromItems(props)
        : '';

      const vocabState =
        state.vocabularies?.[vocabBaseUrl]?.subrequests?.[props.intl.locale];

      // If the schema already has the choices in it, then do not try to get the vocab,
      // even if there is one
      if (props.choices) {
        return {
          choices: props.choices,
        };
      } else if (vocabState) {
        return {
          vocabBaseUrl,
          choices: vocabState?.items ?? [],
        };
        // There is a moment that vocabState is not there yet, so we need to pass the
        // vocabBaseUrl to the component.
      } else if (vocabBaseUrl) {
        return {
          vocabBaseUrl,
        };
      }
      return {};
    },
    { getVocabulary, getVocabularyTokenTitle },
  ),
)(SelectWidgetComponent);
