import React, { Component } from 'react';
import { isEmpty } from 'lodash';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import { SidebarPortal } from '@plone/volto/components';
import { Form, BlockDataForm } from '@plone/volto/components/manage/Form';
import { withBlockExtensions } from '@plone/volto/helpers';
import config from '@plone/volto/registry';

const messages = defineMessages({
  submit: {
    id: 'Submit',
    defaultMessage: 'Submit',
  },
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
  },
});

class Edit extends Component {
  render() {
    const FormSchema = config.blocks.blocksConfig.schemaForm.blockSchema;
    const filterFactory = config.blocks.blocksConfig.schemaForm.filterFactory;
    const schema = FormSchema(this.props);
    const { data } = this.props;

    const defaultEmptyData = {
      fieldsets: [
        {
          id: 'default',
          title: 'Default',
          fields: [],
        },
      ],
      properties: {},
      required: [],
    };

    const dummyHandler = () => {};

    return (
      <>
        <Form
          schema={{
            fieldsets: [
              {
                behavior: 'plone',
                fields: ['schema'],
                id: 'default',
                title: 'Default',
              },
            ],
            properties: {
              schema: {
                description: '',
                factory: 'Text',
                title: 'Schema',
                type: 'string',
                widget: 'schema',
                default: defaultEmptyData,
                filterFactory,
              },
            },
            required: [],
            title: 'Form',
            type: 'object',
          }}
          formData={
            isEmpty(data.schema)
              ? { schema: defaultEmptyData }
              : { schema: data.schema }
          }
          onChangeFormData={(formData) => {
            this.props.onChangeBlock(this.props.block, {
              ...data,
              schema: formData.schema,
            });
          }}
          onSubmit={dummyHandler}
          onCancel={data.show_cancel ? dummyHandler : null}
          submitLabel={
            data.submit_label || this.props.intl.formatMessage(messages.submit)
          }
          cancelLabel={
            data.cancel_label || this.props.intl.formatMessage(messages.cancel)
          }
        />

        <SidebarPortal selected={this.props.selected}>
          <BlockDataForm
            schema={schema}
            title={schema.title}
            onChangeField={(id, value) => {
              this.props.onChangeBlock(this.props.block, {
                ...this.props.data,
                [id]: value,
              });
            }}
            onChangeBlock={this.props.onChangeBlock}
            formData={this.props.data}
            block={this.props.block}
            navRoot={this.props.navRoot}
            contentType={this.props.contentType}
          />
        </SidebarPortal>
      </>
    );
  }
}

export default compose(withBlockExtensions, injectIntl)(Edit);
