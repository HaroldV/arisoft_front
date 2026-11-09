'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Search, ChevronDown, Check, Plus, Building2, Phone } from 'lucide-react';
import { QuotationClient } from '../types';

interface ClientAutocompleteInputProps {
  value: string;
  clients: QuotationClient[];
  onSelectClient: (client: QuotationClient) => void;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const ClientAutocompleteInput: React.FC<ClientAutocompleteInputProps> = ({
  value,
  clients,
  onSelectClient,
  onChangeText,
  placeholder = 'Buscar por RIF, Cédula o Razón Social...'
}) => {
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        const portalEl = document.getElementById('quotation-client-autocomplete-portal');
        if (portalEl && portalEl.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const query = value.trim().toLowerCase();
  const filteredClients = clients.filter((c) => {
    if (!query) return true;
    const nameMatch = (c.name || '').toLowerCase().includes(query);
    const taxMatch = (c.tax_id || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(query.replace(/[^a-z0-9]/g, ''));
    const phoneMatch = (c.phone || '').toLowerCase().includes(query);
    return nameMatch || taxMatch || phoneMatch;
  });

  const handleSelect = (client: QuotationClient) => {
    onSelectClient(client);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onFocus={() => {
            updatePosition();
            setIsOpen(true);
          }}
          onChange={(e) => {
            onChangeText(e.target.value);
            updatePosition();
            setIsOpen(true);
          }}
          className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs placeholder:text-slate-400"
        />
        <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
        <button
          type="button"
          onClick={() => {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }}
          className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            id="quotation-client-autocomplete-portal"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-h-60 overflow-y-auto p-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150 custom-scrollbar"
          >
            {filteredClients.length > 0 ? (
              filteredClients.map((c) => {
                const isSelected = (c.tax_id && c.tax_id.toLowerCase() === query) || (c.name.toLowerCase() === query);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {c.tax_id && (
                            <span className="font-mono text-[10px] text-slate-600 font-bold bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {c.tax_id}
                            </span>
                          )}
                          {c.phone && (
                            <span className="text-[10px] text-slate-400 font-mono truncate">
                              📞 {c.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center">
                <p className="text-xs text-slate-600 font-bold">Cliente no encontrado en el sistema.</p>
                <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                  ✨ Los datos que ingreses se guardarán automáticamente como nuevo cliente.
                </p>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
