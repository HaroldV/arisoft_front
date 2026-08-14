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
  Check,
  UserCheck
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { useAuth } from '@/context/AuthContext';

interface Product {
  id: string;
  sku: string;
  name: string;
  costUsd: number;
  priceUsd: number;
  taxRate: number;
  current_stock: number;
  image_url?: string;
  imageUrl?: string;
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
  const { user } = useAuth();
  const canApplyDiscount = user?.role === 'OWNER' || (user?.permissions || []).includes('pos:discount');

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(36.50);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceRangeError, setInvoiceRangeError] = useState<string | null>(null);

  // Quick Client Modal
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', tax_id: '', email: '', phone: '' });
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Checkout Justification and Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH_VES');
  const [justificationText, setJustificationText] = useState('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  // Success Receipt Modal
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [companyProfile, setCompanyProfile] = useState<any | null>(null);

  // Cash Shifts states
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [suggestedOpeningUsd, setSuggestedOpeningUsd] = useState(0.00);
  const [suggestedOpeningVes, setSuggestedOpeningVes] = useState(0.00);
  const [openingBalanceUsd, setOpeningBalanceUsd] = useState(0.00);
  const [openingBalanceVes, setOpeningBalanceVes] = useState(0.00);
  const [isOpeningShift, setIsOpeningShift] = useState(false);

  // Close shift states
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [declaredCashUsd, setDeclaredCashUsd] = useState(0.00);
  const [declaredCashVes, setDeclaredCashVes] = useState(0.00);
  const [isClosingShift, setIsClosingShift] = useState(false);

  // Split payments states
  interface SalePaymentLine {
    paymentMethod: string;
    amountOriginal: number;
    currency: string;
    transactionReference?: string;
  }
  const [paymentLines, setPaymentLines] = useState<SalePaymentLine[]>([
    { paymentMethod: 'CASH_USD', amountOriginal: 0.00, currency: 'USD' }
  ]);
  const [changeCurrency, setChangeCurrency] = useState<'USD' | 'VES'>('USD');

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsRes, clientsRes, rangesRes, profileRes, activeShiftRes] = await Promise.all([
        apiClient.get('/inventory/products').catch((err) => { console.error('Products fetch error:', err); return { data: [] }; }),
        apiClient.get('/clients').catch((err) => { console.error('Clients fetch error:', err); return { data: [] }; }),
        apiClient.get('/tenant/fiscal-ranges').catch((err) => { console.error('Ranges fetch error:', err); return { data: [] }; }),
        apiClient.get('/tenant/profile').catch(() => null),
        apiClient.get('/pos/shifts/active').catch((err) => { console.error('Active shift check error:', err); return { data: { active: false } }; })
      ]);

      const productList = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.items || []);
      setProducts(productList);
      setFilteredProducts(productList);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      if (profileRes && profileRes.data) {
        setCompanyProfile(profileRes.data);
        const settings = profileRes.data.settings || {};
        const rate = settings.exchangeRate || Number(settings.manualRate) || 36.50;
        setExchangeRate(rate);
      }

      if (activeShiftRes.data && activeShiftRes.data.active) {
        setActiveShift(activeShiftRes.data.shift);
      } else {
        setActiveShift(null);
        if (user?.role === 'CASHIER') {
          setSuggestedOpeningUsd(activeShiftRes.data?.suggestedOpeningUsd || 0.00);
          setSuggestedOpeningVes(activeShiftRes.data?.suggestedOpeningVes || 0.00);
          setOpeningBalanceUsd(activeShiftRes.data?.suggestedOpeningUsd || 0.00);
          setOpeningBalanceVes(activeShiftRes.data?.suggestedOpeningVes || 0.00);
          setIsShiftModalOpen(true);
        }
      }

      // Check if invoice range is configured
      const ranges = Array.isArray(rangesRes.data) ? rangesRes.data : [];
      const hasInvoiceRange = ranges.some((r: any) => r.type === 'INVOICE');
      if (!hasInvoiceRange) {
        setInvoiceRangeError(
          '⚠️ Alerta Fiscal: Rango fiscal de facturación no configurado. La empresa debe registrar el rango en Ajustes -> Control Fiscal antes de poder procesar ventas.'
        );
      } else {
        setInvoiceRangeError(null);
      }
    } catch (err: any) {
      console.error('POS Init Error:', err);
      setError('Error al iniciar el Punto de Venta. Por favor reintenta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpeningShift(true);
    setError(null);
    try {
      const response = await apiClient.post('/pos/shifts/open', {
        openingBalanceUsd,
        openingBalanceVes,
      });
      setActiveShift(response.data);
      setIsShiftModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al abrir el turno de caja.');
    } finally {
      setIsOpeningShift(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Filter products locally as user types
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter(p => 
          (p.name || '').toLowerCase().includes(q) || 
          (p.sku || '').toLowerCase().includes(q)
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
  const discountAmount = subtotal * (discountPercent / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = cart.reduce((sum, item) => {
    const itemTotal = item.product.priceUsd * item.quantity;
    const itemDiscount = itemTotal * (discountPercent / 100);
    const itemTax = (itemTotal - itemDiscount) * (item.product.taxRate / 100);
    return sum + itemTax;
  }, 0);
  const totalUsd = discountedSubtotal + taxAmount;
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
    setPaymentLines([
      { paymentMethod: 'CASH_USD', amountOriginal: totalUsd, currency: 'USD' }
    ]);
    setIsConfirmModalOpen(true);
  };

  const getTotalsFromLines = () => {
    let paidUsd = 0.00;
    paymentLines.forEach(line => {
      if (line.currency === 'USD') {
        paidUsd += Number(line.amountOriginal || 0);
      } else {
        paidUsd += Number(line.amountOriginal || 0) / exchangeRate;
      }
    });
    return paidUsd;
  };

  const submitSale = async () => {
    setIsSubmittingSale(true);
    setError(null);

    let goesNegative = false;
    for (const item of cart) {
      if (item.product.current_stock - item.quantity < 0) {
        goesNegative = true;
        break;
      }
    }

    if (goesNegative && !justificationText.trim()) {
      setError('La justificación de stock en negativo es obligatoria.');
      setIsSubmittingSale(false);
      return;
    }

    const paidUsd = getTotalsFromLines();
    const remainingUsd = totalUsd - paidUsd;

    if (remainingUsd > 0.01) {
      setError('El total pagado no cubre el monto de la venta.');
      setIsSubmittingSale(false);
      return;
    }

    // Validate electronic payment lines contain a reference
    for (let i = 0; i < paymentLines.length; i++) {
      const line = paymentLines[i];
      const isElectronic = ['PAGO_MOVIL', 'TRANSFERENCIA', 'TARJETA_DEBITO', 'TARJETA_CREDITO'].includes(line.paymentMethod);
      if (isElectronic && !line.transactionReference?.trim()) {
        setError(`El pago #${i + 1} (${line.paymentMethod}) requiere una referencia de transacción.`);
        setIsSubmittingSale(false);
        return;
      }
    }

    const payments = paymentLines.map(line => ({
      paymentMethod: line.paymentMethod,
      amountOriginal: Number(line.amountOriginal || 0),
      currency: line.currency,
      transactionReference: line.transactionReference || undefined,
    }));

    const change = remainingUsd < -0.01 ? {
      amountOriginal: Number((Math.abs(remainingUsd) * (changeCurrency === 'VES' ? exchangeRate : 1)).toFixed(2)),
      currency: changeCurrency
    } : undefined;

    const payload = {
      exchangeRateApplied: exchangeRate,
      negativeStockJustification: goesNegative ? justificationText.trim() : undefined,
      clientId: selectedClientId || undefined,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      paymentMethod: paymentLines[0]?.paymentMethod || 'CASH_USD',
      payments,
      change,
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
        discountPercent,
        discountAmount,
        items: [...cart],
        client: clients.find(c => c.id === selectedClientId),
        exchangeRate,
        paymentMethod: paymentLines[0]?.paymentMethod || 'CASH_USD'
      });
      setCart([]);
      setSelectedClientId('');
      setDiscountPercent(0);
      setJustificationText('');
      setIsConfirmModalOpen(false);
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
                  const rawUrl = p.image_url || p.imageUrl;
                  const resolvedUrl = rawUrl
                    ? (rawUrl.startsWith('http') || rawUrl.startsWith('data:') ? rawUrl : `http://localhost:4000${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`)
                    : null;

                  const n = (p.name || '').toLowerCase();
                  const sampleImg = n.includes('papel') || n.includes('resma') ? 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop'
                    : n.includes('tinta') || n.includes('cartucho') || n.includes('hp') ? 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&auto=format&fit=crop'
                    : n.includes('boligrafo') || n.includes('marcador') || n.includes('solita') ? 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&auto=format&fit=crop'
                    : n.includes('harina') || n.includes('pan') ? 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop'
                    : n.includes('cafe') || n.includes('bebida') ? 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop'
                    : n.includes('rif') || n.includes('documento') ? 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400&auto=format&fit=crop'
                    : 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&auto=format&fit=crop';

                  const imgUrl = resolvedUrl || sampleImg;

                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="flex flex-col text-left p-3.5 rounded-2xl border border-slate-200 hover:border-primary-500 hover:shadow-md transition-all group cursor-pointer bg-white overflow-hidden"
                    >
                      <div className="w-full h-24 rounded-xl overflow-hidden mb-2.5 bg-slate-100 border border-slate-100 flex items-center justify-center shrink-0">
                        <img
                          src={imgUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold">{p.sku}</span>
                      <h4 className="font-bold text-slate-800 text-sm mt-0.5 group-hover:text-primary-700 truncate w-full">{p.name}</h4>
                      
                      <div className="flex flex-col mt-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-black text-slate-900">${p.priceUsd.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 font-medium">USD</span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 font-mono mt-0.5">
                          Bs. {(p.priceUsd * exchangeRate).toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-slate-100 w-full text-[11px] font-semibold">
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
          {/* Active Cashier Shift Banner */}
          <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cajero en Turno</span>
              <span className="text-xs font-bold text-slate-800">{user?.full_name || 'Cajero'}</span>
            </div>
            {activeShift && (
              <button
                type="button"
                onClick={() => {
                  setDeclaredCashUsd(0);
                  setDeclaredCashVes(0);
                  setIsCloseShiftModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100/80 active:bg-rose-200 rounded-xl transition-all cursor-pointer"
              >
                Cerrar Turno
              </button>
            )}
          </div>

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
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-semibold text-primary-600">${item.product.priceUsd.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({(item.product.priceUsd * exchangeRate).toFixed(2)} Bs.)</span>
                      </div>
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

              {/* Discount selection row */}
              <div className="flex justify-between items-center py-1">
                <span className="flex items-center gap-1">
                  <Percent className="h-3 w-3 text-slate-400" /> Descuento (%)
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={!canApplyDiscount}
                    className="w-12 text-right text-xs font-bold text-slate-700 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:bg-slate-100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                  />
                  {!canApplyDiscount && (
                    <span className="text-[9px] text-slate-400 font-semibold italic">Bloqueado</span>
                  )}
                </div>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Descuento ({discountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

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

      {/* Quick Client Modal (Sally Enterprise UX Standard) */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Registrar Cliente Rápido
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Alta express de cliente para facturación en caja POS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveClient} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {clientError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2 shadow-2xs">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{clientError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Razón Social / Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Distribuidora Comercial Los Andes C.A."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    RIF o Cédula de Identidad <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. J-30948192-0 o V-18392019"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold"
                    value={clientForm.tax_id}
                    onChange={(e) => setClientForm({ ...clientForm, tax_id: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="facturacion@empresa.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={clientForm.email}
                      onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      placeholder="0414-1234567"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingClient}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSavingClient && <Loader2 className="animate-spin h-4 w-4" />}
                  <span>{isSavingClient ? 'Registrando...' : 'Registrar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation & Payment Method Modal (Sally Enterprise UX Standard) */}
      {isConfirmModalOpen && (() => {
        const goesNegative = cart.some(item => item.product.current_stock - item.quantity < 0);
        const selectedClient = clients.find(c => c.id === selectedClientId);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              
              {/* Header Fijo */}
              <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/30 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Confirmar y Finalizar Venta
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Verificación de montos, método de pago y stock fiscal
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  title="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Center Body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* Luminous Summary Banner */}
                <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/95 border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Total USD</span>
                      <div className="font-mono font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                        ${totalUsd.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-4 shadow-2xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1">Total VES</span>
                      <div className="font-mono font-black text-xl sm:text-2xl text-indigo-700 tracking-tight">
                        Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>Tasa Aplicada:</span>
                    <span className="font-mono font-bold">Bs. {exchangeRate.toFixed(2)} / USD</span>
                  </div>
                </div>

                {/* Formulario / Inputs */}
                <div className="space-y-4">
                  {/* Split Payments Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Métodos de Pago Fraccionados (Máx. 3) <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        disabled={paymentLines.length >= 3}
                        onClick={() => {
                          const paid = getTotalsFromLines();
                          const remaining = Math.max(0, totalUsd - paid);
                          setPaymentLines([...paymentLines, {
                            paymentMethod: 'CASH_USD',
                            amountOriginal: remaining,
                            currency: 'USD'
                          }]);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Agregar Método
                      </button>
                    </div>

                    <div className="space-y-3">
                      {paymentLines.map((line, idx) => {
                        const isElectronic = ['PAGO_MOVIL', 'TRANSFERENCIA', 'TARJETA_DEBITO', 'TARJETA_CREDITO'].includes(line.paymentMethod);
                        return (
                          <div key={idx} className="bg-slate-50 p-4 border border-slate-200/80 rounded-2xl space-y-3 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pago #{idx + 1}</span>
                              {paymentLines.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setPaymentLines(paymentLines.filter((_, i) => i !== idx))}
                                  className="text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Método</label>
                                <select
                                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                                  value={line.paymentMethod}
                                  onChange={(e) => {
                                    const method = e.target.value;
                                    const currency = method.endsWith('VES') || method === 'PAGO_MOVIL' || method === 'TARJETA_DEBITO' ? 'VES' : 'USD';
                                    setPaymentLines(paymentLines.map((l, i) => i === idx ? { ...l, paymentMethod: method, currency } : l));
                                  }}
                                >
                                  <option value="CASH_USD">💵 Efectivo en Dólares (USD)</option>
                                  <option value="CASH_VES">💵 Efectivo en Bolívares (VES)</option>
                                  <option value="PAGO_MOVIL">📱 Pago Móvil (VES)</option>
                                  <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                                  <option value="TARJETA_DEBITO">💳 Tarjeta de Débito (VES)</option>
                                  <option value="TARJETA_CREDITO">💳 Tarjeta de Crédito (USD)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Monto ({line.currency})</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  value={line.amountOriginal}
                                  onChange={(e) => {
                                    setPaymentLines(paymentLines.map((l, i) => i === idx ? { ...l, amountOriginal: Number(e.target.value) } : l));
                                  }}
                                />
                              </div>
                            </div>

                            {isElectronic && (
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Referencia de Transacción <span className="text-rose-500">*</span></label>
                                <input
                                  type="text"
                                  placeholder="Ej: 987654 (Últimos dígitos de la transacción)"
                                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                                  value={line.transactionReference || ''}
                                  onChange={(e) => {
                                    setPaymentLines(paymentLines.map((l, i) => i === idx ? { ...l, transactionReference: e.target.value } : l));
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary / Calculator */}
                  {(() => {
                    const paidUsd = getTotalsFromLines();
                    const remainingUsd = totalUsd - paidUsd;

                    return (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold uppercase">Total a pagar:</span>
                          <span className="font-mono font-black text-slate-800">${totalUsd.toFixed(2)} / Bs. {totalVes.toLocaleString('es-VE')}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold uppercase">Total recibido:</span>
                          <span className="font-mono font-black text-indigo-700">${paidUsd.toFixed(2)}</span>
                        </div>

                        {remainingUsd > 0.01 ? (
                          <div className="flex justify-between items-center p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-bold">
                            <span>Resta cobrar:</span>
                            <span className="font-mono">${remainingUsd.toFixed(2)} / Bs. {(remainingUsd * exchangeRate).toLocaleString('es-VE')}</span>
                          </div>
                        ) : remainingUsd < -0.01 ? (
                          <div className="space-y-2.5 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
                            <div className="flex justify-between items-center font-bold">
                              <span>Vuelto a entregar:</span>
                              <span className="font-mono">
                                {changeCurrency === 'USD'
                                  ? `$ ${Math.abs(remainingUsd).toFixed(2)}`
                                  : `Bs. ${(Math.abs(remainingUsd) * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
                                }
                              </span>
                            </div>

                            <div className="flex items-center gap-3 pt-1 border-t border-emerald-200">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Moneda de Vuelto:</span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setChangeCurrency('USD')}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all border ${changeCurrency === 'USD' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-200'}`}
                                >
                                  USD ($)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChangeCurrency('VES')}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all border ${changeCurrency === 'VES' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-200'}`}
                                >
                                  VES (Bs.)
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-emerald-500 text-white text-xs font-bold rounded-xl text-center">
                            ✅ Monto exacto cubierto
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* General Warning */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-600 text-xs leading-relaxed space-y-1">
                    <p className="font-bold text-slate-800">⚠️ Advertencias Operativas:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                      <li>Esta acción emitirá un comprobante fiscal y afectará stock permanentemente.</li>
                      {!selectedClientId && (
                        <li className="text-amber-600 font-semibold">Se registrará como Venta a Mostrador (sin cliente formalizado).</li>
                      )}
                    </ul>
                  </div>

                  {/* Negative Stock Warning & Justification */}
                  {goesNegative && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed shadow-2xs">
                        <span className="font-bold block mb-0.5">⚠️ Stock Insuficiente Detectado:</span>
                        La compra causará existencias negativas en el catálogo. Debes justificar el motivo para efectos de auditoría del supervisor.
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Justificación de Stock Negativo <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Ej: Producto disponible en estantería física pendiente por registrar compra en sistema..."
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all font-medium"
                          value={justificationText}
                          onChange={(e) => setJustificationText(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-sm font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submitSale}
                  disabled={isSubmittingSale || (goesNegative && !justificationText.trim())}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingSale && <Loader2 className="animate-spin h-4 w-4" />}
                  <span>{isSubmittingSale ? 'Procesando...' : 'Confirmar y Facturar'}</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Success Receipt Modal (Sally Enterprise UX Standard) */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl p-3 shadow-md shadow-emerald-100 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    ¡Venta Completada con Éxito!
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Factura #{completedSale.invoiceNumber} • Control #{completedSale.controlNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCompletedSale(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Cerrar ticket"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt layout */}
            <div className="p-6 space-y-4 text-xs font-mono text-slate-700 overflow-y-auto flex-1 custom-scrollbar">
              {companyProfile && (
                <div className="text-center border-b border-dashed border-slate-200 pb-3 space-y-0.5 mb-2">
                  {companyProfile.logo_url && (
                    <img src={companyProfile.logo_url} alt="Logo" className="h-8 object-contain mx-auto mb-1" />
                  )}
                  <p className="font-bold text-slate-900 uppercase font-sans text-sm">{companyProfile.commercial_name || companyProfile.company_name}</p>
                  <p className="text-xs text-slate-500 font-bold">RIF: {companyProfile.tax_id}</p>
                  {companyProfile.fiscal_address && (
                    <p className="text-[10px] text-slate-400 max-w-[280px] mx-auto leading-normal font-sans">{companyProfile.fiscal_address}</p>
                  )}
                  {companyProfile.phone && (
                    <p className="text-[10px] text-slate-400">Tlf: {companyProfile.phone}</p>
                  )}
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-1 font-sans">
                    {companyProfile.taxpayer_type === 'SPECIAL' ? 'Contribuyente Especial' : companyProfile.taxpayer_type === 'FORMAL' ? 'Contribuyente Formal' : 'Contribuyente Ordinario'}
                  </p>
                  {companyProfile.taxpayer_type === 'SPECIAL' && companyProfile.is_withholding_agent && (
                    <p className="text-[9px] text-indigo-700 font-black tracking-tight mt-0.5">AGENTE DE RETENCIÓN DE IVA</p>
                  )}
                </div>
              )}

              <div className="border-b border-dashed border-slate-200 pb-3 space-y-1">
                <p className="flex justify-between">
                  <span className="text-slate-500">Factura Nro:</span>
                  <span className="font-bold text-slate-900">{completedSale.invoiceNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Nro. Control:</span>
                  <span className="font-bold text-slate-900">{completedSale.controlNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold text-slate-900">{completedSale.client?.name || 'Cliente Genérico'}</span>
                </p>
                {completedSale.client && (
                  <p className="flex justify-between">
                    <span className="text-slate-500">RIF/C.I.:</span>
                    <span className="font-bold text-slate-900">{completedSale.client.tax_id}</span>
                  </p>
                )}
                <p className="flex justify-between">
                  <span className="text-slate-500">Método de Pago:</span>
                  <span className="font-bold text-slate-900">
                    {completedSale.paymentMethod === 'CASH_USD' && '💵 Efectivo $'}
                    {completedSale.paymentMethod === 'CASH_VES' && '💵 Efectivo Bs.'}
                    {completedSale.paymentMethod === 'PAGO_MOVIL' && '📱 Pago Móvil'}
                    {completedSale.paymentMethod === 'TRANSFERENCIA' && '🏦 Transferencia'}
                    {completedSale.paymentMethod === 'TARJETA_DEBITO' && '💳 Tarjeta Débito'}
                    {completedSale.paymentMethod === 'TARJETA_CREDITO' && '💳 Tarjeta Crédito'}
                  </span>
                </p>
                <p className="flex justify-between text-[10px] text-slate-400">
                  <span>Fecha:</span>
                  <span>{new Date().toLocaleString()}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                {completedSale.items.map((item: CartItem, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate max-w-44 text-slate-800">{item.product.name} (x{item.quantity})</span>
                    <span className="font-bold text-slate-900">${(item.product.priceUsd * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Luminous Summary Banner in Receipt */}
              <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-4 shadow-2xs space-y-1.5 font-sans">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">${(completedSale.total + (completedSale.discountAmount || 0)).toFixed(2)}</span>
                </div>
                {completedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 text-xs font-semibold">
                    <span>Descuento ({completedSale.discountPercent}%):</span>
                    <span className="font-mono">-${completedSale.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1 border-t border-indigo-100/80">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Total USD:</span>
                  <span className="text-xl font-black font-mono text-slate-900">${completedSale.total.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-xs font-mono font-bold text-slate-600">
                  <span>Total VES:</span>
                  <span>Bs. {completedSale.totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {companyProfile && companyProfile.receipt_footer && (
                <div className="border-t border-dashed border-slate-200 pt-3 text-center text-[10px] text-slate-400 leading-relaxed font-sans whitespace-pre-line mt-2">
                  {companyProfile.receipt_footer}
                </div>
              )}
            </div>

            {/* Footer Fijo */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0 gap-3">
              <button
                type="button"
                onClick={() => { window.print(); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-xl font-semibold text-slate-700 text-sm transition-all cursor-pointer shadow-2xs"
              >
                <Printer className="h-4 w-4 text-slate-600" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 rounded-xl font-semibold text-white text-sm transition-all cursor-pointer shadow-md shadow-indigo-200 active:scale-98"
              >
                Cerrar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Shift Open Modal (Sally Enterprise UX Standard) */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Apertura de Turno de Caja
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Ingresa el efectivo inicial disponible en la gaveta de caja
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Center Body */}
            <form onSubmit={handleOpenShift} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* Luminous Suggestion Banner */}
                <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-5 shadow-xs space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Sugerido de Caja Anterior (Último Cierre)</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/95 border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Fondo USD</span>
                      <span className="font-mono font-black text-base text-slate-900">${suggestedOpeningUsd.toFixed(2)}</span>
                    </div>
                    <div className="bg-white/95 border border-slate-200/80 rounded-xl p-3.5 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Fondo VES</span>
                      <span className="font-mono font-black text-base text-slate-900">Bs. {suggestedOpeningVes.toLocaleString('es-VE')}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Se recomienda validar que el efectivo físico coincida exactamente con estos valores antes de abrir.
                  </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Fondo de Caja (USD) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                        value={openingBalanceUsd}
                        onChange={(e) => setOpeningBalanceUsd(Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Fondo de Caja (VES) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                        value={openingBalanceVes}
                        onChange={(e) => setOpeningBalanceVes(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-end items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="submit"
                  disabled={isOpeningShift}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer"
                >
                  {isOpeningShift && <Loader2 className="animate-spin h-4 w-4" />}
                  <span>{isOpeningShift ? 'Abriendo...' : 'Abrir Turno de Caja'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shift Close / Arqueo Modal (Sally Enterprise UX Standard) */}
      {isCloseShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Cierre y Arqueo de Caja
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Cuenta y declara el total físico de efectivo disponible en la gaveta
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Center Body */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsClosingShift(true);
                setError(null);
                try {
                  await apiClient.post('/pos/shifts/close', {
                    declaredCashUsd,
                    declaredCashVes,
                  });
                  setIsCloseShiftModalOpen(false);
                  setActiveShift(null);
                  if (user?.role === 'CASHIER') {
                    setIsShiftModalOpen(true);
                  }
                } catch (err: any) {
                  setError(err.response?.data?.message || 'Error al cerrar el turno de caja.');
                } finally {
                  setIsClosingShift(false);
                }
              }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-600 text-xs leading-relaxed space-y-1">
                  <p className="font-bold text-slate-800">⚠️ Nota Importante:</p>
                  <p className="text-slate-500">
                    El sistema calculará automáticamente las diferencias/arqueos contra las ventas registradas. El turno pasará a un estado de **Pendiente de Aprobación** por parte del supervisor.
                  </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Efectivo Declarado (USD) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                        value={declaredCashUsd}
                        onChange={(e) => setDeclaredCashUsd(Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Efectivo Declarado (VES) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                        value={declaredCashVes}
                        onChange={(e) => setDeclaredCashVes(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Footer Fijo */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isClosingShift}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 active:from-rose-700 active:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-rose-200 text-sm cursor-pointer"
                >
                  {isClosingShift && <Loader2 className="animate-spin h-4 w-4" />}
                  <span>{isClosingShift ? 'Cerrando...' : 'Enviar Declaración y Cerrar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
