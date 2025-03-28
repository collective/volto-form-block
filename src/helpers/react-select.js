import { defineMessages } from 'react-intl';

const messages = defineMessages({
  risultato: { id: 'select_risultato', defaultMessage: 'result' },
  risultati: { id: 'select_risultati', defaultMessage: 'results' },
  ay11_up_down: {
    id: 'ay11_Use Up and Down to choose options',
    defaultMessage: 'Use Up and Down to choose options',
  },
  ay11_select_option: {
    id: 'ay11_select_press Enter to select the currently focused option',
    defaultMessage: 'press Enter to select the currently focused option',
  },
  ay11_exit_menu: {
    id: 'ay11_select_press Escape to exit the menu',
    defaultMessage: 'press Escape to exit the menu',
  },
  ay11_tab_select_and_exit: {
    id: 'ay11_select__press Tab to select the option and exit the menu',
    defaultMessage: 'press Tab to select the option and exit the menu',
  },
  ay11_is_focused: {
    id: 'ay11_select_is_focused',
    defaultMessage: 'is_focused',
  },
  ay11_type_to_refine_list: {
    id: 'ay11_select__type to refine list',
    defaultMessage: 'type to refine list',
  },
  ay11_open_menu: {
    id: 'ay11_select_press Down to open the menu',
    defaultMessage: 'press Down to open the menu',
  },
  ay11_multi_select_focus_values: {
    id: 'ay11_select_press left to focus selected values',
    defaultMessage: 'press left to focus selected values',
  },
  ay11_toggle_values: {
    id:
      'ay11_select_Use left and right to toggle between focused values, press Backspace to remove the currently focused value',
    defaultMessage:
      'Use left and right to toggle between focused values, press Backspace to remove the currently focused value',
  },
  ay11_option: {
    id: 'ay11_select option',
    defaultMessage: 'option',
  },
  ay11_option_deselected: {
    id: 'ay11_select deselected',
    defaultMessage: 'deselected',
  },
  ay11_option_disabled: {
    id: 'ay11_select is disabled. Select another option.',
    defaultMessage: 'is disabled. Select another option.',
  },
  ay11_option_selected: {
    id: 'ay11_select selected',
    defaultMessage: 'selected',
  },
  ay11_value: {
    id: 'ay11_select value',
    defaultMessage: 'value',
  },
  ay11_focused: {
    id: 'ay11_select focused',
    defaultMessage: 'focused',
  },

  ay11_disabled: {
    id: 'ay11_select disabled',
    defaultMessage: 'disabled',
  },
  ay11_for_search_term: {
    id: 'ay11_select for search term',
    defaultMessage: 'for search term',
  },
  results: {
    id: 'ay11_select results',
    defaultMessage: 'results',
  },
  result: {
    id: 'ay11_select result',
    defaultMessage: 'result',
  },
  availables: {
    id: 'ay11_select availables',
    defaultMessage: 'availables',
  },
  available: {
    id: 'ay11_select available',
    defaultMessage: 'available',
  },
});

export const getReactSelectAriaLiveMessages = (intl) => {
  return {
    guidance: (props) => {
      const {
        isSearchable,
        isMulti,
        isDisabled,
        tabSelectsValue,
        context,
      } = props;
      switch (context) {
        case 'menu':
          return `${intl.formatMessage(messages.ay11_up_down)}${
            isDisabled
              ? ''
              : `, ${intl.formatMessage(messages.ay11_select_option)}`
          }, ${intl.formatMessage(messages.ay11_exit_menu)}${
            tabSelectsValue
              ? `, ${intl.formatMessage(messages.ay11_tab_select_and_exit)}`
              : ''
          }.`;
        case 'input':
          return `${props['aria-label'] || 'Select'} ${intl.formatMessage(
            messages.ay11_is_focused,
          )} ${
            isSearchable
              ? `,${intl.formatMessage(messages.ay11_type_to_refine_list)}`
              : ''
          }, ${intl.formatMessage(messages.ay11_open_menu)}, ${
            isMulti
              ? ` ${intl.formatMessage(
                  messages.ay11_multi_select_focus_values,
                )}`
              : ''
          }`;
        case 'value':
          return intl.formatMessage(messages.ay11_toggle_values);
        default:
          return '';
      }
    },

    onChange: (props) => {
      const { action, label = '', isDisabled } = props;
      switch (action) {
        case 'deselect-option':
        case 'pop-value':
        case 'remove-value':
          return `${intl.formatMessage(
            messages.ay11_option,
          )} ${label}, ${intl.formatMessage(messages.ay11_option_deselected)}.`;
        case 'select-option':
          return isDisabled
            ? `${intl.formatMessage(
                messages.ay11_option,
              )} ${label} ${intl.formatMessage(messages.ay11_option_disabled)}.`
            : `${intl.formatMessage(
                messages.ay11_option,
              )} ${label}, ${intl.formatMessage(
                messages.ay11_option_selected,
              )}.`;
        default:
          return '';
      }
    },

    onFocus: (props) => {
      const {
        context,
        focused = {},
        options,
        label = '',
        selectValue,
        isDisabled,
        isSelected,
      } = props;

      const getArrayIndex = (arr, item) =>
        arr && arr.length ? `${arr.indexOf(item) + 1} di ${arr.length}` : '';

      if (context === 'value' && selectValue) {
        return `${intl.formatMessage(
          messages.ay11_value,
        )} ${label} ${intl.formatMessage(
          messages.ay11_focused,
        )}, ${getArrayIndex(selectValue, focused)}.`;
      }

      if (context === 'menu') {
        const disabled = isDisabled
          ? ` ${intl.formatMessage(messages.ay11_disabled)}`
          : '';
        const status = `${
          isSelected
            ? intl.formatMessage(messages.ay11_option_selected)
            : intl.formatMessage(messages.ay11_focused)
        }${disabled}`;
        return `${intl.formatMessage(
          messages.ay11_option,
        )} ${label} ${status}, ${getArrayIndex(options, focused)}.`;
      }
      return '';
    },

    onFilter: (props) => {
      const { inputValue, resultsMessage } = props;
      return `${resultsMessage}${
        inputValue
          ? ` ${intl.formatMessage(messages.ay11_for_search_term)} ` +
            inputValue
          : ''
      }.`;
    },
  };
};

export const getReactSelectScreenReaderStatus = (intl) => ({ count }) => {
  const results =
    count !== 1
      ? intl.formatMessage(messages.results)
      : intl.formatMessage(messages.result);
  const available =
    count !== 1
      ? intl.formatMessage(messages.availables)
      : intl.formatMessage(messages.available);
  return `${count} ${results} ${available}`;
};
