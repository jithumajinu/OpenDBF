import React from 'react';

interface StatusCellProps {
  value: string;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
};

export const StatusCell: React.FC<StatusCellProps> = ({ value }) => {
  const status = value?.toLowerCase() || 'inactive';
  const style = statusStyles[status] || statusStyles.inactive;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};
