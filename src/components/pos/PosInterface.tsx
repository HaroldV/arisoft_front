'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Plus, 
  Trash2, 
  Minus, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  FileText,
  DollarSign,
  Printer,
  ChevronRight,
  X,
  CreditCard,
  Percent,
  Check
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';

interface Product {
  id: string;
  sku: string;
  name: string;
  costUsd: number;
  priceUsd: number;
  taxRate: number;
  current_stock: number;
}

interface Client {
  id: string;
  name: string;
  tax_id: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const PosInterface: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(36.50);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceRangeError, setInvoiceRangeError] = useState<string | null>(null);

  // Quick Client Modal
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', tax_id: '', email: '', phone: '' });
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Checkout Justification Modal
  const [justificationRequired, setJustificationRequired] = useState(false);
  const [justificationText, setJustificationText] = useState('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  // Success Receipt Modal
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsRes, clientsRes, rangesRes] = await Promise.all([
        apiClient.get('/inventory/products'),
        apiClient.get('/clients'),
        apiClient.get('/tenant/fiscal-ranges')
      ]);
      setProducts(productsRes.data);
      setFilteredProducts(productsRes.data);
      setClients(clientsRes.data);

      // Check if invoice range is configured
      const hasInvoiceRange = rangesRes.data.some((r: any) => r.type === 'INVOICE');
      if (!hasInvoiceRange) {
        setInvoiceRangeError(
          '⚠️ Alerta Fiscal: Rango fiscal de facturación no configurado. La empresa debe registrar el rango en Ajustes -> Control Fiscal antes de poder procesar ventas.'
        );
      } else {
        setInvoiceRangeError(null);
      }
    } catch (err: any) {
      setError('Error al iniciar el Punto de Venta. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products locally as user types
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.sku.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => 
      prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.priceUsd * item.quantity), 0);
  const taxAmount = cart.reduce((sum, item) => {
    const itemTotal = item.product.priceUsd * item.quantity;
    const tax = itemTotal * (item.product.taxRate / 100);
    return sum + tax;
  }, 0);
  const totalUsd = subtotal + taxAmount;
  const totalVes = totalUsd * exchangeRate;

  // Client Modal actions
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingClient(true);
    setClientError(null);
    try {
      const res = await apiClient.post('/clients', {
        name: clientForm.name.trim(),
        tax_id: clientForm.tax_id.trim().toUpperCase(),
        email: clientForm.email.trim() || undefined,
        phone: clientForm.phone.trim() || undefined
      });
      // Add newly registered client to state
      setClients(prev => [...prev, res.data]);
      setSelectedClientId(res.data.id);
      setIsClientModalOpen(false);
      setClientForm({ name: '', tax_id: '', email: '', phone: '' });
    } catch (err: any) {
      setClientError(err.response?.data?.message || 'Error al crear el cliente.');
    } finally {
      setIsSavingClient(false);
    }
  };

  // Checkout submission
  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setError(null);
    
    // Check if any cart item goes into negative stock
    let goesNegative = false;
    for (const item of cart) {
      if (item.product.current_stock - item.quantity < 0) {
        goesNegative = true;
        break;
      }
    }

    if (goesNegative) {
      setJustificationRequired(true);
    } else {
      submitSale();
    }
  };

  const submitSale = async () => {
    setIsSubmittingSale(true);
    setError(null);

    const payload = {
      exchangeRateApplied: exchangeRate,
      negativeStockJustification: justificationRequired ? justificationText.trim() : undefined,
      clientId: selectedClientId || undefined,
      items: cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    try {
      const response = await apiClient.post('/sales', payload);
      setCompletedSale({
        id: response.data.saleId,
        invoiceNumber: response.data.invoiceNumber,
        controlNumber: response.data.controlNumber,
        total: totalUsd,
        totalVes,
        items: [...cart],
        client: clients.find(c => c.id === selectedClientId),
        exchangeRate
      });
      setCart([]);
      setSelectedClientId('');
      setJustificationText('');
      setJustificationRequired(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocurrió un error al registrar la venta.');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-slate-50 w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm animate-in fade-in duration-500">
      
      {/* Fiscal Range Warning Banner */}
      {invoiceRangeError && (
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-3 flex items-center gap-3 text-rose-700 text-xs font-bold shrink-0 animate-in slide-in-from-top duration-300">
          <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
          <div className="flex-1">{invoiceRangeError}</div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Left Side: Product catalog and search */}
        <div className="flex-1 flex flex-col bg-white border-r border-slate-200">
          <div className="p-4 border-b border-slate-100 bg-slate-50/30">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar productos por SKU o Nombre..."
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="h-full flex items-center justify-center flex-col gap-2">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                <span className="text-sm text-slate-400 font-semibold">Cargando catálogo...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold">No se encontraron productos disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p) => {
                  const isCritical = p.current_stock <= 5;
                  const isOut = p.current_stock === 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="flex flex-col text-left p-4 rounded-2xl border border-slate-200 hover:border-primary-500 hover:shadow-md transition-all group cursor-pointer bg-white"
                    >
                      <span className="font-mono text-[10px] text-slate-400 font-semibold">{p.sku}</span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1 group-hover:text-primary-700 truncate w-full">{p.name}</h4>
                      
                      <div className="flex items-baseline gap-1 mt-3">
                        <span className="text-sm font-black text-slate-900">${p.priceUsd.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 font-medium">USD</span>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50 w-full text-[11px] font-semibold">
                        <span className={isOut ? 'text-rose-600' : isCritical ? 'text-amber-600' : 'text-emerald-600'}>
                          {isOut ? 'Agotado' : isCritical ? 'Crítico' : 'Disponible'}
                        </span>
                        <span className="text-slate-500">{p.current_stock} un</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart, Client selection and Totals panel */}
        <div className="w-full md:w-100 bg-slate-50/50 flex flex-col">
          {/* Client select block */}
          <div className="p-4 border-b border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cliente de la venta</span>
              <button
                onClick={() => setIsClientModalOpen(true)}
                className="flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Registrar rápido
              </button>
            </div>
            
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="">-- Venta Mostrador (Cliente Genérico) --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.tax_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400 font-semibold">Tasa de Cambio (VES/USD)</span>
              <input
                type="number"
                step="0.01"
                className="w-20 text-right text-xs font-bold text-slate-700 border border-slate-200 rounded px-1.5 py-0.5"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Cart Items list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              Carrito ({cart.reduce((sum, i) => sum + i.quantity, 0)})
            </h3>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                El carrito de compra está vacío
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-800 text-sm truncate">{item.product.name}</h5>
                      <span className="text-xs font-medium text-primary-600">${item.product.priceUsd.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 hover:bg-slate-100 text-rose-500 rounded ml-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals panel */}
          <div className="p-4 bg-white border-t border-slate-200 space-y-3">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="text-xs text-slate-500 space-y-1.5 border-b border-slate-100 pb-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impuesto (IVA)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline py-1">
              <span className="text-sm font-bold text-slate-800">Total Venta</span>
              <div className="text-right">
                <div className="text-xl font-black text-slate-900">${totalUsd.toFixed(2)}</div>
                <div className="text-xs font-semibold text-slate-500">{(totalVes).toLocaleString('es-VE')} Bs.</div>
              </div>
            </div>

            <button
              onClick={handleCheckoutClick}
              disabled={cart.length === 0 || isSubmittingSale || !!invoiceRangeError}
              className={`w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl shadow-lg transition-all ${
                invoiceRangeError 
                  ? 'bg-rose-500/80 cursor-not-allowed opacity-60 shadow-rose-500/10' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10 hover:shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isSubmittingSale ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Procesando Pago...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  PAGAR / FACTURAR
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Quick Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in scale-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Registrar Cliente Rápido</h3>
              <button onClick={() => setIsClientModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="p-6 space-y-4">
              {clientError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{clientError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="block w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Cédula o RIF</label>
                <input
                  type="text"
                  required
                  placeholder="V-12345678"
                  className="block w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={clientForm.tax_id}
                  onChange={(e) => setClientForm({ ...clientForm, tax_id: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    className="block w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Teléfono</label>
                  <input
                    type="text"
                    className="block w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingClient}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {isSavingClient && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />}
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Justification Modal */}
      {justificationRequired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3 text-amber-600">
              <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">Alerta de Existencias en Negativo</h4>
                <p className="text-xs text-slate-500">
                  La transacción provocará niveles de stock negativos en el sistema. Debes ingresar una justificación contable para poder emitir el recibo.
                </p>
              </div>
            </div>

            <textarea
              required
              rows={3}
              placeholder="Justifica el motivo del stock negativo (Ej: Mercancía en góndola pendiente por ingresar factura física)..."
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
              value={justificationText}
              onChange={(e) => setJustificationText(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setJustificationRequired(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitSale}
                disabled={!justificationText.trim() || isSubmittingSale}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
              >
                {isSubmittingSale && <Loader2 className="animate-spin h-3.5 w-3.5" />}
                Autorizar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in scale-in duration-200">
            <div className="p-6 text-center border-b border-slate-100 bg-emerald-50/50">
              <div className="p-3 bg-emerald-100 rounded-full text-emerald-600 w-fit mx-auto mb-3">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="font-black text-emerald-950 text-base">¡VENTA COMPLETA!</h3>
              <div className="mt-2 text-[10px] text-emerald-700 font-mono font-bold space-y-0.5 bg-emerald-50 py-1.5 px-3 rounded-lg inline-block">
                <div>Factura: {completedSale.invoiceNumber}</div>
                <div>Control: {completedSale.controlNumber}</div>
              </div>
            </div>

            {/* Receipt layout */}
            <div className="p-6 space-y-4 text-xs font-mono text-slate-700">
              <div className="border-b border-dashed border-slate-200 pb-2 space-y-1">
                <p className="flex justify-between">
                  <span>Factura Nro:</span>
                  <span className="font-bold">{completedSale.invoiceNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span>Nro. Control:</span>
                  <span className="font-bold">{completedSale.controlNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-bold">{completedSale.client?.name || 'Cliente Genérico'}</span>
                </p>
                {completedSale.client && (
                  <p className="flex justify-between">
                    <span>RIF/C.I.:</span>
                    <span>{completedSale.client.tax_id}</span>
                  </p>
                )}
                <p className="flex justify-between text-[10px] text-slate-400">
                  <span>Fecha:</span>
                  <span>{new Date().toLocaleString()}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                {completedSale.items.map((item: CartItem, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate max-w-44">{item.product.name} (x{item.quantity})</span>
                    <span>${(item.product.priceUsd * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-200 pt-2 space-y-1.5 text-right font-bold text-slate-900">
                <div className="flex justify-between text-slate-700 font-normal">
                  <span>Subtotal:</span>
                  <span>${completedSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span>TOTAL USD:</span>
                  <span>${completedSale.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold text-[11px]">
                  <span>TOTAL VES:</span>
                  <span>{completedSale.totalVes.toLocaleString('es-VE')} Bs.</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex gap-2 border-t border-slate-100">
              <button
                onClick={() => { window.print(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-bold text-slate-700 text-xs transition-colors cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-950 rounded-xl font-bold text-white text-xs transition-colors cursor-pointer"
              >
                Cerrar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
