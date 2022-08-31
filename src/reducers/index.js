/**
 * submitForm reducer.
 * @module reducers/submitForm
 */
import {
  SUBMIT_FORM_ACTION,
  EXPORT_CSV_FORMDATA,
  GET_FORM_DATA,
  CLEAR_FORM_DATA,
} from '../actions';

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/comma-separated-values;charset=utf-8,' +
      encodeURIComponent(text),
  );
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

const initialState = {
  error: null,
  loaded: false,
  loading: false,
};

/**
 * submitForm reducer.
 * @function submitForm
 * @param {Object} state Current state.
 * @param {Object} action Action to be handled.
 * @returns {Object} New state.
 */
export const submitForm = (state = initialState, action = {}) => {
  switch (action.type) {
    case `${SUBMIT_FORM_ACTION}_PENDING`:
      return {
        ...state,
        error: null,
        loaded: false,
        loading: true,
      };
    case `${SUBMIT_FORM_ACTION}_SUCCESS`:
      return {
        ...state,
        error: null,
        loaded: true,
        loading: false,
      };
    case `${SUBMIT_FORM_ACTION}_FAIL`:
      return {
        ...state,
        error: action.error,
        loaded: false,
        loading: false,
      };
    default:
      return state;
  }
};

/**
 * exportCsvFormData reducer.
 * @function exportCsvFormData
 * @param {Object} state Current state.
 * @param {Object} action Action to be handled.
 * @returns {Object} New state.
 */
export const exportCsvFormData = (state = initialState, action = {}) => {
  switch (action.type) {
    case `${EXPORT_CSV_FORMDATA}_PENDING`:
      return {
        ...state,
        error: null,
        result: null,
        loaded: false,
        loading: true,
      };
    case `${EXPORT_CSV_FORMDATA}_SUCCESS`:
      download(
        `export-${state.content?.data?.id ?? 'form'}.csv`,
        action.result,
      );

      return {
        ...state,
        error: null,
        result: action.result,
        loaded: true,
        loading: false,
      };
    case `${EXPORT_CSV_FORMDATA}_FAIL`:
      return {
        ...state,
        error: action.error,
        result: null,
        loaded: false,
        loading: false,
      };
    default:
      return state;
  }
};

/**
 * getFormData reducer.
 * @function getFormData
 * @param {Object} state Current state.
 * @param {Object} action Action to be handled.
 * @returns {Object} New state.
 */
export const getFormData = (state = initialState, action = {}) => {
  switch (action.type) {
    case `${GET_FORM_DATA}_PENDING`:
      return {
        ...state,
        error: null,
        loaded: false,
        loading: true,
        result: null,
      };
    case `${GET_FORM_DATA}_SUCCESS`:
      return {
        ...state,
        error: null,
        loaded: true,
        result: action.result,
        loading: false,
      };
    case `${GET_FORM_DATA}_FAIL`:
      return {
        ...state,
        error: action.error,
        result: null,
        loaded: true,
        loading: false,
      };
    default:
      return state;
  }
};

/**
 * clearFormData reducer.
 * @function clearFormData
 * @param {Object} state Current state.
 * @param {Object} action Action to be handled.
 * @returns {Object} New state.
 */
export const clearFormData = (state = initialState, action = {}) => {
  switch (action.type) {
    case `${CLEAR_FORM_DATA}_PENDING`:
      return {
        ...state,
        error: null,
        loaded: false,
        loading: true,
      };
    case `${CLEAR_FORM_DATA}_SUCCESS`:
      return {
        ...state,
        error: null,
        loaded: true,
        loading: false,
      };
    case `${CLEAR_FORM_DATA}_FAIL`:
      return {
        ...state,
        error: action.error,
        loaded: false,
        loading: false,
      };
    default:
      return state;
  }
};
