/**
 * submitForm reducer.
 * @module reducers/submitForm
 */
import {
  SUBMIT_FORM_ACTION,
  EXPORT_CSV_FORMDATA,
  GET_FORM_DATA,
  CLEAR_FORM_DATA,
  SEND_OTP,
  RESET_OTP,
  SUBBLOCKS_ID_LIST,
} from 'volto-form-block/actions';

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
  subrequests: {},
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
      return action.subrequest
        ? {
            ...state,
            subrequests: {
              ...state.subrequests,
              [action.subrequest]: {
                ...(state.subrequests[action.subrequest] || {
                  result: null,
                }),
                error: null,
                loaded: false,
                loading: true,
              },
            },
          }
        : {
            ...state,
            result: null,
            error: null,
            loading: true,
            loaded: false,
          };
    case `${SUBMIT_FORM_ACTION}_SUCCESS`:
      return action.subrequest
        ? {
            ...state,
            subrequests: {
              ...state.subrequests,
              [action.subrequest]: {
                ...(state.subrequests[action.subrequest] || {}),
                result: action.result,
                error: null,
                loaded: true,
                loading: false,
              },
            },
          }
        : {
            ...state,
            result: action.result,
            error: null,
            loaded: true,
            loading: false,
          };
    case `${SUBMIT_FORM_ACTION}_FAIL`:
      return action.subrequest
        ? {
            ...state,
            subrequests: {
              ...state.subrequests,
              [action.subrequest]: {
                ...(state.subrequests[action.subrequest] || {}),
                error: action.error,
                result: null,
                loading: false,
                loaded: false,
              },
            },
          }
        : {
            ...state,
            error: action.error,
            result: null,
            loading: false,
            loaded: false,
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
      download(action.filename ?? `export-form.csv`, action.result);

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

/**
 * sendOTP reducer.
 * @function sendOTP
 * @param {Object} state Current state.
 * @param {Object} action Action to be handled.
 * @returns {Object} New state.
 */
export const sendOTP = (state = initialState, action = {}) => {
  switch (action.type) {
    case `${SEND_OTP}_PENDING`:
      return action.subrequest
        ? {
            ...state,
            subrequests: {
              ...state.subrequests,
              [action.subrequest]: {
                ...(state.subrequests[action.subrequest] || {
                  items: [],
                  total: 0,
                  batching: {},
                }),
                error: null,
                loaded: false,
                loading: true,
              },
            },
          }
        : {
            ...state,
            error: null,
            loading: true,
            loaded: false,
          };
    case `${SEND_OTP}_SUCCESS`:
      return action.subrequest
        ? {
            ...state,
            subrequests: {
              ...state.subrequests,
              [action.subrequest]: {
                ...(state.subrequests[action.subrequest] || {}),
                error: null,
                loaded: true,
                loading: false,
              },
            },
          }
        : {
            ...state,
            error: null,
            loaded: true,
            loading: false,
          };
    case `${SEND_OTP}_FAIL`:
      return action.subrequest
        ? {
            ...state,
            subrequests: {
              ...state.subrequests,
              [action.subrequest]: {
                ...(state.subrequests[action.subrequest] || {}),
                error: action.error,
                loading: false,
                loaded: false,
              },
            },
          }
        : {
            ...state,
            error: action.error,
            loading: false,
            loaded: false,
          };
    case RESET_OTP:
      let new_subrequests = { ...state.subrequests };

      if (action.block_id) {
        Object.keys(new_subrequests)
          .filter((k) => k.indexOf('otp_' + action.block_id) === 0)
          .forEach((k) => {
            delete new_subrequests[k];
          });
      }
      return action.block_id
        ? {
            ...state,
            subrequests: new_subrequests,
          }
        : {
            ...state,
            error: null,
            loading: true,
            loaded: false,
          };
    default:
      return state;
  }
};

export const subblocksIDList = (state = false, action = {}) => {
  switch (action.type) {
    case SUBBLOCKS_ID_LIST:
      return action.options;
    default:
      break;
  }
  return state;
};
