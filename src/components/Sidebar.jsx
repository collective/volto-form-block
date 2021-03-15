import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import {
  Segment,
  Accordion,
  Form,
  Button,
  Grid,
  Confirm,
  Dimmer,
  Loader,
} from 'semantic-ui-react';
import {
  defineMessages,
  useIntl,
  FormattedMessage,
} from 'react-intl';

import {
  Icon,
  TextWidget,
  CheckboxWidget,
  SelectWidget,
  ArrayWidget,
} from '@plone/volto/components';

import upSVG from '@plone/volto/icons/up-key.svg';
import downSVG from '@plone/volto/icons/down-key.svg';
import downloadSVG from '@plone/volto/icons/download.svg';
import deleteSVG from '@plone/volto/icons/delete.svg';

import {
  getFormData,
  exportCsvFormData,
  clearFormData,
} from 'volto-form-block/actions';

const messages = defineMessages({
  default_to: {
    id: 'form_to',
    defaultMessage: 'Recipients',
  },
  submit_label: {
    id: 'form_submit_label',
    defaultMessage: 'Submit button label',
  },
  field_label: {
    id: 'form_field_label',
    defaultMessage: 'Label',
  },
  field_description: {
    id: 'form_field_description',
    defaultMessage: 'Description',
  },
  field_name: {
    id: 'form_field_name',
    defaultMessage: 'Name',
  },
  field_name_description: {
    id: 'form_field_name_description',
    defaultMessage:
      'The name must contain spaces, and can only contain alphanumeric characters in addition to the "-" and "_" characters. The name is the same as the name of the parameter.',
  },
  field_required: {
    id: 'form_field_required',
    defaultMessage: 'Required',
  },
  field_type: {
    id: 'form_field_type',
    defaultMessage: 'Field type',
  },
  field_type_text: {
    id: 'form_field_type_text',
    defaultMessage: 'Text',
  },
  field_type_textarea: {
    id: 'form_field_type_textarea',
    defaultMessage: 'Textarea',
  },
  field_type_select: {
    id: 'form_field_type_select',
    defaultMessage: 'List',
  },
  field_type_radio: {
    id: 'form_field_type_radio',
    defaultMessage: 'Single choice',
  },
  field_type_checkbox: {
    id: 'form_field_type_checkbox',
    defaultMessage: 'Multiple choice',
  },
  field_type_date: {
    id: 'form_field_type_date',
    defaultMessage: 'Date',
  },
  field_type_attachment: {
    id: 'form_field_type_attachment',
    defaultMessage: 'Attachment',
  },
  field_type_from: {
    id: 'form_field_type_from',
    defaultMessage: 'E-mail',
  },
  field_input_values: {
    id: 'form_field_input_values',
    defaultMessage: 'Possible values',
  },
  default_subject: {
    id: 'form_default_subject',
    defaultMessage: 'Mail subject',
  },
  default_from: {
    id: 'form_default_from',
    defaultMessage: 'Default sender',
  },
  default_from_description: {
    id: 'form_default_from_description',
    defaultMessage:
      'This address will be used as the sender of the email with the form data',
  },
  store: {
    id: 'form_save_persistent_data',
    defaultMessage: 'Store compiled data',
  },
  send: {
    id: 'form_send_email',
    defaultMessage: 'Send email to recipient',
  },
  exportCsv: {
    id: 'form_edit_exportCsv',
    defaultMessage: 'Export data',
  },
  clearData: {
    id: 'form_clear_data',
    defaultMessage: 'Clear data',
  },
  formDataCount: {
    id: 'form_formDataCount',
    defaultMessage: '{formDataCount} item(s) stored',
  },
  confirmClearData: {
    id: 'form_confirmClearData',
    defaultMessage: 'Are you sure you want to delete all saved items?',
  },
});

