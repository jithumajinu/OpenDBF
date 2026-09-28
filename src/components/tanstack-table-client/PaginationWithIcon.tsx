import { useContext, useMemo } from 'react';
import { TableContext } from './Context';

const LeftArrowIcon = () => (
  <svg
    className="fill-current"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.58203 9.99868C2.58174 10.1909 2.6549 10.3833 2.80152 10.53L7.79818 15.5301C8.09097 15.8231 8.56584 15.8233 8.85883 15.5305C9.15183 15.2377 9.152 14.7629 8.85921 14.4699L5.13911 10.7472L16.6665 10.7472C17.0807 10.7472 17.4165 10.4114 17.4165 9.99715C17.4165 9.58294 17.0807 9.24715 16.6665 9.24715L5.14456 9.24715L8.85919 5.53016C9.15199 5.23717 9.15184 4.7623 8.85885 4.4695C8.56587 4.1767 8.09099 4.17685 7.79819 4.46984L2.84069 9.43049C2.68224 9.568 2.58203 9.77087 2.58203 9.99715C2.58203 9.99766 2.58203 9.99817 2.58203 9.99868Z"
      fill=""
    />
  </svg>
);

const RightArrowIcon = () => (
  <svg
    className="fill-current"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M17.4165 9.9986C17.4168 10.1909 17.3437 10.3832 17.197 10.53L12.2004 15.5301C11.9076 15.8231 11.4327 15.8233 11.1397 15.5305C10.8467 15.2377 10.8465 14.7629 11.1393 14.4699L14.8594 10.7472L3.33203 10.7472C2.91782 10.7472 2.58203 10.4114 2.58203 9.99715C2.58203 9.58294 2.91782 9.24715 3.33203 9.24715L14.854 9.24715L11.1393 5.53016C10.8465 5.23717 10.8467 4.7623 11.1397 4.4695C11.4327 4.1767 11.9075 4.17685 12.2003 4.46984L17.1578 9.43049C17.3163 9.568 17.4165 9.77087 17.4165 9.99715C17.4165 9.99763 17.4165 9.99812 17.4165 9.9986Z"
      fill=""
    />
  </svg>
);

export default function PaginationWithIcon() {
  const { table } = useContext(TableContext);

  if (!table) return null;

  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const isFirstPage = !table.getCanPreviousPage();
  const isLastPage = !table.getCanNextPage();

  // Generate page numbers: show first 3, last 3, with ... in between if needed
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    const showPages = 3;
    const ellipsis = '...';

    if (totalPages <= 6) {
      // Show all pages if total is 6 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first 3 pages
      for (let i = 1; i <= showPages; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (showPages + 1 < totalPages - showPages) {
        pages.push(ellipsis);
      }

      // Show last 3 pages
      for (let i = totalPages - showPages + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    }

    return pages;
  }, [totalPages]);

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 sm:justify-between">
      {/* Previous Button */}
      <button
        onClick={() => table.previousPage()}
        disabled={isFirstPage}
        className={`flex items-center gap-2 rounded-lg border border-gray-300 p-2 sm:p-2.5 shadow-theme-xs transition-colors ${
          isFirstPage
            ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
            : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200'
        }`}
      >
        <LeftArrowIcon />
      </button>

      {/* Mobile Page Info */}
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-400 sm:hidden">
        Page {currentPage} of {totalPages}
      </span>

      {/* Page Numbers */}
      <ul className="hidden items-center gap-1 sm:flex">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <li key={`ellipsis-${index}`}>
                <span className="flex items-center justify-center w-10 h-10 text-sm font-medium text-gray-700 dark:text-gray-400">
                  ...
                </span>
              </li>
            );
          }

          const isActive = page === currentPage;
          return (
            <li key={page}>
              <button
                onClick={() => table.setPageIndex((page as number) - 1)}
                className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-gray-700 hover:bg-blue-600 hover:text-white dark:text-gray-400 dark:hover:bg-blue-600 dark:hover:text-white'
                }`}
              >
                {page}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Next Button */}
      <button
        onClick={() => table.nextPage()}
        disabled={isLastPage}
        className={`flex items-center gap-2 rounded-lg border border-gray-300 p-2 sm:p-2.5 shadow-theme-xs transition-colors ${
          isLastPage
            ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
            : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200'
        }`}
      >
        <RightArrowIcon />
      </button>
    </div>
  );
}
