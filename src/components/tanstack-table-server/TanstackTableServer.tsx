import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  getCoreRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import TanstackTableComponent from './index';
import PaginationStyleY from './PaginationStyleY';
import SearchFilterDropdown from "./SearchFilterDropdown";

export type pagedType = {
  pageSize: number,
  pageNumber: number,
  totalPages: number,
  previous: boolean,
  next: boolean,
  totalCount: number,
  content: any[],
  hasData: boolean,
};

export interface TanstackTableProps {
  /** Custom height adjustment CSS value */
  heightAdjust?: string;

  /** Column definitions for the table */
  columnsDef?: any;

  /** Paged object containing data and pagination info */
  pagedObj: pagedType;

  /** Callback triggered when rows are changed */
  onRowsChange?: (rows: any[], data?: any) => void;

  /** Enable pagination feature */
  pagination?: boolean;

  /** Number of rows per page */
  limitPerPage?: number;

  /** Fallback component when no data is available */
  whenNoData?: React.ReactNode;

  /** Callback to set selected rows */
  setSelected?: (selectedRows: Set<string | number>) => void;

  /** Callback triggered when sort direction changes */
  callbackSortDirection?: (sortDir: SortingState) => void;

  /** Callback triggered on cell double-click */
  onDoubleClickCell?: (cellData: any) => void;

  /** Callback triggered when page size is selected */
  onSelectPageSize?: (pageSize: number) => void;

  /** Callback triggered when active page changes */
  setActivePage?: (pageIndex: number) => void;

  /** Set of selected row keys */
  selectedRows?: Set<string | number>;

  /** Enable row selection */
  enableRowSelection?: boolean;

  /** Enable column sorting */
  enableSorting?: boolean;

  /** Row height in pixels */
  rowHeight?: number;

  /** Header row height in pixels */
  headerRowHeight?: number;

  /** Custom CSS class for table wrapper */
  className?: string;

  /** Custom CSS styles for table wrapper */
  style?: React.CSSProperties;

  FilterComponent?: React.ReactNode,

  isSortable?: boolean,

  /** Is right sidebar expanded */
  isExpanded?: boolean,

  isSelectAllOpt?: boolean,

  /** Width of the right sidebar when expanded (in pixels) */
  expandedSidebarWidth?: number,

  /** Width of the right sidebar when collapsed (in pixels) */
  collapsedSidebarWidth?: number,

  hasFiltered?: boolean,

  loading?: boolean,
}


/**
 * TanstackTable Component
 * 
 * Feature-rich table component with:
 * - Row selection
 * - Column sorting
 * - Pagination
 * - Cell click handlers
 * - Custom styling
 * - No data fallback
 */
