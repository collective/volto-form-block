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
import { Button, Confirm, Pagination, Table, Input, Select } from 'semantic-ui-react';
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
  exportFilteredCsv: {
    id: 'form_edit_exportFilteredCsv',
    defaultMessage: 'Export {filteredCount} filtered records out of {totalCount} as CSV',
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
  filterColumn: {
    id: 'form_filterColumn',
    defaultMessage: 'Filter...',
  },
  all: {
    id: 'form_all',
    defaultMessage: 'All',
  },
});

const DataTable = ({ ReactTable, properties, blockId }) => {
  const {
    useReactTable,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
  } = ReactTable;
  const dispatch = useDispatch();
  const intl = useIntl();

  const formData = useSelector((state) => state.formData);
  const clearFormDataSelector = useSelector((state) => state.clearFormData);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [data, setData] = useState([]);
  const blockData = properties?.blocks?.[blockId];

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
    if (blockData?.subblocks?.length === 0) {
      return [];
    }
    return blockData.subblocks
      .map((subblock) => {
        return {
          id: subblock.id,
          header: subblock.label,
          accessorFn: (row) => row[subblock.id]?.value,
          cell: (props) => {
            switch (subblock.field_type) {
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
              case 'multiple_choice':
                const mcVal = props.getValue();
                return Array.isArray(mcVal) ? mcVal.join(', ') : mcVal || '';
              default:
                return props.getValue() || '';
            }
          },
          meta: {
            field_type: subblock.field_type,
          },
          filterFn:
            subblock.field_type === 'multiple_choice' ? 'arrIncludes' : 'auto',
        };
      })
      .concat([
        {
          id: 'date',
          header: 'date',
          accessorFn: (row) => row.date.value,
          meta: {
            field_type: 'datetime',
          },
          filterFn: 'auto',
        },
      ]);
  }, [blockData?.subblocks, intl]);

  const table = useReactTable({
    columns,
    data,
    state: {
      sorting,
      columnFilters,
    },
    columnResizeMode: 'onEnd',
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // debugTable: true,
  });

  const downloadFilteredCsv = () => {
    const rows = table.getFilteredRowModel().rows;
    const headerRow = columns.map((col) => col.header).join(',');
    const csvContent = [
      headerRow,
      ...rows.map((row) =>
        columns
          .map((col) => {
            const val = row.original[col.id]?.value;
            return `"${(val || '').toString().replace(/"/g, '""')}"`;
          })
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `export-filtered-${properties.id ?? 'form'}.csv`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

          {/* BUTTON EXPORT FILTERED */}
          {columnFilters.length > 0 && (
            <Button icon primary onClick={downloadFilteredCsv}>
              <Icon name={downloadSVG} size="30px" />
              {intl.formatMessage(messages.exportFilteredCsv, {
                filteredCount: table.getFilteredRowModel().rows.length,
                totalCount: data.length,
              })}
            </Button>
          )}

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
              <React.Fragment key={headerGroup.id}>
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
                <Table.Row>
                  {headerGroup.headers.map((header) => {
                    const fieldType = header.column.columnDef.meta?.field_type;
                    const isChoiceField = [
                      'select',
                      'single_choice',
                      'multiple_choice',
                    ].includes(fieldType);

                    const options = isChoiceField
                      ? [
                        { key: 'all', text: intl.formatMessage(messages.all), value: '' },
                        ...Array.from(
                          new Set(
                            data
                              .flatMap((row) => {
                                const val = row[header.column.id]?.value;
                                return Array.isArray(val) ? val : [val];
                              })
                              .filter(Boolean),
                          ),
                        )
                          .sort()
                          .map((val) => ({
                            key: val,
                            text: val,
                            value: val,
                          })),
                      ]
                      : [];

                    return (
                      <Table.HeaderCell key={`${header.id}-filter`}>
                        {header.column.getCanFilter() ? (
                          <div className="dt-filter">
                            {isChoiceField ? (
                              <Select
                                fluid
                                size="mini"
                                options={options}
                                value={header.column.getFilterValue() ?? ''}
                                onChange={(e, { value }) =>
                                  header.column.setFilterValue(value)
                                }
                              />
                            ) : (
                              <Input
                                fluid
                                size="mini"
                                placeholder={intl.formatMessage(messages.filterColumn)}
                                value={header.column.getFilterValue() ?? ''}
                                onChange={(e) =>
                                  header.column.setFilterValue(e.target.value)
                                }
                              />
                            )}
                          </div>
                        ) : null}
                      </Table.HeaderCell>
                    );
                  })}
                </Table.Row>
              </React.Fragment>
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
