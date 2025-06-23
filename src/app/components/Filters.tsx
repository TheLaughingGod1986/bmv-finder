import React from 'react';

interface FiltersProps {
  isLoading: boolean;
  filterDuration: string[];
  setFilterDuration: React.Dispatch<React.SetStateAction<string[]>>;
  filterType: string[];
  setFilterType: React.Dispatch<React.SetStateAction<string[]>>;
}

const Filters: React.FC<FiltersProps> = ({
  isLoading,
  filterDuration,
  setFilterDuration,
  filterType,
  setFilterType,
}) => (
  <fieldset disabled={isLoading} className="flex flex-col sm:flex-row sm:items-start sm:gap-4 gap-2 mb-2 group p-2">
    <div className="flex-1 min-w-[140px]">
      <label className="block text-xs font-semibold text-gray-600 mb-1 group-disabled:opacity-50">Type</label>
      <div className="flex flex-col gap-1">
        <label htmlFor="type-all" className="inline-flex items-center group-disabled:opacity-50 text-gray-800">
          <input type="checkbox" id="type-all" checked={filterDuration.length === 0} onChange={() => setFilterDuration([])} className="mr-1" /> All
        </label>
        <label htmlFor="type-freehold" className="inline-flex items-center group-disabled:opacity-50 text-gray-800">
          <input type="checkbox" id="type-freehold" checked={filterDuration.includes('F')} onChange={() => setFilterDuration((fd: string[]) => fd.includes('F') ? fd.filter(x => x !== 'F') : [...fd, 'F'])} className="mr-1" /> Freehold
        </label>
        <label htmlFor="type-leasehold" className="inline-flex items-center group-disabled:opacity-50 text-gray-800">
          <input type="checkbox" id="type-leasehold" checked={filterDuration.includes('L')} onChange={() => setFilterDuration((fd: string[]) => fd.includes('L') ? fd.filter(x => x !== 'L') : [...fd, 'L'])} className="mr-1" /> Leasehold
        </label>
      </div>
    </div>
    <div className="hidden sm:block w-px bg-gray-200 mx-2 self-stretch" />
    <div className="flex-1 min-w-[180px]">
      <label className="block text-xs font-semibold text-gray-600 mb-1 group-disabled:opacity-50">Property Type</label>
      <div className="flex flex-col gap-1">
        <label htmlFor="prop-all" className="inline-flex items-center group-disabled:opacity-50 text-gray-800">
          <input type="checkbox" id="prop-all" checked={filterType.length === 0} onChange={() => setFilterType([])} className="mr-1" /> All
        </label>
        <label htmlFor="prop-detached" className="inline-flex items-center group-disabled:opacity-50 text-gray-800">
          <input type="checkbox" id="prop-detached" checked={filterType.includes('D')} onChange={() => setFilterType((ft: string[]) => ft.includes('D') ? ft.filter(x => x !== 'D') : [...ft, 'D'])} className="mr-1" /> Detached
        </label>
        <label htmlFor="prop-semi" className="inline-flex items-center group-disabled:opacity-50 text-gray-800">
          <input type="checkbox" id="prop-semi" checked={filterType.includes('S')} onChange={() => setFilterType((ft: string[]) => ft.includes('S') ? ft.filter(x => x !== 'S') : [...ft, 'S'])} className="mr-1" /> Semi-detached
        </label>
        <label htmlFor="prop-terraced" className="inline-flex items-center group-disabled:opacity-50 text-gray-800">
          <input type="checkbox" id="prop-terraced" checked={filterType.includes('T')} onChange={() => setFilterType((ft: string[]) => ft.includes('T') ? ft.filter(x => x !== 'T') : [...ft, 'T'])} className="mr-1" /> Terraced
        </label>
        <label htmlFor="prop-flat" className="inline-flex items-center group-disabled:opacity-50 text-gray-800">
          <input type="checkbox" id="prop-flat" checked={filterType.includes('F')} onChange={() => setFilterType((ft: string[]) => ft.includes('F') ? ft.filter(x => x !== 'F') : [...ft, 'F'])} className="mr-1" /> Flat/Maisonette
        </label>
        <label htmlFor="prop-other" className="inline-flex items-center group-disabled:opacity-50 text-gray-800">
          <input type="checkbox" id="prop-other" checked={filterType.includes('O')} onChange={() => setFilterType((ft: string[]) => ft.includes('O') ? ft.filter(x => x !== 'O') : [...ft, 'O'])} className="mr-1" /> Other
        </label>
      </div>
    </div>
  </fieldset>
);

export default Filters; 