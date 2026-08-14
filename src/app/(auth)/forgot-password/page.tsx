'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);
    setIsSubmitting(true);

    try {
      await apiClient.post('/auth/forgot-password', {
        email: email.trim(),
      });
      setIsSuccess(true);
      setIsSubmitting(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('El correo electrónico no se encuentra registrado en el sistema.');
      } else {
        setError('Ocurrió un error al intentar enviar el enlace de recuperación. Inténtalo de nuevo.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Recuperar acceso
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 font-medium">
          Ingresa tu email y te enviaremos un enlace de recuperación.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">¡Enlace generado!</p>
              <p>El enlace de restablecimiento ha sido impreso en la consola del backend (Ambiente local).</p>
            </div>
          </div>

          <Link
            href="/login"
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-all duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-rose-700 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-200 text-slate-900 font-medium shadow-2xs"
              placeholder="tu@empresa.com"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-indigo-200 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar enlace de recuperación'
            )}
          </button>
        </form>
      )}

      <div className="text-center pt-2">
        <Link href="/login" className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
