'use client';

import { PropertyType } from '../../../../types/sold-price';

interface FiltersProps {
  propertyType: PropertyType | 'ALL';
  onPropertyTypeChange: (value: PropertyType | 'ALL') => void;
  isLoading: boolean;
}

export default function Filters({
  propertyType,
  onPropertyTypeChange,
  isLoading,
}: FiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div className="w-full">
        <label
          htmlFor="propertyType"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Property Type
        </label>
        <select
          id="propertyType"
          name="propertyType"
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={propertyType}
          onChange={e =>
            onPropertyTypeChange(e.target.value as PropertyType | 'ALL')
          }
          disabled={isLoading}
        >
          <option value="ALL">All</option>
          <option value="D">Detached</option>
          <option value="S">Semi-Detached</option>
          <option value="T">Terraced</option>
          <option value="F">Flats/Maisonettes</option>
          <option value="O">Other</option>
        </select>
      </div>
    </div>
  );
} 