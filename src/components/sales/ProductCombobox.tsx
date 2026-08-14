'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check } from 'lucide-react';

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  priceUsd?: number;
  price_usd?: number;
}

interface ProductComboboxProps {
  value: string;
  onChange: (value: string, selectedProduct?: CatalogProduct) => void;
  products: CatalogProduct[];
  placeholder?: string;
  required?: boolean;
}

export default function ProductCombobox({
  value,
  onChange,
  products,
  placeholder = 'Buscar o ingresar producto...',
  required = false,
}: ProductComboboxProps) {
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
        width: Math.max(rect.width, 320),
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
        const portalEl = document.getElementById(`product-combobox-portal`);
        if (portalEl && portalEl.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = products.filter((p) => {
    const q = value.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const skuMatch = (p.sku || '').toLowerCase().includes(q);
    return nameMatch || skuMatch;
  });

  const handleSelect = (product: CatalogProduct) => {
    onChange(product.name, product);
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
          className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium"
        />
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
        <button
          type="button"
          onClick={() => {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }}
          className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Floating Dropdown via Portal outside modal overflow */}
      {isOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            id="product-combobox-portal"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white rounded-xl border border-slate-100 shadow-2xl max-h-56 overflow-y-auto p-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const isSelected = value.toLowerCase().trim() === (p.name || '').toLowerCase().trim();
                const price = Number(p.priceUsd ?? p.price_usd ?? 0);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/80 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="shrink-0 font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {p.sku}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                        ${Number(price || 0).toFixed(2)}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center">
                <p className="text-xs text-slate-500 font-medium">Sin coincidencias en catálogo.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Puedes dejar la descripción libre escrita.</p>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
