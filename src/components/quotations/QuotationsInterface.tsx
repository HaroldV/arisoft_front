'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  FileText, 
  ListFilter, 
  LayoutGrid, 
  List, 
  RefreshCw, 
  Loader2, 
  Warehouse, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { useAuth } from '@/context/AuthContext';
import { 
  QuotationProduct, 
  QuotationClient, 
  QuotationCartItem, 
  CommercialQuotation 
} from './types';
import { QuotationProductCatalog } from './subcomponents/QuotationProductCatalog';
import { QuotationCartSidebar } from './subcomponents/QuotationCartSidebar';
import { GenerateQuotationModal } from './subcomponents/GenerateQuotationModal';
import { QuickClientModal } from './subcomponents/QuickClientModal';
import { QuotationsTable } from './subcomponents/QuotationsTable';

export const QuotationsInterface: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'TERMINAL' | 'LIST'>('TERMINAL');

  // Products and Cart
  const [products, setProducts] = useState<QuotationProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<QuotationProduct[]>([]);
  const [cart, setCart] = useState<QuotationCartItem[]>([]);
  const [clients, setClients] = useState<QuotationClient[]>([]);
  const [quotations, setQuotations] = useState<CommercialQuotation[]>([]);
  
  // Status states
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
  const [mobileTab, setMobileTab] = useState<'CATALOG' | 'CART'>('CATALOG');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(true);

  // Modal states
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isQuickClientModalOpen, setIsQuickClientModalOpen] = useState(false);

  // Fetch initial data
  const fetchCatalogData = async () => {
    setIsLoadingCatalog(true);
    try {
      const [productsRes, clientsRes, bcvRes] = await Promise.all([
        apiClient.get('/inventory/products').catch(() => ({ data: [] })),
        apiClient.get('/clients').catch(() => ({ data: [] })),
        apiClient.get('/auth/bcv/rate').catch(() => ({ data: null }))
      ]);

      const rawProducts = Array.isArray(productsRes.data) 
        ? productsRes.data 
        : (productsRes.data?.items || []);

      const mappedProducts: QuotationProduct[] = rawProducts.map((p: any) => ({
        ...p,
        priceUsd: p.priceUsd !== undefined ? Number(p.priceUsd) : (p.price_usd !== undefined ? Number(p.price_usd) : 0),
        costUsd: p.costUsd !== undefined ? Number(p.costUsd) : (p.cost_usd !== undefined ? Number(p.cost_usd) : 0),
        taxRate: p.taxRate !== undefined ? Number(p.taxRate) : (p.tax_rate !== undefined ? Number(p.tax_rate) : 0.16),
        current_stock: p.current_stock !== undefined ? Number(p.current_stock) : 0,
      }));

      setProducts(mappedProducts);
      setFilteredProducts(mappedProducts);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);

      if (bcvRes.data?.rate && Number(bcvRes.data.rate) > 0) {
        setExchangeRate(Number(bcvRes.data.rate));
      }
    } catch (err) {
      console.error('Error fetching catalog data:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const fetchQuotations = async () => {
    setIsLoadingQuotations(true);
    try {
      const res = await apiClient.get('/sales/documents', {
        params: { document_type: 'QUOTATION' }
      });
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setQuotations(list);
    } catch (err) {
      console.error('Error fetching quotations:', err);
    } finally {
      setIsLoadingQuotations(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
    fetchQuotations();
  }, []);

  // Filter products when search query changes
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setFilteredProducts(products);
      return;
    }
    const filtered = products.filter(
      p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  // Cart operations
  const handleAddToCart = (product: QuotationProduct) => {
    setCart(prev => {
      const index = prev.findIndex(item => item.product.id === product.id);
      if (index > -1) {
        const next = [...prev];
        next[index] = { ...next[index], quantity: next[index].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number, variationName?: string) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId && item.variation?.name === variationName) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as QuotationCartItem[];
    });
  };

  const handleRemoveItem = (productId: string, variationName?: string) => {
    setCart(prev => 
      prev.filter(item => !(item.product.id === productId && item.variation?.name === variationName))
    );
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleQuotationGenerated = (quotationNumber: string) => {
    setIsGenerateModalOpen(false);
    setCart([]);
    setSelectedClientId('');
    showNotification(`Cotización ${quotationNumber} generada con éxito.`);
    fetchQuotations();
    setActiveTab('LIST');
  };

  const handleClientCreated = (newClient: QuotationClient) => {
    setClients(prev => [newClient, ...prev]);
    setSelectedClientId(newClient.id);
  };

  const selectedClientObj = clients.find(c => c.id === selectedClientId) || null;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Navigation Tabs */}
      <div className="bg-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl p-2.5">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
              Cotizaciones de Ventas
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              Alista productos para tus clientes en mostrador o consulta tu historial de cotizaciones
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl gap-1 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('TERMINAL')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'TERMINAL'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Terminal de Cotización</span>
            {cart.length > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LIST')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'LIST'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Listado de Cotizaciones</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {quotations.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'TERMINAL' ? (
        <div className="flex flex-col h-[calc(100dvh-12.5rem)] sm:h-[calc(100dvh-14rem)] lg:h-[calc(100vh-14.5rem)] min-h-[480px] bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden bg-slate-100 border-b border-slate-200 p-1.5 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setMobileTab('CATALOG')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mobileTab === 'CATALOG' ? 'bg-indigo-600 text-white' : 'text-slate-600'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Catálogo</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('CART')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mobileTab === 'CART' ? 'bg-indigo-600 text-white' : 'text-slate-600'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Carrito ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
            {/* Catalog (Left) */}
            <div className={`flex-1 flex-col bg-white lg:border-r border-slate-200 min-w-0 ${
              mobileTab === 'CATALOG' ? 'flex' : 'hidden lg:flex'
            }`}>
              <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar producto por SKU o nombre..."
                    className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300/60">
                    <button
                      type="button"
                      onClick={() => setViewMode('LIST')}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        viewMode === 'LIST' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('GRID')}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        viewMode === 'GRID' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products list area */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
                {isLoadingCatalog ? (
                  <div className="h-full flex items-center justify-center flex-col gap-2 py-16">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    <span className="text-xs text-slate-500 font-semibold">Cargando catálogo...</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 py-16">
                    <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No se encontraron productos</p>
                    <p className="text-xs text-slate-400 mt-0.5">Intenta con otro término de búsqueda.</p>
                  </div>
                ) : (
                  <QuotationProductCatalog
                    products={filteredProducts}
                    viewMode={viewMode}
                    exchangeRate={exchangeRate}
                    onAddToCart={handleAddToCart}
                  />
                )}
              </div>

              {/* Bottom Sticky Action Bar on Mobile/Tablet when Cart has items */}
              {cart.length > 0 && mobileTab === 'CATALOG' && (
                <div className="lg:hidden p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 shadow-lg z-10">
                  <div
                    onClick={() => setMobileTab('CART')}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {cart.reduce((sum, i) => sum + i.quantity, 0)} {cart.reduce((sum, i) => sum + i.quantity, 0) === 1 ? 'producto' : 'productos'}
                      </div>
                      <div className="text-[11px] font-black text-slate-900 font-mono">
                        ${cart.reduce((sum, item) => sum + (item.product.priceUsd * item.quantity), 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileTab('CART')}
                      className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl"
                    >
                      Ver Carrito
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsGenerateModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Generar Cotización</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cart (Right) */}
            <div className={`w-full lg:w-96 xl:w-104 flex-col shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 ${
              mobileTab === 'CART' ? 'flex flex-1' : 'hidden lg:flex'
            }`}>
              <QuotationCartSidebar
                cart={cart}
                clients={clients}
                selectedClientId={selectedClientId}
                onSelectClient={setSelectedClientId}
                exchangeRate={exchangeRate}
                onExchangeRateChange={setExchangeRate}
                discountPercent={discountPercent}
                onDiscountPercentChange={setDiscountPercent}
                applyTax={applyTax}
                onToggleApplyTax={setApplyTax}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onGenerateQuotationClick={() => setIsGenerateModalOpen(true)}
                onOpenQuickClientModal={() => setIsQuickClientModalOpen(true)}
                onCloseMobileCart={() => setMobileTab('CATALOG')}
                userName={user?.full_name}
              />
            </div>
          </div>
        </div>
      ) : (
        <QuotationsTable
          quotations={quotations}
          isLoading={isLoadingQuotations}
          onRefresh={fetchQuotations}
        />
      )}

      {/* Generate Quotation Modal */}
      {isGenerateModalOpen && (
        <GenerateQuotationModal
          isOpen={isGenerateModalOpen}
          cart={cart}
          clients={clients}
          exchangeRate={exchangeRate}
          initialClient={selectedClientObj}
          onClose={() => setIsGenerateModalOpen(false)}
          onSuccess={handleQuotationGenerated}
          onClientCreated={handleClientCreated}
        />
      )}

      {/* Quick Client Registration Modal (from Cart Sidebar) */}
      {isQuickClientModalOpen && (
        <QuickClientModal
          isOpen={isQuickClientModalOpen}
          onClose={() => setIsQuickClientModalOpen(false)}
          onClientCreated={handleClientCreated}
        />
      )}
    </div>
  );
};
