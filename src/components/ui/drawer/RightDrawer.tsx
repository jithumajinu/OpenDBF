import React, { useRef, useEffect } from 'react';
import Button from "@components/ui/button/Button";
interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string; // e.g., '400px', '500px', '50%'
  showCloseButton?: boolean;
  title?: string;
  closeOnBackdropClick?: boolean; // Default: false (don't close when clicking outside)
  footerComponent?: boolean; // New prop to control footer visibility
}

export const RightDrawer: React.FC<RightDrawerProps> = ({
  isOpen,
  onClose,
  children,
  width = '600px',
  showCloseButton = true,
  title,
  closeOnBackdropClick = false,
  footerComponent = false,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => closeOnBackdropClick && onClose()}
          style={{
            zIndex: 99999,
            transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col overflow-hidden"
        style={{
          width: width,
          maxWidth: '100%',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 100000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky z-99 top-0 flex items-center justify-between p-1 lg:p-4 border-b border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-700 bg-white ">
          {title && (
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {title}
            </h2>
          )}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="ml-auto flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        {footerComponent && (
          <div className="flex items-center justify-end w-full gap-3 p-4 lg:px-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
            <Button size="sm">
              Edit Contact
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default RightDrawer;
