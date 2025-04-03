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

const DataTable = ({ ReactTable, properties, fields, blockId }) => {
  const {
    useReactTable,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
  } = ReactTable;
  const formData = useSelector((state) => state.formData);
  const clearFormDataSelector = useSelector((state) => state.clearFormData);
  const dispatch = useDispatch();
  const intl = useIntl();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sorting, setSorting] = useState([]);

  useEffect(() => {
    dispatch(
      getFormData({
        path: flattenToAppURL(properties['@id']),
        block_id: blockId,
      }),
    );
  }, [clearFormDataSelector.loaded]);

  const columns = useMemo(() => {
    // TODO: field_type
    return [
      ...fields.map((field) => ({
        // TODO: field_id vs id (?)
        id: field.id,
        header: field.label,
        accessorFn: (row) => row[field.id]?.value,
        cell: (props) => {
          switch (field.field_type) {
            case 'attachment':
              const value = props.getValue();
              // TODO: unused fields:
              //      value.size -> size in bytes
              //      value.contentType -> mime type
              return value ? (
                <a href={value.url} download>
                  {value.filename}
                </a>
              ) : (
                ''
              );
            case 'textarea':
              return <pre>{props.getValue() || ''}</pre>;
            // case 'checkbox':
            //   return props.getValue() ? 'Yes' : 'No';
            default:
              return props.getValue() || '';
          }
        },
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

  // SORT
  // https://react.semantic-ui.com/collections/table/#variations-sortable
  // https://tanstack.com/table/v8/docs/examples/react/sorting

  const table = useReactTable({
    columns,
    data,
    state: {
      sorting,
    },
    columnResizeMode: 'onEnd',
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // debugTable: true,
  });
  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <Table
          sortable
          style={{
            width: table.getCenterTotalSize(),
          }}
        >
          <Table.Header>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Row key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.HeaderCell
                    style={{
                      width: header.getSize(),
                      whiteSpace: 'inherit',
                    }}
                    key={header.id}
                    sorted={
                      { asc: 'ascending', desc: 'descending' }[
                        header.column.getIsSorted()
                      ]
                    }
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </Table.HeaderCell>
                ))}
              </Table.Row>
            ))}
          </Table.Header>
          <Table.Body>
            {table.getRowModel().rows.map((row) => (
              <Table.Row key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
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

      <p>
        {intl.formatMessage(messages.formDataCount, {
          formDataCount: data.length,
        })}
      </p>
      <div className="inline">
        <Button
          compact
          size="small"
          primary
          onClick={() =>
            dispatch(
              exportCsvFormData(
                flattenToAppURL(properties['@id']),
                `export-${properties.id ?? 'form'}.csv`,
                blockId,
              ),
            )
          }
        >
          <Icon name={downloadSVG} />
          {intl.formatMessage(messages.exportCsv)}
        </Button>
        <Button compact size="small" onClick={() => setConfirmOpen(true)}>
          <Icon name={deleteSVG} />
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
