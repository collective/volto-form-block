import { saveAs } from 'file-saver';

export const getFieldName = (label, id) => {
  return label?.length > 0
    ? label?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') + '_' + id
    : id;
};

/**
 * Download a file using `filename` specified in `content-disposition` header
 * @param {string} url             - URL to request
 * @param {Object} [fetchProps]    - Optional addtional props to pass to `fetch`
 * @example
 *     await downloadFile('https://example.com/myfile', { credentials: 'include' })
 */
export async function downloadFile(url, fetchProps) {
  try {
    const response = await fetch(url, fetchProps);

    if (!response.ok) {
      throw new Error(response);
    }

    // Extract filename from header
    const filename = response.headers
      .get('content-disposition')
      .split(';')
      .find((n) => n.includes('filename='))
      .replace('filename=', '')
      .trim();
    const blob = await response.blob();

    // Download the file
    saveAs(blob, filename);
  } catch (error) {
    throw new Error(error);
  }
}
