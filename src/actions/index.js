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
export function submitForm(path = '', block_id, data, attachments, captcha) {
  return {
    type: SUBMIT_FORM_ACTION,
    subrequest: block_id,
    request: {
      op: 'post',
      path: path + '/@submit-form',
      data: {
        block_id,
        data,
        attachments,
        captcha,
      },
    },
  };
}

/**
 * exportCsvFormData action
 * @module actions/exportCsvFormData
 */
export const EXPORT_CSV_FORMDATA = 'EXPORT_CSV_FORMDATA';

export function exportCsvFormData(path = '', filename, block_id) {
  return {
    type: EXPORT_CSV_FORMDATA,
    filename: filename,
    request: {
      op: 'get',
      path: `${path}/@form-data-export${
        block_id ? '?block_id=' + block_id : ''
      }`,
    },
  };
}

/**
 * getFormData action
 * @module actions/getFormData
 */
export const GET_FORM_DATA = 'GET_FORMDATA';

export function getFormData({ path, block_id }) {
  return {
    type: GET_FORM_DATA,
    request: {
      op: 'get',
      path: `${path}/@form-data${block_id ? '?block_id=' + block_id : ''}`,
    },
  };
}

/**
 * clearFormData action
 * @module actions/getFormData
 */
export const CLEAR_FORM_DATA = 'CLEAR_FORM_DATA';

export function clearFormData({ path, block_id, expired = false }) {
  const payload = {
    expired,
    block_id,
  };
  return {
    type: CLEAR_FORM_DATA,
    request: {
      op: 'del',
      path: `${path}/@form-data-clear`,
      data: payload,
    },
  };
}
