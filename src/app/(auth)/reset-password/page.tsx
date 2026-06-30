'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSuccess(false);

    if (!token) {
      setError('Token de recuperación ausente o inválido.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password,
      });

      setIsSuccess(true);
      setIsSubmitting(false);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError('El enlace de recuperación es inválido o ha expirado.');
      } else {
        setError('Ocurrió un error al restablecer la contraseña. Inténtalo de nuevo.');
      }
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Enlace Inválido</h3>
          <p className="text-sm text-slate-500 mt-1">El enlace de recuperación que utilizaste no es válido.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>Falta el token de seguridad. Por favor, solicita un nuevo enlace de recuperación.</span>
        </div>

        <div className="text-center pt-2">
          <Link href="/forgot-password" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Establecer Nueva Contraseña</h3>
        <p className="text-sm text-slate-500 mt-1">Ingresa tu nueva contraseña para recuperar el acceso</p>
      </div>

      {isSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
          <div>
            <p className="font-semibold">¡Contraseña cambiada!</p>
            <p>Tu contraseña ha sido restablecida exitosamente. Redirigiendo al inicio de sesión...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {!isSuccess && (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Nueva Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Confirmar Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                placeholder="Repite la contraseña"
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
                Guardando...
              </>
            ) : (
              <>
                Guardar nueva contraseña
                <ArrowRight className="ml-2 h-4.5 w-4.5" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="text-center pt-2">
        <Link href="/login" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
