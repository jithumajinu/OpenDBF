import { useState, useRef, useEffect, ReactNode } from "react";

interface DropdownItem {
  label: string;
  href?: string;
  value?: string;
  icon?: ReactNode;
}

interface ActionDropdownProps {
  trigger: ReactNode;
  handleOnClick?: (value: string) => void;
  items: DropdownItem[];
  cssStyle?: React.CSSProperties;
  className?: string;  // if no class right to left, if need left to right : className="right-0 top-full mt-1"
}

export default function ActionDropdown({ trigger, items, handleOnClick, cssStyle, className }: ActionDropdownProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Changed from w-44 (176px) to w-56 (224px). You can use other widths like w-48, w-52, w-60, w-64, or w-72 for different sizes.

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setDropdownOpen(!dropdownOpen)}>
        {trigger}
      </div>

      {dropdownOpen && (
        // <div className="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-48 dark:bg-gray-700">
        // <div className={`absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700 ${className ? ` ${className}` : ''}`}
        <div className={`absolute z-50 bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700 ${className ? ` ${className}` : ''}`}
          {...(cssStyle && { style: cssStyle })}
        >
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
            {items.map((item, index) => (
              <li key={index}>
                <a
                  {...(item.href && { href: item.href })}
                  onClick={() => {
                    handleOnClick?.(item.value || "");
                    setDropdownOpen(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer"
                >
                  {item.icon} {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}