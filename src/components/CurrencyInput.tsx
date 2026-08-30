'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, LucideIcon } from 'lucide-react';

export interface CurrencyInputProps {
  value: number | string | undefined | null;
  onChange: (numericValue: number) => void;
  currencyPrefix?: string; // '$', 'Bs.', '€', '%'
  icon?: LucideIcon;
  placeholder?: string;
  decimals?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
  autoFocus?: boolean;
  error?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currencyPrefix = '$',
  icon: Icon = DollarSign,
  placeholder = '0.00',
  decimals = 2,
  min = 0,
  max,
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  autoFocus = false,
  error = false,
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const isFocused = useRef(false);

  // Sync internal display value when external value changes and input is not being actively typed
  useEffect(() => {
    if (!isFocused.current) {
      if (value === undefined || value === null || value === '' || Number.isNaN(Number(value))) {
        setDisplayValue('');
      } else {
        const num = Number(value);
        setDisplayValue(num === 0 ? '' : num.toString());
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Normalizar coma a punto
    let normalized = raw.replace(/,/g, '.');

    // Permitir solo dígitos y como máximo un punto decimal
    normalized = normalized.replace(/[^0-9.]/g, '');
    const parts = normalized.split('.');
    if (parts.length > 2) {
      normalized = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    // Limitar cantidad de decimales
    if (parts.length === 2 && parts[1].length > decimals) {
      normalized = `${parts[0]}.${parts[1].substring(0, decimals)}`;
    }

    setDisplayValue(normalized);

    // Parse numeric value to notify parent
    if (normalized === '' || normalized === '.') {
      onChange(0);
    } else {
      const parsed = parseFloat(normalized);
      if (!Number.isNaN(parsed)) {
        if (max !== undefined && parsed > max) {
          onChange(max);
        } else if (min !== undefined && parsed < min) {
          onChange(min);
        } else {
          onChange(parsed);
        }
      }
    }
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (displayValue.trim() !== '') {
      const parsed = parseFloat(displayValue);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setDisplayValue(parsed.toFixed(decimals));
        onChange(parsed);
      } else {
        setDisplayValue('');
        onChange(0);
      }
    } else {
      setDisplayValue('');
      onChange(0);
    }
  };

  const hasIcon = Boolean(Icon);

  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400">
          <Icon className="h-4.5 w-4.5" />
        </div>
      )}

      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`block w-full ${
          hasIcon ? 'pl-11' : 'pl-3.5'
        } ${currencyPrefix ? 'pr-12' : 'pr-3.5'} py-2.5 border rounded-xl text-sm font-medium transition-all duration-200 outline-none ${
          error
            ? 'border-rose-300 ring-2 ring-rose-500/20 bg-rose-50/20 text-rose-900 focus:border-rose-500'
            : 'border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder-slate-400'
        } ${disabled ? 'opacity-60 bg-slate-100 cursor-not-allowed' : ''} ${className}`}
      />

      {currencyPrefix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <span className="text-[11px] font-bold text-slate-400 font-mono bg-slate-100/90 px-1.5 py-0.5 rounded-md border border-slate-200/60">
            {currencyPrefix}
          </span>
        </div>
      )}
    </div>
  );
};
