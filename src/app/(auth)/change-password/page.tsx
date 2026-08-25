'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, CheckCircle2, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/infrastructure/api/api-client';

export default function ChangePasswordPage() {
  const { user, updateUser, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    } else if (!isAuthLoading && user && !user.must_change_password) {
      if (user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, isAuthLoading, router]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Requirements checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = hasMinLength && hasUppercase && hasNumberOrSymbol && isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.post('/auth/change-password', { newPassword });
      setSuccessMessage('¡Contraseña actualizada exitosamente! Redirigiendo...');
      
      updateUser({ must_change_password: false });

      setTimeout(() => {
        if (user?.role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }, 1500);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err?.response?.data?.message || 'No se pudo actualizar la contraseña. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Header Visual */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl mb-4 shadow-2xs">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Actualiza tu contraseña inicial
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 leading-relaxed">
            Por motivos de seguridad, debes cambiar tu clave temporal por una contraseña personal antes de acceder a la plataforma.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                required
                className="w-full pl-11 pr-11 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400 font-medium"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 placeholder-slate-400 font-medium"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            </div>
          </div>

          {/* Checklist de Validación en Tiempo Real (Sally UX Standard) */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Requisitos de Seguridad
            </p>
            <div className="grid grid-cols-1 gap-1.5 text-xs font-semibold">
              <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-700' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>Mínimo 8 caracteres</span>
              </div>
              <div className={`flex items-center gap-2 ${hasUppercase ? 'text-emerald-700' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasUppercase ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>Al menos una letra mayúscula</span>
              </div>
              <div className={`flex items-center gap-2 ${hasNumberOrSymbol ? 'text-emerald-700' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumberOrSymbol ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>Al menos un número o carácter especial</span>
              </div>
              <div className={`flex items-center gap-2 ${isMatch ? 'text-emerald-700' : 'text-slate-400'}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${isMatch ? 'text-emerald-600' : 'text-slate-300'}`} />
                <span>Las contraseñas coinciden</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Guardando cambios...</span>
            ) : (
              <>
                <span>Guardar y Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
