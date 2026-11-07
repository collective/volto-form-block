import React from 'react';
import { Segment, Grid, Form, Button, TabPane, Tab } from 'semantic-ui-react';
import {
  withDNDContext,
  SubblocksEdit,
  SubblocksWrapper,
} from 'volto-subblocks';
import SidebarPortal from '@plone/volto/components/manage/Sidebar/SidebarPortal';

import EditBlock from 'volto-form-block/components/EditBlock';
import Sidebar from 'volto-form-block/components/Sidebar';
import DataTable from 'volto-form-block/components/DataTable';
import ValidateConfigForm from 'volto-form-block/components/ValidateConfigForm';

import { defineMessages } from 'react-intl';
import config from '@plone/volto/registry';

const messages = defineMessages({
  addField: {
    id: 'Add field',
    defaultMessage: 'Aggiungi un campo',
  },
  default_submit_label: {
    id: 'form_default_submit_label',
    defaultMessage: 'Invia',
  },
  default_cancel_label: {
    id: 'form_default_cancel_label',
    defaultMessage: 'Annulla',
  },
  warning: {
    id: 'form_edit_warning',
    defaultMessage: 'Attenzione!',
  },
  warning_from: {
    id: 'form_edit_warning_from',
    defaultMessage:
      "Enter a field of type 'Sender E-mail'. If it is not present, or it is present but not filled in by the user, the sender address of the e-mail will be the one configured in the right sidebar.",
  },
  warning_enable_save: {
    id: 'warning_enable_save',
    defaultMessage:
      'Select the "Save Data" option in the right sidebar to enable storage and display of submitted data.',
  },
  form: {
    id: 'Form',
    defaultMessage: 'Form',
  },
  data: {
    id: 'Data',
    defaultMessage: 'data',
  },
});

/**
 * Edit Form block class.
 * @class Edit
 * @extends Component
 */
class Edit extends SubblocksEdit {
  componentDidMount() {
    super.componentDidMount();

    if (!this.props.data.default_from) {
      this.props.onChangeBlock(this.props.block, {
        ...this.props.data,
        default_from: 'noreply@plone.org',
        lastChange: new Date().getTime(),
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

    const datatableEnabled =
      config.blocks.blocksConfig.form.enableDatatableView;

    return (
      <div className="public-ui">
        <ValidateConfigForm
          data={this.props.data}
          onEdit={true}
          onChangeBlock={(data) => {
            this.props.onChangeBlock(this.props.block, data);
          }}
        >
          <Segment>
            {this.props.data.title && <h2>{this.props.data.title}</h2>}
            {this.props.data.description && (
              <p className="description">{this.props.data.description}</p>
            )}

            <SubblocksWrapper node={this.node}>
              <Tab
                panes={[
                  {
                    menuItem: this.props.intl.formatMessage(messages.form),
                    render: () => (
                      <TabPane>
                        {this.state.subblocks.map((subblock, subindex) => (
                          <Form.Field key={subindex}>
                            <EditBlock
                              data={subblock}
                              index={subindex}
                              selected={this.isSubblockSelected(subindex)}
                              {...this.subblockProps}
                              openObjectBrowser={this.props.openObjectBrowser}
                            />
                          </Form.Field>
                        ))}
                        {this.props.selected && (
                          <Form.Field>
                            {this.renderAddBlockButton(
                              this.props.intl.formatMessage(messages.addField),
                            )}
                          </Form.Field>
                        )}
                        <Grid columns={1} padded="vertically">
                          <Grid.Row>
                            <Grid.Column textAlign="center">
                              {this.props.data?.show_cancel && (
                                <Button secondary>
                                  {this.props.data.cancel_label ||
                                    this.props.intl.formatMessage(
                                      messages.default_cancel_label,
                                    )}
                                </Button>
                              )}
                              <Button primary>
                                {this.props.data.submit_label ||
                                  this.props.intl.formatMessage(
                                    messages.default_submit_label,
                                  )}
                              </Button>
                            </Grid.Column>
                          </Grid.Row>
                        </Grid>
                      </TabPane>
                    ),
                  },
                  ...(datatableEnabled
                    ? [
                        {
                          menuItem: this.props.intl.formatMessage(
                            messages.data,
                          ),
                          render: () => (
                            <TabPane className="container">
                              {this.props.data.store ? (
                                <DataTable
                                  properties={this.props.properties}
                                  blockId={this.props.block}
                                  removeDataAfterDays={
                                    this.props.data.remove_data_after_days
                                  }
                                />
                              ) : (
                                <p>
                                  {this.props.intl.formatMessage(
                                    messages.warning_enable_save,
                                  )}
                                </p>
                              )}
                            </TabPane>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            </SubblocksWrapper>
          </Segment>
        </ValidateConfigForm>

        <SidebarPortal selected={this.props.selected || false}>
          <Sidebar
            {...this.props}
            data={this.props.data}
            block={this.props.block}
            onChangeBlock={this.props.onChangeBlock}
            onChangeSubBlock={this.onChangeSubblocks}
            selected={this.state.subIndexSelected}
            setSelected={this.onSubblockChangeFocus}
            openObjectBrowser={this.props.openObjectBrowser}
            properties={
              this.props.metadata?.['@id']
                ? this.props.metadata
                : this.props.properties
            }
          />
        </SidebarPortal>
      </div>
    );
  }
}

export default React.memo(withDNDContext(Edit));
