'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Search, ChevronDown, Check } from 'lucide-react';

export interface ClientOption {
  id?: string;
  name: string;
  tax_id?: string;
}

interface ClientComboboxProps {
  value: string;
  onChange: (value: string, selectedClient?: ClientOption) => void;
  clients: ClientOption[];
  placeholder?: string;
  required?: boolean;
}

export default function ClientCombobox({
  value,
  onChange,
  clients,
  placeholder = 'Buscar o ingresar cliente...',
  required = false,
}: ClientComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  const updatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
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
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        const portalEl = document.getElementById(`client-combobox-portal`);
        if (portalEl && portalEl.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients.filter((c) => {
    const q = value.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (c.name || '').toLowerCase().includes(q);
    const taxMatch = (c.tax_id || '').toLowerCase().includes(q);
    return nameMatch || taxMatch;
  });

  const handleSelect = (client: ClientOption) => {
    onChange(client.name, client);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          required={required}
          placeholder={placeholder}
          value={value}
          onFocus={() => {
            updatePosition();
            setIsOpen(true);
          }}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val);
            updatePosition();
            setIsOpen(true);
          }}
          className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium"
        />
        <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 pointer-events-none" />
        <button
          type="button"
          onClick={() => {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }}
          className="absolute right-2.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Floating Dropdown via Portal outside modal overflow */}
      {isOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            id="client-combobox-portal"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white rounded-xl border border-slate-100 shadow-2xl max-h-56 overflow-y-auto p-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {filteredClients.length > 0 ? (
              filteredClients.map((c, idx) => {
                const isSelected = value.toLowerCase().trim() === (c.name || '').toLowerCase().trim();
                return (
                  <div
                    key={c.id || idx}
                    onClick={() => handleSelect(c)}
                    className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/80 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                        {c.tax_id && (
                          <span className="inline-block mt-0.5 font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {c.tax_id}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center">
                <p className="text-xs text-slate-500 font-medium">No se encontraron clientes guardados.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Puedes ingresar un cliente personalizado libremente.</p>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