export const TanstackTableServer = (props: TanstackTableProps) => {

  const {
    columnsDef = [],
    pagedObj,
    selectedRows = new Set(),
    pagination = true,
    limitPerPage = 10,
    enableRowSelection = true,
    heightAdjust,
    className,
    style,
    setSelected,
    setActivePage,
    onSelectPageSize,
    callbackSortDirection,
    onDoubleClickCell,
    FilterComponent,
    isSortable,
    isExpanded = false,
    isSelectAllOpt = false,
    expandedSidebarWidth = 300,
    collapsedSidebarWidth = 100,
    hasFiltered = false,
    whenNoData,
    loading = false,
  } = props;

  // State management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(limitPerPage);
  const [localSelectedRows, setLocalSelectedRows] = useState<Set<string | number>>(selectedRows || new Set());
  const [highlightedRowId, setHighlightedRowId] = useState<string | number | null>(null);

  // Data processing
  const tableData = useMemo(() => {
    return pagedObj?.content || [];
  }, [pagedObj?.content]);

  // const totalRecords = useMemo(() => {
  //   return pagedObj?.totalElements || tableData.length;
  // }, [pagedObj?.totalElements, tableData.length]);

  const totalRecords = useMemo(() => {
    return pagedObj?.totalCount;
  }, [pagedObj?.totalCount]);

  const totalPages = useMemo(() => {
    if (pagedObj?.totalPages && pagedObj.totalPages > 0) {
      return pagedObj.totalPages;
    }
    return Math.max(1, Math.ceil((totalRecords || 0) / pageSize));
  }, [pagedObj?.totalPages, totalRecords, pageSize]);

  // Table instance
  const table = useReactTable({
    data: tableData,
    columns: columnsDef,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: pagedObj?.totalPages || -1,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      callbackSortDirection?.(newSorting);
    },
  });

  useEffect(() => {
    const nextPageIndex = Math.max(0, (pagedObj?.pageNumber || 1) - 1);
    if (nextPageIndex !== pageIndex) {
      setPageIndex(nextPageIndex);
    }
  }, [pagedObj?.pageNumber, pageIndex]);

  useEffect(() => {
    const nextPageSize = pagedObj?.pageSize || limitPerPage;
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
    }
  }, [pagedObj?.pageSize, pageSize, limitPerPage]);

  // Event handlers
  const handleRowSelect = useCallback((rowId: string | number, isSelected: boolean) => {
    const newSelectedRows = new Set(localSelectedRows);
    if (isSelected) {
      newSelectedRows.add(rowId);
    } else {
      newSelectedRows.delete(rowId);
    }
    setLocalSelectedRows(newSelectedRows);
    setSelected?.(newSelectedRows);
  }, [localSelectedRows, setSelected]);

  const handleSelectAll = useCallback((isSelected: boolean) => {

    let newSelectedRows: Set<string | number>;
    if (isSelected) {

      newSelectedRows = new Set(tableData.map((row) => row.id));
    } else {

      newSelectedRows = new Set();
    }
    setLocalSelectedRows(newSelectedRows);
    setSelected?.(newSelectedRows);
  }, [tableData, setSelected]);

  const handleCellDoubleClick = useCallback((cellData: any) => {
    // Highlight the row
    setHighlightedRowId(cellData.rowId);
    // Call the callback if provided
    onDoubleClickCell?.(cellData);
  }, [onDoubleClickCell]);

  const handlePageChange = useCallback((newPageIndex: number) => {
    setPageIndex(newPageIndex);
    setActivePage?.(newPageIndex);
  }, [setActivePage]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0);
    onSelectPageSize?.(newPageSize);
  }, [onSelectPageSize]);

  // Generate page numbers with smart pagination around current page
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const windowSize = 2; // Show 2 pages on each side of current page
    const startWindow = Math.max(1, pageIndex + 1 - windowSize);
    const endWindow = Math.min(totalPages, pageIndex + 1 + windowSize);

    // Add first page if not in window
    if (startWindow > 1) {
      pages.push(1);
      if (startWindow > 2) {
        pages.push('...');
      }
    }

    // Add pages in window
    for (let i = startWindow; i <= endWindow; i++) {
      pages.push(i);
    }

    // Add last page if not in window
    if (endWindow < totalPages) {
      if (endWindow < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  }, [pageIndex, totalPages]);

  // Render helpers
  const wrapperStyle: React.CSSProperties = {
    height: heightAdjust,
    overflow: 'auto',
    ...style,
  };

  const tableContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 'calc(100vh - 130px)',
    gap: '0',
  };

  // Calculate dynamic table width based on sidebar expansion
  const tableWidth = useMemo(() => {
    // Current sidebar width based on isExpanded state
    const currentSidebarWidth = isExpanded ? expandedSidebarWidth : collapsedSidebarWidth;

    // Approximate window/viewport width
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

    // Calculate available width: viewport - sidebar - padding/margins
    const availableWidth = viewportWidth - currentSidebarWidth - 32; // 32px for margins

    return `${availableWidth}px`;
  }, [isExpanded, expandedSidebarWidth, collapsedSidebarWidth]);

  const tableContainerStylex: React.CSSProperties = {
    //width: '1638px',
    width: tableWidth,
    transition: 'width 0.3s ease-in-out', // Smooth transition when sidebar expands/collapses
  };

  // No data state
  const hasData = pagedObj.hasData;

  return (
    <div style={wrapperStyle} className={className}>
      <div style={tableContainerStyle}>
        {/* Caption with Filter - OUTSIDE scrollable area to prevent dropdown clipping */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '0px 8px',
          minHeight: '40px',
          flexShrink: 0,
        }} className="dark:border-gray-700">
          {/* Left side - Records info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="page-size" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {totalRecords} record{totalRecords !== 1 ? 's' : ''}
            </label>
            {enableRowSelection && localSelectedRows.size > 0 && (
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                / {localSelectedRows.size} row{localSelectedRows.size !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          {FilterComponent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
              <label htmlFor="label-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter
              </label>
              <SearchFilterDropdown hasFiltered={hasFiltered} FilterComponent={FilterComponent} />
            </div>
          )}
        </div>


        <div
          style={{
            ...tableContainerStylex,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'auto',
          }}>
          <TanstackTableComponent.Table table={table}>

            <TanstackTableComponent.THead
              isSortable={isSortable}
              isSelectAllOpt={isSelectAllOpt}
              onSelectAll={enableRowSelection ? handleSelectAll : undefined}
              selectedRowsCount={localSelectedRows.size}
              totalRowsCount={tableData.length}
            />

            <TanstackTableComponent.TBody
              isSelectAllOpt={isSelectAllOpt}
              selectedRows={localSelectedRows}
              highlightedRowId={highlightedRowId}
              onRowSelect={enableRowSelection ? handleRowSelect : undefined}
              onCellDoubleClick={handleCellDoubleClick}
              whenNoData={whenNoData}
              loading={loading}
            />
          </TanstackTableComponent.Table>
        </div>


        {/* Pagination Controls */}
        {pagination && hasData && (
          <div style={{
            flexShrink: 0,
            width: '100%',
          }} >
            <PaginationStyleY
              handlePageSizeChange={handlePageSizeChange}
              pageSize={pageSize}
              pageIndex={pageIndex}
              totalPages={totalPages}
              pageNumbers={pageNumbers}
              enableRowSelection={enableRowSelection}
              selectedRowsCount={localSelectedRows.size}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div >
  );
};

export default TanstackTableServer;
