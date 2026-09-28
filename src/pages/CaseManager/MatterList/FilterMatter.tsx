import React, { useState } from 'react';
import Button from '@components/ui/button/Button';

interface FilterMatterProps {
  onApplyFilter?: (filters: FilterValues) => void;
  filterObj?: FilterValues;
}

export interface FilterValues {
  matterName: string;
  clientType: string;
}

export default function FilterMatter({ onApplyFilter, filterObj }: FilterMatterProps) {
  const [filters, setFilters] = useState<FilterValues>({
    matterName: filterObj?.matterName || '',
    clientType: filterObj?.clientType || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilter = () => {
    onApplyFilter?.(filters);
  };

  const handleResetFilter = () => {
    const resetFilters: FilterValues = {
      matterName: '',
      clientType: '',
    };
    setFilters(resetFilters);
    onApplyFilter?.(resetFilters);
  };

  return (
    <div className="flex flex-col gap-4 z-10">
      <div className="flex flex-col gap-3">
        {/* Matter Name Filter */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="matterName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Matter Name
          </label>
          <input
            id="matterName"
            type="text"
            name="matterName"
            value={filters.matterName}
            onChange={handleInputChange}
            placeholder="Search by matter name..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {/* Client Type Filter */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="clientType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Client Type
          </label>
          <input
            id="clientType"
            type="text"
            name="clientType"
            value={filters.clientType}
            onChange={handleInputChange}
            placeholder="Search by client type..."
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          variant="primary"
          onClick={handleApplyFilter}
          className="flex-1 text-sm"
        >
          Apply Filter
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleResetFilter}
          className="flex-1 text-sm"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