const Sidebar = ({
  data,
  properties,
  block,
  onChangeBlock,
  onChangeSubBlock,
  selected = 0,
  setSelected,
  openObjectBrowser,
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const formData = useSelector((state) => state.formData);
  const clearFormDataState = useSelector(
    (state) => state.clearFormData?.loaded,
  );
  useEffect(() => {
    if (properties?.['@id']) dispatch(getFormData(properties['@id']));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearFormDataState]);

  if (data.send_email === undefined) data.send_email = true;

  data.subblocks &&
    data.subblocks.forEach((subblock) => {
      subblock.field_id = subblock.id;
    });

  return (
    <Form>
      <Segment.Group raised>
        <header className="header pulled">
          <h2>
            <FormattedMessage id="Form" defaultMessage="Form" />
          </h2>
        </header>
        <Segment>
          <TextWidget
            id="default_to"
            title={intl.formatMessage(messages.default_to)}
            required={true}
            value={data.default_to}
            onChange={(name, value) => {
              onChangeBlock(block, {
                ...data,
                [name]: value,
              });
            }}
          />
          <TextWidget
            id="default_from"
            title={intl.formatMessage(messages.default_from)}
            description={intl.formatMessage(messages.default_from_description)}
            required={true}
            value={data.default_from}
            onChange={(name, value) => {
              onChangeBlock(block, {
                ...data,
                [name]: value,
              });
            }}
          />

          <TextWidget
            id="default_subject"
            title={intl.formatMessage(messages.default_subject)}
            required={true}
            value={data.default_subject}
            onChange={(name, value) => {
              onChangeBlock(block, {
                ...data,
                [name]: value,
              });
            }}
          />
          <TextWidget
            id="submit_label"
            title={intl.formatMessage(messages.submit_label)}
            required={false}
            value={data.submit_label}
            onChange={(name, value) => {
              onChangeBlock(block, {
                ...data,
                [name]: value,
              });
            }}
          />

          <CheckboxWidget
            id="store"
            title={intl.formatMessage(messages.store)}
            required={false}
            value={data.store ?? false}
            onChange={(name, value) => {
              onChangeBlock(block, {
                ...data,
                [name]: value,
              });
            }}
          />
          <CheckboxWidget
            id="send"
            title={intl.formatMessage(messages.send)}
            required={false}
            value={data.send ?? false}
            onChange={(name, value) => {
              onChangeBlock(block, {
                ...data,
                [name]: value,
              });
            }}
          />

          {properties?.['@components']?.form_data && (
            <Form.Field inline>
              <Grid>
                <Grid.Row stretched centered style={{ padding: '1rem 0' }}>
                  <Dimmer active={formData?.loading}>
                    <Loader size="tiny" />
                  </Dimmer>
                  <p>
                    {intl.formatMessage(messages.formDataCount, {
                      formDataCount: formData?.result?.items_total ?? 0,
                    })}
                  </p>
                </Grid.Row>
                <Grid.Row
                  stretched
                  centered
                  columns={2}
                  style={{ marginBottom: '0.5rem' }}
                >
                  <Grid.Column>
                    <Button
                      compact
                      onClick={() =>
                        dispatch(
                          exportCsvFormData(
                            properties['@id'],
                            `export-${properties.id ?? 'form'}.csv`,
                          ),
                        )
                      }
                      size="tiny"
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <Icon name={downloadSVG} size="1.5rem" />{' '}
                      {intl.formatMessage(messages.exportCsv)}
                    </Button>
                  </Grid.Column>
                  <Grid.Column>
                    <Button
                      compact
                      onClick={() => setConfirmOpen(true)}
                      size="tiny"
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <Icon name={deleteSVG} size="1.5rem" />{' '}
                      {intl.formatMessage(messages.clearData)}
                    </Button>
                    <Confirm
                      open={confirmOpen}
                      content={intl.formatMessage(messages.confirmClearData)}
                      onCancel={() => setConfirmOpen(false)}
                      onConfirm={() => {
                        dispatch(clearFormData(properties['@id']));
                        setConfirmOpen(false);
                      }}
                    />
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </Form.Field>
          )}
        </Segment>
        <Accordion fluid styled className="form">
          {data.subblocks &&
            data.subblocks.map((subblock, index) => {
              return (
                <div key={'subblock' + index}>
                  <Accordion.Title
                    active={selected === index}
                    index={index}
                    onClick={() =>
                      setSelected(selected === index ? null : index)
                    }
                  >
                    {subblock.label ?? subblock.field_name}
                    {selected === index ? (
                      <Icon name={upSVG} size="20px" />
                    ) : (
                      <Icon name={downSVG} size="20px" />
                    )}
                  </Accordion.Title>
                  <Accordion.Content active={selected === index}>
                    <TextWidget
                      id="label"
                      title={intl.formatMessage(messages.field_label)}
                      required={true}
                      value={subblock.label}
                      onChange={(name, value) => {
                        onChangeSubBlock(index, {
                          ...subblock,
                          [name]: value,
                        });
                      }}
                    />
                    <TextWidget
                      id="description"
                      title={intl.formatMessage(messages.field_description)}
                      value={subblock.description}
                      onChange={(name, value) => {
                        onChangeSubBlock(index, {
                          ...subblock,
                          [name]: value,
                        });
                      }}
                    />

                    <SelectWidget
                      id="field_type"
                      title={intl.formatMessage(messages.field_type)}
                      required={true}
                      value={subblock.field_type || ''}
                      onChange={(name, value) => {
                        var update_values = {};
                        if (['select', 'radio'].indexOf(value) < 0) {
                          update_values.input_values = null;
                        }
                        onChangeSubBlock(index, {
                          ...subblock,
                          [name]: value,
                          ...update_values,
                        });
                      }}
                      choices={[
                        ['text', intl.formatMessage(messages.field_type_text)],
                        [
                          'textarea',
                          intl.formatMessage(messages.field_type_textarea),
                        ],
                        [
                          'select',
                          intl.formatMessage(messages.field_type_select),
                        ],
                        [
                          'radio',
                          intl.formatMessage(messages.field_type_radio),
                        ],
                        [
                          'checkbox',
                          intl.formatMessage(messages.field_type_checkbox),
                        ],
                        ['date', intl.formatMessage(messages.field_type_date)],
                        [
                          'attachment',
                          intl.formatMessage(messages.field_type_attachment),
                        ],
                        ['from', intl.formatMessage(messages.field_type_from)],
                      ]}
                    />

                    {['select', 'radio'].indexOf(subblock.field_type) >= 0 && (
                      <ArrayWidget
                        id="input_values"
                        title={intl.formatMessage(messages.field_input_values)}
                        onChange={(name, value) => {
                          onChangeSubBlock(index, {
                            ...subblock,
                            [name]: value,
                          });
                        }}
                        required={true}
                        value={subblock.input_values}
                      />
                    )}

                    <CheckboxWidget
                      id="required"
                      title={intl.formatMessage(messages.field_required)}
                      value={subblock.required ? subblock.required : false}
                      onChange={(name, value) => {
                        onChangeSubBlock(index, {
                          ...subblock,
                          [name]: value,
                        });
                      }}
                    />
                  </Accordion.Content>
                </div>
              );
            })}
        </Accordion>
      </Segment.Group>
    </Form>
  );
};

Sidebar.propTypes = {
  data: PropTypes.objectOf(PropTypes.any),
  block: PropTypes.string,
  onChangeBlock: PropTypes.func,
  selected: PropTypes.any,
  setSelected: PropTypes.func,
};

export default Sidebar;
