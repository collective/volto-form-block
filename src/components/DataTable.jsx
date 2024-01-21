import { Icon } from '@plone/volto/components';
import { flattenToAppURL } from '@plone/volto/helpers';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import deleteSVG from '@plone/volto/icons/delete.svg';
import downloadSVG from '@plone/volto/icons/download.svg';
import paginationLeftSVG from '@plone/volto/icons/left-key.svg';
import paginationRightSVG from '@plone/volto/icons/right-key.svg';
import React, { useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Confirm, Pagination, Table } from 'semantic-ui-react';
import {
  clearFormData,
  exportCsvFormData,
  getFormData,
} from 'volto-form-block/actions';

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

const DataTable = ({
  ReactTable,
  properties,
  fields,
  blockId,
  removeDataAfterDays,
}) => {
  const { useReactTable, flexRender, getCoreRowModel, getPaginationRowModel } =
    ReactTable;
  const formData = useSelector((state) => state.formData);
  const dispatch = useDispatch();
  const intl = useIntl();
  const [confirmOpen, setConfirmOpen] = useState(false);

  console.log('DataTable', {
    properties,
    fields,
    blockId,
    removeDataAfterDays,
  });

  useEffect(() => {
    dispatch(getFormData(flattenToAppURL(properties['@id'])));
  }, []);

  const columns = useMemo(() => {
    // TODO: field_type
    return [
      ...fields.map((field) => ({
        // TODO: field_id vs id (?)
        id: field.id,
        header: field.label,
        accessorFn: (row) => row[field.id]?.value,
      })),
      {
        id: 'date',
        header: 'date',
        accessorFn: (row) => row.date?.value,
      },
    ];
  }, []);

  const data = useMemo(
    () =>
      // TODO: filter data by blockid
      formData.loaded
        ? formData.result.items.filter(
            (item) => item.block_id.value === blockId,
          )
        : [],
    [formData],
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    //
    debugTable: true,
  });
  return (
    <>
      <Table>
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </Table.Header>
        <Table.Body>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </Table.Body>
      </Table>

      {table.getPageCount() > 1 && (
        <div className="pagination-wrapper react-table-pagination">
          <Pagination
            activePage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            onPageChange={(e, { activePage }) => {
              table.setPageIndex(activePage - 1);
            }}
            firstItem={null}
            lastItem={null}
            prevItem={{
              content: <Icon name={paginationLeftSVG} size="18px" />,
              icon: true,
              'aria-disabled': table.getState().pagination.pageIndex + 1 === 1,
              className:
                table.getState().pagination.pageIndex + 1 === 1
                  ? 'disabled'
                  : null,
            }}
            nextItem={{
              content: <Icon name={paginationRightSVG} size="18px" />,
              icon: true,
              'aria-disabled':
                table.getState().pagination.pageIndex + 1 ===
                table.getPageCount(),
              className:
                table.getState().pagination.pageIndex + 1 ===
                table.getPageCount()
                  ? 'disabled'
                  : null,
            }}
          ></Pagination>
          {/* <select
          style={{ maxWidth: '7rem' }}
          value={table.getState().pagination.pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[1, 2, 10, 25, 50, 100].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select> */}
        </div>
      )}

      <div class="ui buttons">
        <p>
          {intl.formatMessage(messages.formDataCount, {
            formDataCount: data.length,
          })}
        </p>
        <Button
          compact
          size="tiny"
          onClick={() =>
            dispatch(
              exportCsvFormData(
                flattenToAppURL(properties['@id']),
                blockId,
                `export-${properties.id ?? 'form'}.csv`,
              ),
            )
          }
        >
          <Icon name={downloadSVG} />
          {intl.formatMessage(messages.exportCsv)}
        </Button>

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
            dispatch(
              clearFormData(flattenToAppURL(properties['@id']), blockId),
            );
            setConfirmOpen(false);
          }}
        />
      </div>
    </>
  );
};

export default injectLazyLibs(['ReactTable'])(DataTable);
