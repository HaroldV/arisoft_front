'use client';

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/infrastructure/api/api-client';

function LoginContent() {
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get('registered') === 'true';

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      const { user, access_token } = response.data;
      login(user, access_token);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Credenciales inválidas. Por favor intenta de nuevo.');
      } else {
        setError('Ocurrió un error al intentar iniciar sesión. Verifica tu conexión.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Iniciar Sesión</h3>
        <p className="text-sm text-slate-500 mt-1">Ingresa tus datos para acceder al panel</p>
      </div>
      
      {isRegistered && !error && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <span>¡Empresa registrada con éxito! Inicia sesión para comenzar tu periodo de prueba.</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
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

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500/20 border-slate-300 rounded-lg" />
            <label className="ml-2 block text-xs font-medium text-slate-600">Recordarme</label>
          </div>
          <Link href="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg shadow-primary-600/10 hover:shadow-primary-600/20 mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4.5 w-4.5 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              Entrar al Sistema
              <ArrowRight className="ml-2 h-4.5 w-4.5" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <span className="text-sm text-slate-500">¿No tienes cuenta? </span>
        <Link href="/register" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
          Regístrate ahora
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
