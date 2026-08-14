'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Lock } from 'lucide-react';
import { RifValidator } from '@/utils/rif-validator';

export interface RifInputProps {
  value: string;
  onChange: (formattedRif: string, isValid: boolean) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const RifInput: React.FC<RifInputProps> = ({
  value,
  onChange,
  label = 'RIF de la Empresa',
  required = false,
  disabled = false,
  className = '',
  id = 'rif-input',
}) => {
  const [prefix, setPrefix] = useState<'J' | 'V' | 'E' | 'G' | 'P'>('J');
  const [number, setNumber] = useState('');
  const [digit, setDigit] = useState('');
  const [isValid, setIsValid] = useState<boolean>(false);

  // Parse & Sync internal state when parent value changes or clears
  useEffect(() => {
    if (!value) {
      setNumber('');
      setDigit('');
      setIsValid(false);
      return;
    }

    const clean = value.toUpperCase().replace(/[^VJGEP0-9]/g, '');
    if (clean.length > 0) {
      const p = clean.charAt(0);
      if (['J', 'V', 'E', 'G', 'P'].includes(p)) {
        setPrefix(p as any);
      }
      if (clean.length > 1) {
        const body = clean.substring(1);
        if (body.length < 9) {
          setNumber(body);
        } else {
          setNumber(body.substring(0, body.length - 1));
          setDigit(body.charAt(body.length - 1));
        }
      }
    }
  }, [value]);

  // Ultra-fluid handler: Permite cualquier longitud numérica (1 a 9 dígitos) sin trabas
  const processRifChange = (newPrefix: 'J' | 'V' | 'E' | 'G' | 'P', newNum: string) => {
    setPrefix(newPrefix);
    const cleanNum = newNum.replace(/\D/g, '').slice(0, 9); // Hasta 9 dígitos
    setNumber(cleanNum);

    if (!cleanNum) {
      setDigit('');
      setIsValid(false);
      onChange('', false);
      return;
    }

    // Si tiene entre 1 y 9 dígitos, siempre auto-calculamos el dígito verificador y emitimos estado válido
    const calculated = RifValidator.calculateChecksumDigit(newPrefix, cleanNum);
    const calcDigitStr = calculated !== null ? String(calculated) : '0';
    setDigit(calcDigitStr);

    // Formatear automáticamente agregando ceros a la izquierda si el usuario escribió menos de 8 dígitos (ej: 1234567 -> 01234567)
    const paddedNum = cleanNum.padStart(8, '0').slice(-8);
    const formattedRif = `${newPrefix}-${paddedNum}-${calcDigitStr}`;
    
    // Considerar válido si tiene al menos 5 dígitos principales (cédulas/RIFs venezolanos van desde 5 dígitos)
    const validState = cleanNum.length >= 5;
    setIsValid(validState);
    onChange(formattedRif, validState);
  };

  // Handler inteligente para PEGAR RIFs completos desde portapapeles
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text').trim().toUpperCase();
    const clean = pastedText.replace(/[^VJGEP0-9]/g, '');

    if (clean.length >= 2) {
      e.preventDefault();
      const p = clean.charAt(0);
      const newPrefix = ['J', 'V', 'E', 'G', 'P'].includes(p) ? (p as any) : prefix;
      const body = clean.substring(1).replace(/\D/g, '').slice(0, 9);
      processRifChange(newPrefix, body);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {isValid && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-200/80 shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              RIF Válido
            </span>
          )}
        </div>
      )}

      {/* Input Unificado Ultra Fluido */}
      <div className={`flex items-center w-full h-[42px] px-3 border rounded-xl bg-slate-50/50 transition-all duration-200 ${
        isValid
          ? 'border-emerald-400 bg-white ring-2 ring-emerald-500/20'
          : 'border-slate-200 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20'
      } ${disabled ? 'opacity-60 bg-slate-100 cursor-not-allowed' : ''}`}>
        
        {/* 1. Selector de Tipo (Pill Dropdown) */}
        <select
          value={prefix}
          disabled={disabled}
          onChange={(e) => processRifChange(e.target.value as any, number)}
          className="bg-slate-200/80 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-2 py-1 rounded-lg outline-none cursor-pointer border-none shrink-0"
        >
          <option value="J">J-</option>
          <option value="V">V-</option>
          <option value="E">E-</option>
          <option value="G">G-</option>
          <option value="P">P-</option>
        </select>

        {/* 2. Campo Numérico Único y Libre */}
        <div className="relative flex-1 flex items-center ml-2">
          <FileText className="h-4 w-4 text-slate-400 shrink-0 mr-2 pointer-events-none" />
          <input
            id={id}
            type="text"
            inputMode="numeric"
            disabled={disabled}
            placeholder="Ej. 12345678"
            value={number}
            onPaste={handlePaste}
            onChange={(e) => processRifChange(prefix, e.target.value)}
            className="w-full bg-transparent font-mono font-bold text-slate-900 text-sm placeholder-slate-400 outline-none border-none"
          />
        </div>

        {/* 3. Cápsula de Dígito Autocalculado SENIAT */}
        <div className="shrink-0 flex items-center gap-1 pl-2 border-l border-slate-200" title="Dígito verificador generado automáticamente">
          <Lock className="w-3 h-3 text-slate-400" />
          <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md min-w-[20px] text-center">
            {digit || '—'}
          </span>
        </div>
      </div>
    </div>
  );
};
