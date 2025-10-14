import { useEffect } from 'react';
import { useTable, useSortBy } from 'react-table';
import { WindowPlusIcon } from '../icon-svgs/icon-svgs';

const Table = ({ columns, data, loading, onSortChange, enableSorting = false, noDataMesssage='No records to display', noDataDescription='' }) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state: { sortBy }
  } = useTable({ 
    columns, 
    data,
    getRowId: (row, index) => row.id || `row-${index}`
  }, enableSorting ? useSortBy : undefined);

  useEffect(() => {
    if (enableSorting) {
      onSortChange(sortBy);
    }
  }, [sortBy, enableSorting]);

  return (
    <div>
      <table {...getTableProps()} className="table" style={{border:'1px solid #EBF2FF'}}>
        <thead>
          {headerGroups.map((headerGroup, index) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id || `header-group-${index}`}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps(enableSorting ? column.getSortByToggleProps() : undefined)} key={column.id} className='py-2'>
                  {column.render('Header')}
                  {enableSorting && (
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? <i className="ms-2 fas fa-sort-down text-muted"></i>
                        : <i className="ms-2 fas fa-sort-up text-muted"></i>
                      : <i className="ms-2 fas fa-sort text-muted"></i>}
                  </span>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.length === 0 ? (
            <tr key="empty-state">
              <td colSpan={columns.length} className="text-center pt-5" style={{height:'300px'}}>
               <p><WindowPlusIcon /></p> 
               <p className='mb-0'>{noDataMesssage}</p> 
               <p style={{color:'#787885', fontSize:'16px'}}>{noDataDescription}</p>
                </td>
            </tr>
          ) : (
          rows.map((row, rowIndex) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={row.id || row.original?.id || `row-${rowIndex}`}>
                {row.cells.map((cell, cellIndex) => (
                  <td {...cell.getCellProps()} key={cell.column.id || `cell-${rowIndex}-${cellIndex}`} >
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })
        )}
        </tbody>
      </table>
      {loading && <div>Loading...</div>}
    </div>
  );
};

export default Table;