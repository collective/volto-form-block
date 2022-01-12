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
import { defineMessages, useIntl, FormattedMessage } from 'react-intl';

import { Icon } from '@plone/volto/components';

import upSVG from '@plone/volto/icons/up-key.svg';
import downSVG from '@plone/volto/icons/down-key.svg';
import downloadSVG from '@plone/volto/icons/download.svg';
import deleteSVG from '@plone/volto/icons/delete.svg';

import { getFormData, exportCsvFormData, clearFormData } from '../actions';

import config from '@plone/volto/registry';

import { BlockDataForm } from '@plone/volto/components';

const messages = defineMessages({
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
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
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
  var FormSchema = config.blocks.blocksConfig.form.formSchema;
  var FieldSchema = config.blocks.blocksConfig.form.fieldSchema;
  return (
    <Form>
      <Segment.Group raised>
        <header className="header pulled">
          <h2>
            <FormattedMessage id="Form" defaultMessage="Form" />
          </h2>
        </header>
        <Segment>
          <BlockDataForm
            schema={FormSchema(data)}
            onChangeField={(id, value) => {
              onChangeBlock(block, {
                ...data,
                [id]: value,
              });
            }}
            formData={data}
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
                      cancelButton={intl.formatMessage(messages.cancel)}
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
                    <BlockDataForm
                      schema={FieldSchema(subblock)}
                      onChangeField={(name, value) => {
                        var update_values = {};
                        if (
                          [
                            'select',
                            'single_choice',
                            'multiple_choice',
                          ].indexOf(value) < 0
                        ) {
                          update_values.input_values = null;
                        }
                        onChangeSubBlock(index, {
                          ...subblock,
                          [name]: value,
                          ...update_values,
                        });
                      }}
                      formData={subblock}
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
