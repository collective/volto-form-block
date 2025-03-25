/**
 * exportCsvFormData action
 * @module actions/submitForm
 */

import { getFieldName } from 'volto-form-block/components/utils';
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

/**
 * sendOTP action
 * @module actions/sendOTP
 */
export const SEND_OTP = 'SEND_OTP';

export function sendOTP(path, block_id, email) {
  return {
    type: SEND_OTP,
    subrequest: 'otp_' + block_id + '_' + email,
    request: {
      op: 'post',
      path: path + '/@validate-email-address',
      data: {
        email,
        uid: block_id,
      },
    },
  };
}

/**
 * resetOTP action
 * @module actions/resetOTP
 */
export const RESET_OTP = 'RESET_OTP';

export function resetOTP(block_id) {
  return {
    type: RESET_OTP,
    block_id,
  };
}

/**
 * Function
 * @function setSubblocksIDList
 * @param {subblocks} subblocks array
 * @returns {Array} list of subblocks Id
 */

export const SUBBLOCKS_ID_LIST = 'SUBBLOCKS_ID_LIST';

export function setSubblocksIDList(subblocks) {
  let subblocksOptions = subblocks.map((item) => ({
    field_type: item.field_type,
    choices: item?.input_values?.length > 0 ? item.input_values : [],
    value: getFieldName(item.label, item.field_id),
    text: getFieldName(item.label, item.field_id),
  }));

  return {
    type: SUBBLOCKS_ID_LIST,
    options: subblocksOptions,
  };
}
