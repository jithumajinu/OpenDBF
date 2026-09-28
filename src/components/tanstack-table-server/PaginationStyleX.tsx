import React from 'react';

interface PaginationStyleXProps {
  pageIndex: number;
  totalPages: number;
  pageNumbers: (number | string)[];
  enableRowSelection: boolean;
  selectedRowsCount: number;
  onPageChange: (pageIndex: number) => void;
}

const PaginationStyleX: React.FC<PaginationStyleXProps> = ({
  pageIndex,
  totalPages,
  pageNumbers,
  enableRowSelection,
  selectedRowsCount,
  onPageChange,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      {/* Page Info */}
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        {pageIndex + 1} of {totalPages} pages
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onPageChange(0)}
          disabled={pageIndex === 0}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            backgroundColor: pageIndex === 0 ? '#f3f4f6' : '#fff',
            cursor: pageIndex === 0 ? 'not-allowed' : 'pointer',
            color: pageIndex === 0 ? '#9ca3af' : '#374151',
            fontSize: '14px',
          }}
        >
          ← First
        </button>

        <button
          onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
          disabled={pageIndex === 0}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            backgroundColor: pageIndex === 0 ? '#f3f4f6' : '#fff',
            cursor: pageIndex === 0 ? 'not-allowed' : 'pointer',
            color: pageIndex === 0 ? '#9ca3af' : '#374151',
            fontSize: '14px',
          }}
        >
          ← Prev
        </button>

        {/* Page Numbers */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    fontSize: '14px',
                    color: '#6b7280',
                  }}
                >
                  ...
                </span>
              );
            }

            const isActive = page === pageIndex + 1;
            return (
              <button
                key={page}
                onClick={() => onPageChange((page as number) - 1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  border: isActive ? '1px solid #3b82f6' : '1px solid #d1d5db',
                  backgroundColor: isActive ? '#3b82f6' : '#fff',
                  color: isActive ? '#fff' : '#374151',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, pageIndex + 1))}
          disabled={pageIndex >= totalPages - 1}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            backgroundColor: pageIndex >= totalPages - 1 ? '#f3f4f6' : '#fff',
            cursor: pageIndex >= totalPages - 1 ? 'not-allowed' : 'pointer',
            color: pageIndex >= totalPages - 1 ? '#9ca3af' : '#374151',
            fontSize: '14px',
          }}
        >
          Next →
        </button>

        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={pageIndex >= totalPages - 1}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            backgroundColor: pageIndex >= totalPages - 1 ? '#f3f4f6' : '#fff',
            cursor: pageIndex >= totalPages - 1 ? 'not-allowed' : 'pointer',
            color: pageIndex >= totalPages - 1 ? '#9ca3af' : '#374151',
            fontSize: '14px',
          }}
        >
          Last →
        </button>
      </div>

      {/* Selection Info */}
      {enableRowSelection && selectedRowsCount > 0 && (
        <div style={{ fontSize: '14px', color: '#1f2937' }}>
          {selectedRowsCount} row{selectedRowsCount !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};

export default PaginationStyleX;
