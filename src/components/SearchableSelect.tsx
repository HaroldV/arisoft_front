'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, LucideIcon } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string, selectedOption?: SelectOption) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  icon?: LucideIcon;
  allowCustomInput?: boolean;
  error?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Buscar o seleccionar...',
  disabled = false,
  required = false,
  className = '',
  icon: LeadingIcon,
  allowCustomInput = false,
  error = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  // Find label corresponding to current selected value
  const selectedOption = options.find((o) => o.value === value);

  // Sync internal display value when selectedOption changes
  const displayLabel = selectedOption ? selectedOption.label : (allowCustomInput ? value : '');

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const portalEl = document.getElementById('searchable-select-portal');
        if (portalEl && portalEl.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const labelMatch = o.label.toLowerCase().includes(q);
    const subMatch = o.sublabel ? o.sublabel.toLowerCase().includes(q) : false;
    const valMatch = o.value.toLowerCase().includes(q);
    return labelMatch || subMatch || valMatch;
  });

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value, option);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Trigger Control Element */}
      <div
        ref={triggerRef}
        onClick={() => {
          if (disabled) return;
          if (!isOpen) updatePosition();
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-800 text-sm cursor-pointer transition-all duration-200 ${
          error
            ? 'bg-rose-50/50 border-2 border-rose-500 ring-2 ring-rose-500/20'
            : isOpen
            ? 'bg-white border border-indigo-500 ring-2 ring-indigo-500/20'
            : 'bg-slate-50 border border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
          {LeadingIcon && <LeadingIcon className="w-4 h-4 text-slate-400 shrink-0" />}
          {selectedOption?.icon && <selectedOption.icon className="w-4 h-4 text-indigo-500 shrink-0" />}
          
          <span className={`truncate font-medium ${displayLabel ? 'text-slate-900' : 'text-slate-400'}`}>
            {displayLabel || placeholder}
          </span>
          
          {selectedOption?.badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${selectedOption.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </div>

      {/* Floating Dropdown via Portal escaping modals and overflow */}
      {isOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            id="searchable-select-portal"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden p-2 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100 border-t-2 border-t-indigo-500 max-h-72"
          >
            {/* Embedded Search Input */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Escribe para autocompletar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100/90 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            {/* Options List Scroll Container */}
            <div className="overflow-y-auto max-h-52 divide-y divide-slate-50 space-y-0.5 pr-0.5">
              {allowCustomInput && searchQuery.trim() && !options.some(o => o.label.toLowerCase() === searchQuery.trim().toLowerCase() || o.value.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                <div
                  onClick={() => handleSelect({ value: searchQuery.trim(), label: searchQuery.trim() })}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer bg-indigo-50/90 text-indigo-900 font-semibold text-xs hover:bg-indigo-100 transition-all border border-indigo-100 mb-1"
                >
                  <span>Usar nuevo: <strong>"{searchQuery.trim()}"</strong></span>
                  <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-bold">Usar Nuevo</span>
                </div>
              )}

              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 text-xs ${
                        isSelected
                          ? 'bg-indigo-50/90 text-indigo-900 font-bold'
                          : opt.disabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {opt.icon && <opt.icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />}
                        <div className="flex flex-col truncate">
                          <span className="truncate">{opt.label}</span>
                          {opt.sublabel && (
                            <span className="text-[10px] font-mono text-slate-400 truncate">{opt.sublabel}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {opt.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${opt.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                    </div>
                  );
                })
              ) : !allowCustomInput && (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  No se encontraron coincidencias
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
