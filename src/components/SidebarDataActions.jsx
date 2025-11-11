import { useEffect, useState } from 'react';
import { Button, Grid, Confirm, Dimmer, Loader } from 'semantic-ui-react';
import { useDispatch, useSelector } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import Icon from '@plone/volto/components/theme/Icon/Icon';

import downloadSVG from '@plone/volto/icons/download.svg';
import deleteSVG from '@plone/volto/icons/delete.svg';
import warningSVG from '@plone/volto/icons/warning.svg';

import {
  clearFormData,
  exportCsvFormData,
  getFormData,
} from 'volto-form-block/actions';

export default function SidebarDataActions({ properties, block, data }) {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const formData = useSelector((state) => state.formData);
  const clearFormDataState = useSelector(
    (state) => state.clearFormData?.loaded,
  );
  useEffect(() => {
    if (properties?.['@id'])
      dispatch(
        getFormData({
          path: flattenToAppURL(properties['@id']),
          block_id: block,
        }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearFormDataState]);

  return (
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
            type="button"
            primary
            compact
            onClick={() =>
              dispatch(
                exportCsvFormData(
                  flattenToAppURL(properties['@id']),
                  `export-${properties.id ?? 'form'}.csv`,
                  block,
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
            type="button"
            negative
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
              dispatch(
                clearFormData({
                  path: flattenToAppURL(properties['@id']),
                  block_id: block,
                }),
              );
              setConfirmOpen(false);
            }}
          />
        </Grid.Column>
      </Grid.Row>
      {data.remove_data_after_days > 0 && (
        <Grid.Row>
          <div class="ui message info tiny">
            {formData.loaded && formData.result?.expired_total > 0 && (
              <>
                <p>
                  <Icon name={warningSVG} size="18px" />
                  {intl.formatMessage(messages.remove_data_warning, {
                    record: formData.result.expired_total,
                  })}
                </p>
                <p>
                  <Button
                    onClick={() =>
                      dispatch(
                        clearFormData({
                          path: flattenToAppURL(properties['@id']),
                          expired: true,
                          block_id: block,
                        }),
                      )
                    }
                    size="tiny"
                    compact
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Icon name={deleteSVG} size="1.5rem" />{' '}
                    {intl.formatMessage(messages.remove_data_button)}
                  </Button>
                </p>
              </>
            )}
            <p>{intl.formatMessage(messages.remove_data_cron_info)}</p>
          </div>
        </Grid.Row>
      )}
    </Grid>
  );
}

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
  remove_data_cron_info: {
    id: 'remove_data_cron_info',
    defaultMessage:
      'To automate the removal of records that have exceeded the maximum number of days indicated in configuration, a cron must be set up on the server as indicated in the product documentation.',
  },
  remove_data_warning: {
    id: 'remove_data_warning',
    defaultMessage:
      'There are {record} record that have exceeded the maximum number of days.',
  },
  remove_data_button: {
    id: 'remove_data_button',
    defaultMessage: 'remove expired data',
  },
});
