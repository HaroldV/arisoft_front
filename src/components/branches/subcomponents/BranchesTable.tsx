'use client';

import React from 'react';
import { Building2, Warehouse, Edit2, Trash2, CheckCircle, XCircle, Star } from 'lucide-react';
import { BranchItem } from '../types';

interface BranchesTableProps {
  branches: BranchItem[];
  onEdit: (branch: BranchItem) => void;
  onDelete: (id: string) => void;
}

export const BranchesTable: React.FC<BranchesTableProps> = ({
  branches,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-4 px-6">Código</th>
              <th className="py-4 px-6">Nombre de Sucursal</th>
              <th className="py-4 px-6">Almacén Vinculado</th>
              <th className="py-4 px-6">Contacto / Dirección</th>
              <th className="py-4 px-6 text-center">Tipo</th>
              <th className="py-4 px-6 text-center">Estado</th>
              <th className="py-4 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {branches.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-600 text-sm">No hay sucursales registradas</p>
                  <p className="text-xs text-slate-400">Crea la primera sucursal para tu comercio físico.</p>
                </td>
              </tr>
            ) : (
              branches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-slate-900 text-xs">
                    {b.code}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{b.name}</span>
                        {b.is_main && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 mt-0.5">
                            <Star className="w-2.5 h-2.5 fill-indigo-600" /> Sede Principal
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {b.default_warehouse ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{b.default_warehouse.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        Sin Almacén Asignado
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600">
                    <span className="block font-medium">{b.phone || 'Sin teléfono'}</span>
                    <span className="block text-slate-400 text-[11px] truncate max-w-[200px]">
                      {b.address || 'Sin dirección especificada'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {b.is_main ? (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        Principal
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        Secundaria
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {b.is_active ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Activa
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-slate-400" /> Inactiva
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(b)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 cursor-pointer"
                        title="Editar Sucursal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!b.is_main && (
                        <button
                          type="button"
                          onClick={() => onDelete(b.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200 cursor-pointer"
                          title="Eliminar Sucursal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
