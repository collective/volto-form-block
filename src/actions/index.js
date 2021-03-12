/**
 * submitForm actions.
 * @module actions/submitForm
 */

export const SUBMIT_FORM_ACTION = 'SUBMIT_FORM_ACTION';

/**
 * submitForm function
 * @function submitForm
 * @param {string} pat
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
