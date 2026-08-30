'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, RotateCcw, ChevronDown, Check, Layers } from 'lucide-react';
import { STOCK_LEVEL_FILTERS, StockLevelFilter } from '@/constants/domain-constants';
import { SearchFieldScope, SortField, SortOrder } from '../types/stock.types';

interface StockFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  searchField: SearchFieldScope;
  setSearchField: (val: SearchFieldScope) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  uniqueCategories: string[];
  stockFilter: StockLevelFilter;
  setStockFilter: (val: StockLevelFilter) => void;
  taxFilter: string;
  sortField: SortField;
  sortOrder: SortOrder;
  totalProductsCount: number;
  filteredProductsCount: number;
  onResetFilters: () => void;
}

export const StockFilterBar: React.FC<StockFilterBarProps> = ({
  search,
  setSearch,
  searchField,
  setSearchField,
  selectedCategory,
  setSelectedCategory,
  uniqueCategories,
  stockFilter,
  setStockFilter,
  taxFilter,
  sortField,
  sortOrder,
  totalProductsCount,
  filteredProductsCount,
  onResetFilters,
}) => {
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const scopeDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (scopeDropdownRef.current && !scopeDropdownRef.current.contains(e.target as Node)) {
        setScopeDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFiltered = 
    Boolean(search) || 
    selectedCategory !== 'ALL' || 
    stockFilter !== STOCK_LEVEL_FILTERS.ALL || 
    taxFilter !== 'ALL' || 
    sortField !== 'name' || 
    sortOrder !== 'asc';

  const scopeLabels: Record<SearchFieldScope, string> = {
    ALL: 'Todo el Catálogo',
    SKU: 'Solo SKU',
    NAME: 'Solo Nombre',
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Search Box with Custom Dropdown Selector */}
        <div className="flex-1 flex items-center bg-slate-50/80 rounded-2xl p-1.5 border border-slate-200/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-2xs">
          
          {/* Custom Scope Dropdown */}
          <div className="relative shrink-0" ref={scopeDropdownRef}>
            <button
              type="button"
              onClick={() => setScopeDropdownOpen(!scopeDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/80 hover:bg-indigo-50/60 hover:border-indigo-200 hover:text-indigo-700 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs select-none"
            >
              <span>{scopeLabels[searchField]}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${scopeDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
            </button>

            {scopeDropdownOpen && (
              <div className="absolute z-50 left-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-900/10 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Buscar por:
                </div>
                {(['ALL', 'SKU', 'NAME'] as SearchFieldScope[]).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => {
                      setSearchField(scope);
                      setScopeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      searchField === scope
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{scopeLabels[scope]}</span>
                    {searchField === scope && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input Field */}
          <div className="flex-1 flex items-center pl-2.5 pr-2">
            <Search className="h-4.5 w-4.5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder={
                searchField === 'SKU'
                  ? 'Buscar por código SKU exacto o parcial...'
                  : searchField === 'NAME'
                  ? 'Buscar por nombre del producto...'
                  : 'Buscar por SKU o Nombre...'
              }
              className="w-full py-1.5 bg-transparent text-sm font-medium outline-none text-slate-900 placeholder-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                title="Borrar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Category Dropdown & Reset */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 min-w-[220px]" ref={categoryDropdownRef}>
            <button
              type="button"
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-300 rounded-2xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs select-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <div className="flex items-center gap-2 truncate">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">
                  {selectedCategory === 'ALL'
                    ? `Todas las Categorías (${uniqueCategories.length})`
                    : selectedCategory}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${categoryDropdownOpen ? 'rotate-180 text-indigo-600' : ''}`} />
            </button>

            {categoryDropdownOpen && (
              <div className="absolute z-50 right-0 top-full mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-900/10 p-1.5 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Filtrar por Departamento:
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setCategoryDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>📁 Todas las Categorías</span>
                  {selectedCategory === 'ALL' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>

                {uniqueCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    {selectedCategory === cat && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer shrink-0 shadow-2xs"
              title="Limpiar todos los filtros"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Pill Filters for Stock Levels */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Nivel de Stock:
          </span>
          <button
            onClick={() => setStockFilter(STOCK_LEVEL_FILTERS.ALL)}
            className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer border ${
              stockFilter === STOCK_LEVEL_FILTERS.ALL
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos ({totalProductsCount})
          </button>
          <button
            onClick={() => setStockFilter(STOCK_LEVEL_FILTERS.IN_STOCK)}
            className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer border ${
              stockFilter === STOCK_LEVEL_FILTERS.IN_STOCK
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
            }`}
          >
            Disponible (&gt; 10)
          </button>
          <button
            onClick={() => setStockFilter(STOCK_LEVEL_FILTERS.LOW_STOCK)}
            className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer border ${
              stockFilter === STOCK_LEVEL_FILTERS.LOW_STOCK
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70'
            }`}
          >
            Stock Bajo (1-10)
          </button>
          <button
            onClick={() => setStockFilter(STOCK_LEVEL_FILTERS.OUT_OF_STOCK)}
            className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer border ${
              stockFilter === STOCK_LEVEL_FILTERS.OUT_OF_STOCK
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70'
            }`}
          >
            Sin Stock (0)
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Mostrando <span className="font-bold text-slate-900">{filteredProductsCount}</span> de <span className="font-bold text-slate-900">{totalProductsCount}</span> productos
        </div>
      </div>
    </div>
  );
};
