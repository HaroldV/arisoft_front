'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { RifInput } from '@/components/RifInput';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [taxId, setTaxId] = useState('');
  const [isRifValid, setIsRifValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!isRifValid) {
      setError('El RIF de la empresa es inválido según la verificación del SENIAT (ej. J-12345678-9).');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifica.');
      setIsSubmitting(false);
      return;
    }

    try {
      await apiClient.post('/auth/register', {
        email: email.trim(),
        companyName: companyName.trim(),
        ownerName: ownerName.trim(),
        password,
        taxId: taxId.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 3000);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Ocurrió un error al registrar la empresa. Verifica tu conexión.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all flex items-center justify-center"
          title="Volver al inicio de sesión"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Crear tu empresa
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Registra tu negocio y comienza tu periodo de prueba.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-rose-700 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-bold text-sm">¡Registro Completado!</p>
            <p className="text-xs text-emerald-700 mt-0.5">Tu cuenta ha sido creada con éxito. Redirigiéndote al inicio de sesión...</p>
          </div>
        </div>
      )}

      {!success && (
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Propietario */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nombre del Propietario
            </label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-200 text-slate-900 font-medium shadow-2xs"
              placeholder="Ej. Juan Pérez"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Corporativo
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-200 text-slate-900 font-medium shadow-2xs"
              placeholder="juan@empresa.com"
            />
          </div>

          {/* Empresa y RIF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Nombre de Empresa
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-200 text-slate-900 font-medium shadow-2xs"
                placeholder="Ej. Comercial Ari, C.A."
              />
            </div>

            <RifInput
              value={taxId}
              required
              label="RIF Fiscal"
              onChange={(formattedRif, isValid) => {
                setTaxId(formattedRif);
                setIsRifValid(isValid);
              }}
            />
          </div>

          {/* Contraseñas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-4 pr-11 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-200 text-slate-900 font-medium shadow-2xs"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-4 pr-11 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-200 text-slate-900 font-medium shadow-2xs"
                  placeholder="Repite la contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-indigo-200 cursor-pointer mt-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4.5 w-4.5" />
                Registrando...
              </>
            ) : (
              <>
                Crear Empresa y Comenzar
                <ArrowRight className="ml-2 h-4.5 w-4.5" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="text-center pt-2">
        <span className="text-xs font-medium text-slate-500">¿Ya tienes cuenta? </span>
        <Link href="/login" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  );
}
