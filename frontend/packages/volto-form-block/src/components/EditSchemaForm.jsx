import React, { Component } from 'react';
import { isEmpty } from 'lodash';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import { SidebarPortal } from '@plone/volto/components';
import { Form, BlockDataForm } from '@plone/volto/components/manage/Form';
import { withBlockExtensions } from '@plone/volto/helpers';
import config from '@plone/volto/registry';
import { stripRequiredProperty } from '../helpers/schema';

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
    const additionalFactory =
      config.blocks.blocksConfig.schemaForm.additionalFactory;
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
        {data.title && <h2>{data.title}</h2>}
        {data.description && <p>{data.description}</p>}
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
                additionalFactory,
                allowEditId: true,
                allowEditQueryParameter: true,
                allowEditPlaceholder: true,
                widgets: config.blocks.blocksConfig.schemaForm.widgets,
              },
            },
            required: [],
            title: 'Form',
            type: 'object',
          }}
          component={config.blocks.blocksConfig.schemaForm.component}
          buttonComponent={
            config.blocks.blocksConfig.schemaForm.buttonComponent
          }
          formData={
            isEmpty(data.schema)
              ? { schema: defaultEmptyData }
              : { schema: stripRequiredProperty(data.schema) }
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
          textButtons={true}
        />

        <SidebarPortal selected={this.props.selected}>
          <BlockDataForm
            schema={schema}
            title={schema.title}
            onChangeField={(id, value) => {
              this.props.onChangeBlock(this.props.block, {
                ...this.props.data,
                [id]:
                  id === 'confirmation_recipients' && value
                    ? '${' + value + '}'
                    : value,
              });
            }}
            onChangeBlock={(block, data) => {
              this.props.onChangeBlock(block, {
                ...data,
                confirmation_recipients: data.confirmation_recipients
                  ? '${' + data.confirmation_recipients + '}'
                  : data.confirmation_recipients,
              });
            }}
            formData={{
              ...this.props.data,
              confirmation_recipients: this.props.data.confirmation_recipients
                ? this.props.data.confirmation_recipients.replace(/[${}]/g, '')
                : this.props.data.confirmation_recipients,
            }}
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
