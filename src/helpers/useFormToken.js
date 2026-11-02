/**
 * useFormToken hook.
 * @module helpers/useFormToken
 */

import { useCallback, useEffect, useRef } from 'react';
import Api from '@plone/volto/helpers/Api/Api';

/**
 * Gets a single-use token for the form from the `@form-token` endpoint of
 * collective.volto.formsupport, when the block data has `form_token`: the
 * backend then only accepts a submission with a token, once, and only after
 * `form_token.min_age` seconds, because bots post at once.  Without
 * `form_token` the hook does nothing, and the form works without a token.
 *
 * The token is fetched in the browser, not with the block data, because that
 * is cached and shared between visitors.
 * @function useFormToken
 * @param {string} path Path of the content with the form.
 * @param {Object} settings The `form_token` of the block data.
 * @returns {Object} `wait()`, which resolves with the token once it is old
 *   enough, and `refresh()`, which gets a new one.
 */
const useFormToken = (path, settings) => {
  const enabled = !!settings;
  const minAge = settings?.min_age ?? 0;
  const token = useRef(null);
  const received = useRef(null);
  const request = useRef(Promise.resolve());

  const refresh = useCallback(() => {
    token.current = null;
    received.current = null;
    if (!enabled) return;
    request.current = new Api()
      .get(`${path}/@form-token`)
      .then((result) => {
        token.current = result.token;
        received.current = Date.now();
      })
      .catch(() => {
        // The backend refuses the submission then, with an error message.
        token.current = null;
      });
  }, [enabled, path]);

  // Wait for the token, and until it is old enough, so a quick person is not
  // refused.  The backend issued it before it was received here, so this
  // waits long enough.
  const wait = useCallback(
    () =>
      request.current.then(
        () =>
          new Promise((resolve) => {
            const remaining = received.current
              ? received.current + minAge * 1000 - Date.now()
              : 0;
            setTimeout(() => resolve(token.current), Math.max(remaining, 0));
          }),
      ),
    [minAge],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { wait, refresh };
};

export default useFormToken;
