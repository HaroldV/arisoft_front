'use client';

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/infrastructure/api/api-client';

function LoginContent() {
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get('registered') === 'true';
  const isReset = searchParams.get('reset') === 'true';

  useEffect(() => {
    if (user) {
      if (user.must_change_password) {
        router.push('/change-password');
      } else if (user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim(),
        password,
      });

      const { user, access_token, refresh_token } = response.data;
      login(user, access_token, refresh_token);
    } catch (err: any) {
      const serverMessage = err.response?.data?.message;
      if (serverMessage) {
        setError(serverMessage);
      } else if (err.response?.status === 401) {
        setError('Correo electrónico o contraseña incorrectos. Por favor verifica tus datos.');
      } else if (err.response?.status === 429) {
        setError('Demasiados intentos de conexión. Por favor espera unos minutos antes de intentar de nuevo.');
      } else {
        setError('Ocurrió un error al intentar iniciar sesión. Verifica tu conexión con el servidor.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header del Formulario */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Bienvenido de nuevo
        </h2>
        <p className="text-sm text-slate-500 mt-1.5 font-medium">
          Ingresa tus credenciales para entrar a tu espacio de trabajo.
        </p>
      </div>

      {isRegistered && !error && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>¡Empresa registrada con éxito! Inicia sesión para comenzar a gestionar tu negocio.</span>
        </div>
      )}

      {isReset && !error && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>¡Contraseña restablecida con éxito! Inicia sesión con tu nueva clave.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-rose-700 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Email Field */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-200 text-slate-900 font-medium shadow-2xs"
              placeholder="tu@empresa.com"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-4 pr-11 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-200 text-slate-900 font-medium shadow-2xs"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Links & Checkbox */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center cursor-pointer">
            <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500/20 border-slate-300 rounded-md" />
            <span className="ml-2 text-xs font-semibold text-slate-600">Recordarme</span>
          </label>
          <Link href="/forgot-password" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-indigo-200 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              Iniciar sesión
              <ArrowRight className="ml-2 h-4.5 w-4.5" />
            </>
          )}
        </button>

        {/* Link a Registro */}
        <p className="text-center text-xs font-medium text-slate-500 pt-2">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
            Registra tu empresa aquí
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
