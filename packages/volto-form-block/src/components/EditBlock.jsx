/**
 * Edit text block.
 * @module components/manage/Blocks/Title/Edit
 */

import React from 'react';
import { compose } from 'redux';

import { injectDNDSubblocks, SubblockEdit, Subblock } from 'volto-subblocks';

import Field from 'volto-form-block/components/Field';
import { getFieldName } from 'volto-form-block/components/utils';

/**
 * Edit text block class.
 * @class Edit
 * @extends Component
 */
class EditBlock extends SubblockEdit {
  /**
   * Constructor
   * @method constructor
   * @param {Object} props Component properties
   * @constructs WysiwygEditor
   */
  constructor(props) {
    super(props);
    //default subblock values
    if (!props.data.field_type) {
      this.onChange({
        field_type: 'text',
      });
    }
  }

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    if (__SERVER__) {
      return <div />;
    }
    const id = this.props.data?.id || new Date().getTime();

    return (
      <Subblock subblock={this} className="subblock-edit">
        <div key={this.props.data.index}>
          <Field
            {...this.props.data}
            name={getFieldName(this.props.data.label, id)}
            key={this.props.data.index}
            isOnEdit={true}
            id={id}
            field_id={id}
            index={this.props.data.index}
            value={
              this.props.data.field_type === 'static_text'
                ? this.props.data.value
                : null
            }
            onChange={
              this.props.data.field_type === 'static_text'
                ? (_id, value) => this.onChange({ value })
                : () => {}
            }
          />
        </div>
      </Subblock>
    );
  }
}

export default compose(injectDNDSubblocks)(EditBlock);
