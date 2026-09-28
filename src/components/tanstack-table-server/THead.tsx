import { flexRender } from '@tanstack/react-table';
import useTable from './useTable';

interface IProps<T> {
  isSortable?: boolean;
  onSelectAll?: (isSelected: boolean) => void;
  selectedRowsCount?: number;
  totalRowsCount?: number;
  isSelectAllOpt?: boolean;
}

const THead = <T,>({
  isSortable,
  onSelectAll,
  selectedRowsCount = 0,
  totalRowsCount = 0,
  isSelectAllOpt = false,
}: IProps<T>) => {
  const table = useTable();

  const isAllSelected = totalRowsCount > 0 && selectedRowsCount === totalRowsCount;
  const isIndeterminate = selectedRowsCount > 0 && selectedRowsCount < totalRowsCount;

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectAll?.(e.target.checked);
  };

  if (!table) return null;
  return (
    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
      <tr>
        {/* Selection Column Header */}
        {onSelectAll && isSelectAllOpt && (
          <th scope="col" className="px-4 py-3 w-12">
            <div className="flex items-center justify-center h-5">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={handleSelectAllChange}
                className="cursor-pointer w-4 h-4 text-blue-600 rounded"
                aria-label="Select all rows"
              />
            </div>
          </th>
        )}

        {table.getHeaderGroups().map((x) => {
          return x.headers.map((header) => {
            const isSorted = header.column.getIsSorted();
            const isSortEnabled = header.column.getCanSort();
            const columnMeta = header.column.columnDef.meta as any;
            
            // Use explicit width for table cells - more reliable than maxWidth/minWidth
            const thStyle: React.CSSProperties = {
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
              <th key={header.id} scope="col" className="py-3" style={thStyle}>
                {header.isPlaceholder ? null : (
                  <div className="flex">
                    <div
                      className={`flex flex-1 items-center gap-2 ${isSortEnabled ? 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-200' : ''
                        }`}
                      onClick={
                        isSortEnabled
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <span>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </span>
                      {isSortEnabled && (
                        <div className="flex items-center gap-1">
                          {isSorted === 'asc' && (
                            <span><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" data-p-icon="sort-amount-up-alt" className="p-datatable-sort-icon p-icon"><g clip-path="url(#pui_id_95)"><path d="M3.63435 0.19871C3.57113 0.135484 3.49887 0.0903226 3.41758 0.0541935C3.255 -0.0180645 3.06532 -0.0180645 2.90274 0.0541935C2.82145 0.0903226 2.74919 0.135484 2.68597 0.19871L0.427901 2.45677C0.165965 2.71871 0.165965 3.15226 0.427901 3.41419C0.689836 3.67613 1.12338 3.67613 1.38532 3.41419L2.48726 2.31226V13.3226C2.48726 13.6929 2.79435 14 3.16467 14C3.535 14 3.84209 13.6929 3.84209 13.3226V2.31226L4.94403 3.41419C5.07951 3.54968 5.25113 3.6129 5.42274 3.6129C5.59435 3.6129 5.76597 3.54968 5.90145 3.41419C6.16338 3.15226 6.16338 2.71871 5.90145 2.45677L3.64338 0.19871H3.63435ZM13.7685 13.3226C13.7685 12.9523 13.4615 12.6452 13.0911 12.6452H7.22016C6.84984 12.6452 6.54274 12.9523 6.54274 13.3226C6.54274 13.6929 6.84984 14 7.22016 14H13.0911C13.4615 14 13.7685 13.6929 13.7685 13.3226ZM7.22016 8.58064C6.84984 8.58064 6.54274 8.27355 6.54274 7.90323C6.54274 7.5329 6.84984 7.22581 7.22016 7.22581H9.47823C9.84855 7.22581 10.1556 7.5329 10.1556 7.90323C10.1556 8.27355 9.84855 8.58064 9.47823 8.58064H7.22016ZM7.22016 5.87097H7.67177C8.0421 5.87097 8.34919 5.56387 8.34919 5.19355C8.34919 4.82323 8.0421 4.51613 7.67177 4.51613H7.22016C6.84984 4.51613 6.54274 4.82323 6.54274 5.19355C6.54274 5.56387 6.84984 5.87097 7.22016 5.87097ZM11.2847 11.2903H7.22016C6.84984 11.2903 6.54274 10.9832 6.54274 10.6129C6.54274 10.2426 6.84984 9.93548 7.22016 9.93548H11.2847C11.655 9.93548 11.9621 10.2426 11.9621 10.6129C11.9621 10.9832 11.655 11.2903 11.2847 11.2903Z" fill="currentColor"></path></g><defs><clipPath id="url(#pui_id_95)"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg></span>
                          )}
                          {isSorted === 'desc' && (
                            <span>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" data-p-icon="sort-amount-down" className="p-datatable-sort-icon p-icon"><g clip-path="url(#pui_id_94)"><path d="M4.93953 10.5858L3.83759 11.6877V0.677419C3.83759 0.307097 3.53049 0 3.16017 0C2.78985 0 2.48275 0.307097 2.48275 0.677419V11.6877L1.38082 10.5858C1.11888 10.3239 0.685331 10.3239 0.423396 10.5858C0.16146 10.8477 0.16146 11.2813 0.423396 11.5432L2.68146 13.8013C2.74469 13.8645 2.81694 13.9097 2.89823 13.9458C2.97952 13.9819 3.06985 14 3.16017 14C3.25049 14 3.33178 13.9819 3.42211 13.9458C3.5034 13.9097 3.57565 13.8645 3.63888 13.8013L5.89694 11.5432C6.15888 11.2813 6.15888 10.8477 5.89694 10.5858C5.63501 10.3239 5.20146 10.3239 4.93953 10.5858ZM13.0957 0H7.22468C6.85436 0 6.54726 0.307097 6.54726 0.677419C6.54726 1.04774 6.85436 1.35484 7.22468 1.35484H13.0957C13.466 1.35484 13.7731 1.04774 13.7731 0.677419C13.7731 0.307097 13.466 0 13.0957 0ZM7.22468 5.41935H9.48275C9.85307 5.41935 10.1602 5.72645 10.1602 6.09677C10.1602 6.4671 9.85307 6.77419 9.48275 6.77419H7.22468C6.85436 6.77419 6.54726 6.4671 6.54726 6.09677C6.54726 5.72645 6.85436 5.41935 7.22468 5.41935ZM7.6763 8.12903H7.22468C6.85436 8.12903 6.54726 8.43613 6.54726 8.80645C6.54726 9.17677 6.85436 9.48387 7.22468 9.48387H7.6763C8.04662 9.48387 8.35372 9.17677 8.35372 8.80645C8.35372 8.43613 8.04662 8.12903 7.6763 8.12903ZM7.22468 2.70968H11.2892C11.6595 2.70968 11.9666 3.01677 11.9666 3.3871C11.9666 3.75742 11.6595 4.06452 11.2892 4.06452H7.22468C6.85436 4.06452 6.54726 3.75742 6.54726 3.3871C6.54726 3.01677 6.85436 2.70968 7.22468 2.70968Z" fill="currentColor"></path></g><defs><clipPath id="url(#pui_id_94)"><rect width="14" height="14" fill="white"></rect></clipPath></defs></svg>
                            </span>
                          )}
                          {!isSorted && (
                            <i className="fa-solid fa-sort text-gray-400 opacity-50"></i>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </th>
            );
          });
        })}
      </tr>
    </thead>
  );
};

export default THead;
