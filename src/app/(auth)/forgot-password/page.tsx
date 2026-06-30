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
        <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Recuperar Acceso</h3>
        <p className="text-sm text-slate-500 mt-1">Te enviaremos un enlace para restablecer tu contraseña</p>
      </div>

      {isSuccess ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">¡Solicitud recibida!</p>
              <p>Hemos procesado tu solicitud. Dado que este es un ambiente local, el enlace de restablecimiento ha sido impreso en la consola del backend.</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-600 space-y-2">
            <span className="font-semibold block text-slate-700">Pasos siguientes:</span>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Abre tu terminal del backend.</li>
              <li>Busca la sección <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">🔑 PASSWORD RESET LINK REQUESTED</code>.</li>
              <li>Copia y pega la URL en tu navegador para cambiar la contraseña.</li>
            </ol>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                placeholder="juan@empresa.com"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg shadow-primary-600/10 hover:shadow-primary-600/20 mt-2"
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
        <Link href="/login" className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
