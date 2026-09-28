import { flexRender } from '@tanstack/react-table';
import useTable from './useTable';

interface IProps<T> {
  selectedRows?: Set<string | number>;
  onRowSelect?: (rowId: string | number, isSelected: boolean) => void;
  onCellDoubleClick?: (cellData: any) => void;
  isSelectAllOpt?: boolean;
  highlightedRowId?: string | number | null;
}

const TBody = <T,>({
  selectedRows = new Set(),
  onRowSelect,
  onCellDoubleClick,
  isSelectAllOpt = false,
  highlightedRowId = null,
}: IProps<T>) => {
  const table = useTable();

  const handleRowCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    rowId: string | number
  ) => {
    onRowSelect?.(rowId, e.target.checked);
  };

  const handleCellDoubleClick = (cellData: any) => {
    onCellDoubleClick?.(cellData);
  };

  const tableContainerStyle: React.CSSProperties = {

    minHeight: '100%',

  };

  if (!table) return null;

  if (table.getRowModel().rows.length === 0) {
    return (
      <tbody style={tableContainerStyle}>
        <tr
          key="1"
          className="items-center justify-center transition-colors"
        >
          <td colSpan={7} className="items-center justify-center text-center px-6 py-4 cursor-default text-gray-500 dark:text-gray-400">
            No data available
          </td>
        </tr>
      </tbody>
    );
  }



  //console.log('Rendering TBody with rows:', table.getRowModel().rows.length, 'Selected rows:', selectedRows);

  return (
    <tbody style={tableContainerStyle}>
      {table.getRowModel().rows.map((row) => {
        const rowId = row.original.id;
        // console.log('Rendering row:', rowId, 'Selected:', row);
        // console.log('selectedRows:', selectedRows);
        const isSelected = selectedRows?.has(rowId);
        // const isSelected = selectedRows?.has(rowId);
        //console.log('Rendering x row:', rowId, 'Selected:', isSelected);

        return (
          <tr
            key={row.id}
            className={`border-b transition-colors ${highlightedRowId === rowId
                ? 'bg-blue-50  font-bold dark:bg-blue-900/20 dark:text-white'
                : isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-white dark:bg-gray-900'
              } dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50`}
          >
            {/* Selection Column */}
            {onRowSelect && isSelectAllOpt && (
              <td className="px-4 py-4 w-12">
                <div className="flex items-center justify-center h-5">
                  <input
                    type="checkbox"
                    checked={isSelected || false}
                    onChange={(e) => handleRowCheckboxChange(e, rowId)}
                    className="cursor-pointer w-4 h-4 text-blue-600 rounded"
                    aria-label={`Select row ${rowId}`}
                  />
                </div>
              </td>
            )}

            {/* Data Cells */}
            {row.getVisibleCells().map((cell) => {
              const columnMeta = cell.column.columnDef.meta as any;
              const tdStyle: React.CSSProperties = {
                width: columnMeta?.maxWidth || 'auto',
                minWidth: columnMeta?.minWidth || 'auto',
                maxWidth: columnMeta?.maxWidth || 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                wordBreak: 'break-word',
                paddingRight: '6px',
                paddingLeft: '6px',
              };
              return (
                <td
                  key={cell.id}
                  className="py-4 cursor-default"
                  style={tdStyle}
                  onDoubleClick={() =>
                    handleCellDoubleClick({
                      rowId,
                      cellId: cell.id,
                      value: cell.getValue(),
                      row: row.original,
                    })
                  }
                  title="Double-click to edit"
                >
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
};

export default TBody;
