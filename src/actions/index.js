/**
 * exportCsvFormData action
 * @module actions/submitForm
 */

export const SUBMIT_FORM_ACTION = 'SUBMIT_FORM_ACTION';

/**
 * submitForm function
 * @function submitForm
 * @param {string} path
 * @param {string} block_id
 * @param {Object} data
 * @returns {Object} attachments
 */
export function submitForm(path = '', block_id, data, attachments) {
  return {
    type: SUBMIT_FORM_ACTION,
    request: {
      op: 'post',
      path: path + '/@submit-form',
      data: {
        block_id,
        data,
        attachments,
      },
    },
  };
}

/**
 * exportCsvFormData action
 * @module actions/exportCsvFormData
 */
export const EXPORT_CSV_FORMDATA = 'EXPORT_CSV_FORMDATA';

export function exportCsvFormData(path = '') {
  return {
    type: EXPORT_CSV_FORMDATA,
    request: {
      op: 'get',
      path: path + '/@form-data-export',
    },
  };
}

/**
 * getFormData action
 * @module actions/getFormData
 */
export const GET_FORM_DATA = 'GET_FORMDATA';

export function getFormData(path = '') {
  return {
    type: GET_FORM_DATA,
    request: {
      op: 'get',
      path: path + '/@form-data',
    },
  };
}

/**
 * clearFormData action
 * @module actions/getFormData
 */
export const CLEAR_FORM_DATA = 'CLEAR_FORM_DATA';

export function clearFormData(path = '') {
  return {
    type: CLEAR_FORM_DATA,
    request: {
      op: 'get',
      path: path + '/@form-data-clear',
    },
  };
}
