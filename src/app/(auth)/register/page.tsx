'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Briefcase, FileText, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [password, setPassword] = useState('');
  const [taxId, setTaxId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Frontend validation for RIF format ( venezolano: J-12345678-9 o similar )
    const rifRegex = /^[JjVvGgEe]-?\d{8}-?\d$/;
    if (!rifRegex.test(taxId.trim())) {
      setError('Formato de RIF inválido. Debe ser como J-12345678-9');
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
      <div>
        <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Crear Cuenta</h3>
        <p className="text-sm text-slate-500 mt-1">Registra tu empresa y activa tu prueba gratuita de 90 días</p>
      </div>
      
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="font-semibold text-emerald-900">¡Registro Completado!</p>
            <p className="text-xs text-emerald-700 mt-0.5">Tu cuenta ha sido creada con éxito. Redirigiéndote al login...</p>
          </div>
        </div>
      )}

      {!success && (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Nombre Completo del Propietario</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input 
                type="text" 
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                placeholder="Ej. Juan Pérez"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Correo Electrónico</label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Nombre de la Empresa</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input 
                  type="text" 
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                  placeholder="Ej. Comercial Ari, C.A."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">RIF de la Empresa</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input 
                  type="text" 
                  required
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                  placeholder="J-12345678-9"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input 
                type="password" 
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                placeholder="Mínimo 8 caracteres"
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
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Registrando...
              </>
            ) : (
              <>
                Registrar Empresa
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="text-center pt-2">
        <span className="text-sm text-slate-500">¿Ya tienes cuenta? </span>
        <Link href="/login" className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}
