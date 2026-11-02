/**
 * HoneypotField component.
 * @module components/Widget/HoneypotField
 */

import config from '@plone/volto/registry';

/* Style */
import 'volto-form-block/components/Widget/HoneypotField.css';

/* A reserved name: form fields must not use it. */
export const HONEYPOT_FIELD = 'website';

/**
 * The hidden website field of the "honeypot" option of the form block: bots
 * that read the HTML fill it in, and the backend then ignores the submission.
 * It is hidden with CSS, not in the HTML.  It uses the honeypot widget of
 * Volto when there is one, which asks browsers and password managers not to
 * fill it in, and otherwise an input that does the same.
 * @function HoneypotField
 * @returns {string} Markup of the component.
 */
const HoneypotField = ({ value, onChange }) => {
  const VoltoHoneypotWidget = config.widgets.widget.honeypot;

  return (
    <div className="form-block-honeypot">
      {VoltoHoneypotWidget ? (
        <VoltoHoneypotWidget
          id={HONEYPOT_FIELD}
          title="Website"
          value={value}
          onChange={(id, value) => onChange(value)}
        />
      ) : (
        <>
          <label htmlFor={`field-${HONEYPOT_FIELD}`}>Website</label>
          <input
            type="text"
            id={`field-${HONEYPOT_FIELD}`}
            name={HONEYPOT_FIELD}
            value={value || ''}
            onChange={({ target }) => onChange(target.value || undefined)}
            autoComplete="off"
            data-1p-ignore=""
            data-lpignore="true"
            data-bwignore=""
          />
        </>
      )}
    </div>
  );
};

export default HoneypotField;
