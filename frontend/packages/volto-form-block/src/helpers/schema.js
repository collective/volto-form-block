/**
 * Schema helper.
 * @module helpers/schema
 */

import isObject from 'lodash/isObject';

/**
 * Strip required property
 * @function stripRequiredProperty
 * @param {Object} schema Schema.
 * @return {Object} Schema with required property stripped
 */
export function stripRequiredProperty(schema) {
  if (!isObject(schema) || !isObject(schema.properties)) {
    return schema;
  }

  for (const field in schema.properties) {
    delete schema.properties[field].required;
  }

  return schema;
}
