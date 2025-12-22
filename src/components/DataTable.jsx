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

/* Style */
import 'volto-form-block/components/DataTable.css';

const messages = defineMessages({
  exportCsv: {
    id: 'form_edit_exportCsv',
    defaultMessage: 'Export data',
  },
  clearData: {
    id: 'form_clear_data',
    defaultMessage: 'Clear data',
  },
  formDataCountSingle: {
    id: 'form_formDataCountSingle',
    defaultMessage: 'Item stored',
  },
  formDataCount: {
    id: 'form_formDataCount',
    defaultMessage: 'Items stored',
  },
  confirmClearData: {
    id: 'form_confirmClearData',
    defaultMessage: 'Are you sure you want to delete all saved items?',
  },
  cancel: {
    id: 'Cancel',
    defaultMessage: 'Cancel',
  },
  formValueYes: {
    id: 'form_formValueYes',
    defaultMessage: 'Yes',
  },
  formValueNo: {
    id: 'form_formValueNo',
    defaultMessage: 'No',
  },
});

const DataTable = ({ ReactTable, properties, blockId }) => {
  const {
    useReactTable,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
  } = ReactTable;
  const dispatch = useDispatch();
  const intl = useIntl();

  const formData = useSelector((state) => state.formData);
  const clearFormDataSelector = useSelector((state) => state.clearFormData);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => {
    dispatch(
      getFormData({
        path: flattenToAppURL(properties['@id']),
        block_id: blockId,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearFormDataSelector.loaded]);

  // const data = useMemo(
  //   () =>
  //     // TODO: filter data by blockid
  //     formData.loaded
  //       ? formData.result.items.filter(
  //           (item) => item.block_id.value === blockId,
  //         )
  //       : [],
  //   [formData],
  // );

  useEffect(() => {
    let dataResults = [];
    if (formData?.result?.items?.length > 0) {
      dataResults = formData.result.items.filter(
        (item) => item.block_id.value === blockId,
      );
    }
    setData(dataResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // SORT
  // https://react.semantic-ui.com/collections/table/#variations-sortable
  // https://tanstack.com/table/v8/docs/examples/react/sorting

  const columns = useMemo(() => {
    let arrayColumn = [];
    let filteredColumn = [];
    // List of IDs to exclude
    const excludeIds = ['__expired', 'block_id', 'id', 'field_type'];
    if (data?.length > 0) {
      arrayColumn = data
        .flatMap((obj) => {
          return Object.entries(obj)
            .filter(([key, value]) => key)
            .map(([key, value]) => {
              return {
                id: key,
                header: value?.label,
                accessorFn: (row) => row[key]?.value,
                cell: (props) => {
                  switch (value?.field_type) {
                    case 'attachment':
                      const val = props.getValue();
                      // TODO: unused fields:
                      // val.size -> size in bytes
                      // val.contentType -> mime type
                      return val ? (
                        <a href={val.url} download>
                          {val.filename}
                        </a>
                      ) : (
                        ''
                      );
                    case 'textarea':
                      return <pre>{props.getValue() || ''}</pre>;
                    case 'checkbox':
                      return props.getValue()
                        ? intl.formatMessage(messages.formValueYes)
                        : intl.formatMessage(messages.formValueNo);
                    default:
                      return props.getValue() || '';
                  }
                },
              };
            });
        })
        .filter((item) => !excludeIds.includes(item.id))
        .reduce((acc, current) => {
          // Check if the id already exists
          const existing = acc.find((item) => item.id === current.id);
          if (!existing) {
            acc.push(current); // If it doesn't exist, add object
          }
          return acc;
        }, []);

      const dateItem = arrayColumn.find((item) => item.id === 'date');
      filteredColumn = arrayColumn.filter((item) => item.id !== 'date');

      if (dateItem) {
        filteredColumn.push(dateItem); // Add field "date" at the end fo array
      }
    }
    return filteredColumn;
  }, [data, intl]);

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
    <div className="dt-wrapper">
      <div className="dt-wrapper-header">
        {/* RESULTS INFO */}
        <div className="dt-info-results">
          <p>
            <strong>{data.length} </strong>
            {data.length === 1
              ? intl.formatMessage(messages.formDataCountSingle)
              : intl.formatMessage(messages.formDataCount)}
          </p>
        </div>

        <div className="dt-actions">
          {/* BUTTON EXPORT */}
          <Button
            icon
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
            <Icon name={downloadSVG} size="30px" />
            {intl.formatMessage(messages.exportCsv)}
          </Button>
          {/* BUTTON DELETE */}
          <Button icon negative onClick={() => setConfirmOpen(true)}>
            <Icon name={deleteSVG} size="30px" />
            {intl.formatMessage(messages.clearData)}
          </Button>
          {/* MODAL CONFIRM DELETE */}
          <Confirm
            open={confirmOpen}
            content={intl.formatMessage(messages.confirmClearData)}
            cancelButton={intl.formatMessage(messages.cancel)}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              dispatch(
                clearFormData({
                  path: flattenToAppURL(properties['@id']),
                  block_id: blockId,
                }),
              );
              setConfirmOpen(false);
            }}
          />
        </div>
      </div>
      {/* TABLE */}
      <div className="dt-wrapper-table">
        <Table celled sortable striped>
          <Table.Header>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Row key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.HeaderCell
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
            {table.getRowModel().rows.map((row) => {
              return (
                <Table.Row key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Cell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </Table.Cell>
                  ))}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </div>

      {/* PAGINATION */}
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
    </div>
  );
};

export default injectLazyLibs(['ReactTable'])(DataTable);
