import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Lock,
  Upload,
  Globe,
  Phone,
  Mail,
  Receipt
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { useAuth } from '@/context/AuthContext';
import { RifInput } from '@/components/RifInput';

interface TenantProfile {
  id?: string;
  company_name: string;
  tax_id: string;
  commercial_name: string;
  fiscal_address: string;
  phone: string;
  email: string;
  taxpayer_type: 'ORDINARY' | 'SPECIAL' | 'FORMAL';
  is_withholding_agent: boolean;
  logo_url: string;
  receipt_footer: string;
  hasIssuedInvoices: boolean;
}

export const CompanyProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TenantProfile>({
    company_name: '',
    tax_id: '',
    commercial_name: '',
    fiscal_address: '',
    phone: '',
    email: '',
    taxpayer_type: 'ORDINARY',
    is_withholding_agent: false,
    logo_url: '',
    receipt_footer: '',
    hasIssuedInvoices: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isOwner = user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';
  const hasEditAccess = isOwner || isManager;
  const isFiscalLocked = profile.hasIssuedInvoices;

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get('/tenant/profile');
      setProfile(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener la información de la empresa.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const validateRif = (rif: string): boolean => {
    const cleaned = rif.trim().toUpperCase();
    return /^[JVRG]-[0-9]{8}-[0-9]$/.test(cleaned);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setValidationError(null);

    if (!profile.company_name.trim()) {
      setValidationError('La Razón Social Legal es obligatoria.');
      return;
    }

    if (!profile.tax_id.trim()) {
      setValidationError('El RIF es obligatorio.');
      return;
    }

    if (!validateRif(profile.tax_id)) {
      setValidationError('El RIF debe tener un formato válido (Ej. J-12345678-9).');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        company_name: profile.company_name.trim(),
        tax_id: profile.tax_id.trim().toUpperCase(),
        commercial_name: profile.commercial_name.trim(),
        fiscal_address: profile.fiscal_address.trim(),
        phone: profile.phone.trim(),
        email: profile.email.trim(),
        taxpayer_type: profile.taxpayer_type,
        is_withholding_agent: profile.taxpayer_type === 'SPECIAL' ? profile.is_withholding_agent : false,
        logo_url: profile.logo_url.trim(),
        receipt_footer: profile.receipt_footer.trim()
      };

      await apiClient.put('/tenant/profile', payload);
      setSuccess('Perfil de la empresa actualizado correctamente.');
      fetchProfile();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setValidationError(err.response?.data?.message || 'Ocurrió un error al guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center flex-col gap-2">
        <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Cargando información de la empresa...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header aligned with AGENTS.md */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-3">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Perfil de la Empresa</h1>
            <p className="text-xs text-slate-500">Configure los datos fiscales del emisor ante el SENIAT, logotipo y datos de contacto de su negocio.</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800 text-sm animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-950">¡Guardado con Éxito!</p>
            <p className="text-xs text-emerald-700 mt-0.5">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700 text-sm animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-950">Error al Cargar</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Lock alert for fiscal identifiers */}
      {isFiscalLocked && isOwner && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3 text-amber-800 text-xs animate-in fade-in duration-200">
          <Lock className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-bold text-amber-950">Campos Fiscales Inmutables</p>
            <p className="text-amber-700 mt-0.5">Se han detectado facturas emitidas en el sistema. Para garantizar la consistencia legal ante el SENIAT, la Razón Social y el RIF han sido bloqueados y no pueden ser editados.</p>
          </div>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Fiscal Data */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Receipt className="h-4 w-4 text-indigo-500" />
              Identificación Legal y Fiscal
            </h3>

            {validationError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2 text-rose-700 text-xs animate-in fade-in duration-200">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Razón Social */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Razón Social Legal *</span>
                  {isFiscalLocked && <span className="text-[9px] text-amber-500 font-semibold flex items-center gap-0.5"><Lock className="h-2.5 w-2.5" /> Bloqueado</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isFiscalLocked || !isOwner}
                    placeholder="Ej. Inversiones Ari Soft, C.A."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-75 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all text-sm font-semibold"
                    value={profile.company_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </div>
              </div>

              {/* RIF con Validación SENIAT */}
              <RifInput
                value={profile.tax_id}
                disabled={isFiscalLocked || !isOwner}
                required
                label="Registro de Información Fiscal (RIF)"
                onChange={(formattedRif) => {
                  setProfile(prev => ({ ...prev, tax_id: formattedRif }));
                }}
              />

              {/* Nombre Comercial */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nombre Comercial (Marca)</label>
                <input
                  type="text"
                  disabled={!hasEditAccess}
                  placeholder="Ej. Ari Soft Tienda"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 transition-all text-sm"
                  value={profile.commercial_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, commercial_name: e.target.value }))}
                />
              </div>

              {/* Tipo de Contribuyente */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tipo de Contribuyente (SENIAT) *</label>
                <select
                  disabled={!isOwner}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 transition-all text-sm"
                  value={profile.taxpayer_type}
                  onChange={(e) => setProfile(prev => ({ ...prev, taxpayer_type: e.target.value as any }))}
                >
                  <option value="ORDINARY">Contribuyente Ordinario</option>
                  <option value="SPECIAL">Contribuyente Especial (Designado)</option>
                  <option value="FORMAL">Contribuyente Formal</option>
                </select>
              </div>

              {/* Agente de Retención (Visible condicionalmente si es Especial) */}
              {profile.taxpayer_type === 'SPECIAL' && (
                <div className="flex items-center justify-between p-3.5 bg-indigo-50/30 border border-indigo-100/50 rounded-xl animate-in slide-in-from-top duration-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">¿Es Agente de Retención de IVA?</p>
                    <p className="text-[10px] text-slate-500">Habilita la leyenda legal obligatoria en los tickets fiscales.</p>
                  </div>
                  <button
                    type="button"
                    disabled={!isOwner}
                    onClick={() => setProfile(prev => ({ ...prev, is_withholding_agent: !prev.is_withholding_agent }))}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-50 ${profile.is_withholding_agent ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform transform absolute top-1 ${profile.is_withholding_agent ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )}

              {/* Dirección Fiscal */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Domicilio / Dirección Fiscal *</label>
                <textarea
                  rows={3}
                  disabled={!isOwner}
                  placeholder="Ej. Av. Francisco de Miranda, Edificio Parque Cristal, Piso 4, Oficina 4-B, Municipio Chacao, Caracas."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 transition-all text-sm resize-none"
                  value={profile.fiscal_address}
                  onChange={(e) => setProfile(prev => ({ ...prev, fiscal_address: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact & Brand */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-indigo-500" />
              Contacto y Marca del Negocio
            </h3>

            {/* Logotipo de la Empresa */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Enlace del Logotipo (URL)</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  disabled={!hasEditAccess}
                  placeholder="Ej. https://miservidor.com/imagenes/logo.png"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 transition-all text-sm font-mono text-xs"
                  value={profile.logo_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, logo_url: e.target.value }))}
                />
              </div>
              {profile.logo_url && (
                <div className="mt-2.5 p-2 border border-slate-100 rounded-xl flex items-center gap-3 bg-slate-50/50">
                  <img src={profile.logo_url} alt="Previsualización" className="h-10 w-10 object-contain rounded border bg-white" onError={(e)=>{(e.target as any).style.display='none'}} />
                  <span className="text-[10px] text-slate-500 font-semibold truncate max-w-xs">Vista previa cargada correctamente</span>
                </div>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Teléfono Administrativo</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  disabled={!hasEditAccess}
                  placeholder="Ej. 0212-9999999 / 0412-1111111"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 transition-all text-sm font-semibold"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Correo Electrónico */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Correo de Facturación</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  disabled={!hasEditAccess}
                  placeholder="Ej. facturacion@minegocio.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 transition-all text-sm font-semibold"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            {/* Mensaje de pie de página del ticket */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mensaje de Pie de Factura / Ticket</label>
              <textarea
                rows={3}
                disabled={!hasEditAccess}
                placeholder="Ej. Gracias por su preferencia. No se aceptan devoluciones después de 48 horas. Garantía válida con factura original."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 transition-all text-sm resize-none"
                value={profile.receipt_footer}
                onChange={(e) => setProfile(prev => ({ ...prev, receipt_footer: e.target.value }))}
              />
            </div>
          </div>

          {/* Action buttons (Footer of forms) */}
          {hasEditAccess && (
            <div className="pt-4 border-t border-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={fetchProfile}
                disabled={isSaving}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium rounded-xl transition-all cursor-pointer text-sm disabled:opacity-50"
              >
                Revertir
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 cursor-pointer text-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Perfil'
                )}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
