'use client';

import { CompanyProfile } from '@/components/settings/CompanyProfile';
import { CurrencyConfig } from '@/components/settings/CurrencyConfig';

export default function SettingsCompanyPage() {
  return (
    <div className="space-y-6">
      <CompanyProfile />
      
      {/* Currency & Exchange Rate Configurations */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Ajustes de Moneda y Tasa de Cambio</h3>
        <div className="max-w-2xl">
          <CurrencyConfig />
        </div>
      </div>
    </div>
  );
}
