import React, { useState } from 'react';
import { Truck, X, CheckCircle2, Store, UserCheck } from 'lucide-react';
import { SalesOrder, DeliveryMode } from '../types';

interface SalesOrderTransportModalProps {
  order: SalesOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    carrier_name: string;
    vehicle_plate: string;
    driver_name: string;
  }) => Promise<void>;
}

export function SalesOrderTransportModal({
  order,
  isOpen,
  onClose,
  onConfirm,
}: SalesOrderTransportModalProps) {
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('PICKUP');
  const [pickupPerson, setPickupPerson] = useState(order?.client_name || '');
  const [carrierName, setCarrierName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalCarrier = 'Retiro en Tienda / Mostrador';
    let finalDriver = pickupPerson.trim() || order.client_name || 'Cliente Directo';
    let finalPlate = 'N/A';

    if (deliveryMode === 'SHIPPING') {
      finalCarrier = carrierName.trim() || 'Flete Propio';
      finalDriver = driverName.trim() || 'Conductor Asignado';
      finalPlate = vehiclePlate.trim().toUpperCase() || 'S/P';
    }

    try {
      await onConfirm({
        carrier_name: finalCarrier,
        vehicle_plate: finalPlate,
        driver_name: finalDriver,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Fijo */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Generar Nota de Entrega
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pedido #{order.document_number} • Modalidad y Datos del Despacho
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {/* Selector de Modalidad */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Modalidad de Entrega
              </label>
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setDeliveryMode('PICKUP')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer shadow-2xs ${
                    deliveryMode === 'PICKUP'
                      ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Store
                    className={`w-5 h-5 mb-1.5 ${
                      deliveryMode === 'PICKUP' ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-bold">Retiro en Tienda / Mostrador</span>
                  <span className="text-[10px] opacity-75 font-medium mt-0.5">
                    Entrega directa al cliente in situ
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMode('SHIPPING')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all cursor-pointer shadow-2xs ${
                    deliveryMode === 'SHIPPING'
                      ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 ring-2 ring-indigo-500/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Truck
                    className={`w-5 h-5 mb-1.5 ${
                      deliveryMode === 'SHIPPING' ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-bold">Envío por Transporte / Flete</span>
                  <span className="text-[10px] opacity-75 font-medium mt-0.5">
                    Despacho con vehículo o carrier
                  </span>
                </button>
              </div>
            </div>

            {/* Campos dinámicos según Modalidad */}
            {deliveryMode === 'PICKUP' ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Datos de Quien Retira en Mostrador</span>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nombre y Cédula de la persona que recibe
                  </label>
                  <input
                    type="text"
                    placeholder={`Ej: ${order.client_name} (Cliente Directo)`}
                    value={pickupPerson}
                    onChange={(e) => setPickupPerson(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Empresa de Transporte / Flete (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: MRW / Flete Interno / Zoom / Tealca"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Placa del Vehículo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: A82-XY9"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Conductor / Cédula
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Pedro Pérez V-14.891.092"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Fijo */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer text-sm shadow-md shadow-emerald-200 active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Generando...' : 'Confirmar y Despachar Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
