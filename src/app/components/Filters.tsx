import React from 'react';

interface FiltersProps {
  minPrice: number | '';
  maxPrice: number | '';
  setMinPrice: (v: number | '') => void;
  setMaxPrice: (v: number | '') => void;
  priceBounds: { min: number; max: number };
  filterDuration: string[];
  setFilterDuration: (v: string[]) => void;
  filterType: string[];
  setFilterType: (v: string[]) => void;
}

const Filters: React.FC<FiltersProps> = ({
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  priceBounds,
  filterDuration,
  setFilterDuration,
  filterType,
  setFilterType,
}) => (
  <div className="flex flex-wrap gap-4 mb-4">
    {/* Price Filter */}
    <div className="flex flex-col">
      <label className="block text-xs font-semibold text-gray-600 mb-1">Price Range (£)</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="border rounded px-2 py-1 text-sm w-24"
          placeholder={`Min (${priceBounds.min.toLocaleString()})`}
          value={minPrice}
          min={priceBounds.min}
          max={priceBounds.max}
          onChange={e => setMinPrice(e.target.value === '' ? '' : Math.max(priceBounds.min, Number(e.target.value)))}
        />
        <span className="text-gray-500">-</span>
        <input
          type="number"
          className="border rounded px-2 py-1 text-sm w-24"
          placeholder={`Max (${priceBounds.max.toLocaleString()})`}
          value={maxPrice}
          min={priceBounds.min}
          max={priceBounds.max}
          onChange={e => setMaxPrice(e.target.value === '' ? '' : Math.min(priceBounds.max, Number(e.target.value)))}
        />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          step={1000}
          value={minPrice === '' ? priceBounds.min : minPrice}
          onChange={e => setMinPrice(Number(e.target.value))}
          className="w-24"
        />
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max}
          step={1000}
          value={maxPrice === '' ? priceBounds.max : maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          className="w-24"
        />
      </div>
    </div>
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
      <div className="flex flex-col gap-1">
        <label className="inline-flex items-center">
          <input type="checkbox" checked={filterDuration.length === 0} onChange={() => setFilterDuration([])} className="mr-1" /> All
        </label>
        <label className="inline-flex items-center">
          <input type="checkbox" checked={filterDuration.includes('F')} onChange={() => setFilterDuration(fd => fd.includes('F') ? fd.filter(x => x !== 'F') : [...fd, 'F'])} className="mr-1" /> Freehold
        </label>
        <label className="inline-flex items-center">
          <input type="checkbox" checked={filterDuration.includes('L')} onChange={() => setFilterDuration(fd => fd.includes('L') ? fd.filter(x => x !== 'L') : [...fd, 'L'])} className="mr-1" /> Leasehold
        </label>
      </div>
    </div>
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">Property Type</label>
      <div className="flex flex-col gap-1">
        <label className="inline-flex items-center">
          <input type="checkbox" checked={filterType.length === 0} onChange={() => setFilterType([])} className="mr-1" /> All
        </label>
        <label className="inline-flex items-center">
          <input type="checkbox" checked={filterType.includes('D')} onChange={() => setFilterType(ft => ft.includes('D') ? ft.filter(x => x !== 'D') : [...ft, 'D'])} className="mr-1" /> Detached
        </label>
        <label className="inline-flex items-center">
          <input type="checkbox" checked={filterType.includes('S')} onChange={() => setFilterType(ft => ft.includes('S') ? ft.filter(x => x !== 'S') : [...ft, 'S'])} className="mr-1" /> Semi-detached
        </label>
        <label className="inline-flex items-center">
          <input type="checkbox" checked={filterType.includes('T')} onChange={() => setFilterType(ft => ft.includes('T') ? ft.filter(x => x !== 'T') : [...ft, 'T'])} className="mr-1" /> Terraced
        </label>
        <label className="inline-flex items-center">
          <input type="checkbox" checked={filterType.includes('F')} onChange={() => setFilterType(ft => ft.includes('F') ? ft.filter(x => x !== 'F') : [...ft, 'F'])} className="mr-1" /> Flat/Maisonette
        </label>
        <label className="inline-flex items-center">
          <input type="checkbox" checked={filterType.includes('O')} onChange={() => setFilterType(ft => ft.includes('O') ? ft.filter(x => x !== 'O') : [...ft, 'O'])} className="mr-1" /> Other
        </label>
      </div>
    </div>
  </div>
);

export default Filters; 