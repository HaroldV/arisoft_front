'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Check, ChevronDown } from 'lucide-react';
import { MARACAIBO_ZULIA_SECTORS, LocationSector } from '@/constants/zulia-locations';

interface SectorAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const SectorAutocompleteInput: React.FC<SectorAutocompleteInputProps> = ({
  value,
  onChange,
  required = false,
  placeholder = 'Ej. 5 de Julio, San Jacinto, La Coromoto...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query with external value prop
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter sectors based on input text
  const cleanQuery = query.trim().toLowerCase();
  const suggestions = cleanQuery.length > 0
    ? MARACAIBO_ZULIA_SECTORS.filter(s =>
        s.name.toLowerCase().includes(cleanQuery) ||
        s.municipality.toLowerCase().includes(cleanQuery)
      ).slice(0, 8)
    : MARACAIBO_ZULIA_SECTORS.slice(0, 8);

  const handleSelect = (sector: LocationSector) => {
    const formatted = `${sector.name} (${sector.municipality})`;
    setQuery(formatted);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
        <input
          type="text"
          required={required}
          value={query}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Autocomplete Dropdown Menu (Sally Enterprise UX Standard) */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-900/10 p-1.5 max-h-56 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
            <span>Sectores y Barrios Sugeridos</span>
            <span className="font-normal text-[9px] text-slate-400">Zulia</span>
          </div>

          {suggestions.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500">
              <span>Sector personalizado: </span>
              <strong className="text-slate-800 font-semibold font-mono">"{query}"</strong>
            </div>
          ) : (
            suggestions.map((sector, idx) => {
              const formattedName = `${sector.name} (${sector.municipality})`;
              const isSelected = query.trim().toLowerCase() === formattedName.toLowerCase() || query.trim().toLowerCase() === sector.name.toLowerCase();

              return (
                <button
                  key={`${sector.municipality}-${sector.name}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(sector)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="truncate">{sector.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono">
                      {sector.municipality}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
