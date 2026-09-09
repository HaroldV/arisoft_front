'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  UserCheck,
  LayoutGrid,
  List,
  Building2,
  Warehouse,
  QrCode,
  PanelRightClose,
  PanelRightOpen,
  ChevronLeft,
  Package,
  PackageX,
  SlidersHorizontal,
  MapPin
} from 'lucide-react';
import apiClient from '@/infrastructure/api/api-client';
import { useAuth } from '@/context/AuthContext';
import { CurrencyInput } from '@/components/CurrencyInput';
import { BarcodeScannerModal } from '@/components/inventory/subcomponents/BarcodeScannerModal';
import { SectorAutocompleteInput } from '@/components/pos/subcomponents/SectorAutocompleteInput';

export interface ProductVariation {
  name: string;
  quantity: number;
  sku?: string;
  unit_cost?: number;
}

export interface WarehouseStockInfo {
  warehouse_id: string;
  warehouse_name: string;
  branch_name?: string;
  stock: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  costUsd: number;
  priceUsd: number;
  taxRate: number;
  current_stock: number;
  global_stock?: number;
  warehouse_stocks?: WarehouseStockInfo[];
  image_url?: string;
  imageUrl?: string;
  variations?: ProductVariation[];
}

interface Client {
  id: string;
  name: string;
  tax_id: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  variation?: ProductVariation;
}

export const PosInterface: React.FC = () => {
  const { user } = useAuth();
  const canApplyDiscount = user?.role === 'OWNER' || (user?.permissions || []).includes('pos:discount');

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Variation Selection Modal
  const [variationModalProduct, setVariationModalProduct] = useState<Product | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(true);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [posViewMode, setPosViewMode] = useState<'GRID' | 'LIST'>('LIST');
  const [mobileTab, setMobileTab] = useState<'CATALOG' | 'CART'>('CATALOG');
  const [isCartCollapsed, setIsCartCollapsed] = useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<number>(36.50);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceRangeError, setInvoiceRangeError] = useState<string | null>(null);

  // Quick Client Modal
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientDocType, setClientDocType] = useState('V');
  const [clientDocNumber, setClientDocNumber] = useState('');
  const [clientForm, setClientForm] = useState({ name: '', tax_id: '', address: '', email: '', phone: '' });
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  // Mandatory Client Identification Step before Payment
  const [isIdentifyModalOpen, setIsIdentifyModalOpen] = useState(false);
  const [identifyDocType, setIdentifyDocType] = useState('V');
  const [identifyDocNumber, setIdentifyDocNumber] = useState('');
  const [identifyClientFound, setIdentifyClientFound] = useState<Client | null>(null);
  const [identifyNewClient, setIdentifyNewClient] = useState({ name: '', tax_id: '', address: '', email: '', phone: '' });
  const [isIdentifyingLoading, setIsIdentifyingLoading] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);

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

  const [warehouses, setWarehouses] = useState<{ id: string; name: string; type?: string }[]>([]);
  const isOwner = user?.role === 'OWNER';
  const assignedWarehouseId = user?.branch?.default_warehouse_id || '';
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(assignedWarehouseId);

  const fetchData = async (warehouseIdToFilter?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // If user is not OWNER, strictly enforce assigned warehouse
      const activeWhId = !isOwner 
        ? (assignedWarehouseId || undefined)
        : (warehouseIdToFilter !== undefined ? warehouseIdToFilter : (selectedWarehouseId || undefined));

      const productParams = activeWhId && activeWhId !== 'ALL' ? { warehouse_id: activeWhId } : {};

      const [productsRes, clientsRes, rangesRes, profileRes, activeShiftRes, warehousesRes, bcvRes] = await Promise.all([
        apiClient.get('/inventory/products', { params: productParams }).catch((err) => { console.error('Products fetch error:', err); return { data: [] }; }),
        apiClient.get('/clients').catch((err) => { console.error('Clients fetch error:', err); return { data: [] }; }),
        apiClient.get('/tenant/fiscal-ranges').catch((err) => { console.error('Ranges fetch error:', err); return { data: [] }; }),
        apiClient.get('/tenant/profile').catch(() => null),
        apiClient.get('/pos/shifts/active').catch((err) => { console.error('Active shift check error:', err); return { data: { active: false } }; }),
        apiClient.get('/inventory/warehouse-locations').catch((err) => { console.error('Warehouses fetch error:', err); return { data: [] }; }),
        apiClient.get('/auth/bcv/rate').catch(() => ({ data: null }))
      ]);

      const rawProductList = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data?.items || []);
      const productList: Product[] = rawProductList.map((p: any) => ({
        ...p,
        priceUsd: p.priceUsd !== undefined ? Number(p.priceUsd) : (p.price_usd !== undefined ? Number(p.price_usd) : 0),
        costUsd: p.costUsd !== undefined ? Number(p.costUsd) : (p.cost_usd !== undefined ? Number(p.cost_usd) : 0),
        taxRate: p.taxRate !== undefined ? Number(p.taxRate) : (p.tax_rate !== undefined ? Number(p.tax_rate) : 0),
        current_stock: p.current_stock !== undefined ? Number(p.current_stock) : 0,
      }));
      setProducts(productList);
      setFilteredProducts(productList);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);

      const whList = Array.isArray(warehousesRes.data) ? warehousesRes.data : [];
      setWarehouses(whList);

      // Default selected warehouse for OWNER if not set yet
      if (isOwner) {
        if (!selectedWarehouseId && warehouseIdToFilter === undefined) {
          if (assignedWarehouseId) {
            setSelectedWarehouseId(assignedWarehouseId);
          } else if (whList.length > 0) {
            setSelectedWarehouseId(whList[0].id);
          }
        }
      } else {
        setSelectedWarehouseId(assignedWarehouseId);
      }

      // Calculate effective exchange rate from BCV + Tenant Configuration
      let effectiveRate = 772.54;
      const bcvData = bcvRes?.data;
      const bcvUsd = bcvData?.USD?.rate ? Number(bcvData.USD.rate) : (bcvData?.rate ? Number(bcvData.rate) : 772.54);
      const bcvEur = bcvData?.EUR?.rate ? Number(bcvData.EUR.rate) : 894.49;

      if (profileRes && profileRes.data) {
        setCompanyProfile(profileRes.data);
        const settings = profileRes.data.settings || {};
        const mode = settings.currencyMode || (settings.isAutomatic === false ? 'MANUAL' : 'BCV_USD');
        
        if (mode === 'MANUAL' && settings.manualRate) {
          effectiveRate = Number(settings.manualRate);
        } else if (mode === 'BCV_EUR' || settings.officialCurrency === 'EUR') {
          effectiveRate = bcvEur;
        } else {
          effectiveRate = bcvUsd;
        }
      } else {
        effectiveRate = bcvUsd;
      }
      setExchangeRate(effectiveRate);

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

  // Listen to global rate updates dispatched from settings or layout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleRateUpdate = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail) {
          if (typeof customEvent.detail.usdRate === 'number' && (!customEvent.detail.mode || customEvent.detail.mode === 'BCV_USD')) {
            setExchangeRate(customEvent.detail.usdRate);
          } else if (typeof customEvent.detail.eurRate === 'number' && customEvent.detail.mode === 'BCV_EUR') {
            setExchangeRate(customEvent.detail.eurRate);
          } else if (typeof customEvent.detail.manualRate === 'number' && customEvent.detail.mode === 'MANUAL') {
            setExchangeRate(customEvent.detail.manualRate);
          } else if (typeof customEvent.detail.rate === 'number') {
            setExchangeRate(customEvent.detail.rate);
          }
        }
      };
      window.addEventListener('exchange-rate-updated', handleRateUpdate);
      return () => {
        window.removeEventListener('exchange-rate-updated', handleRateUpdate);
      };
    }
  }, []);

  // Filter products locally as user types & applies filters
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = products;

    if (onlyInStock) {
      result = result.filter(p => (p.current_stock ?? 0) > 0);
    }

    if (q) {
      result = result.filter(p => 
        (p.name || '').toLowerCase().includes(q) || 
        (p.sku || '').toLowerCase().includes(q)
      );
    }

    setFilteredProducts(result);
  }, [searchQuery, products, onlyInStock]);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanToast, setScanToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showScanToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setScanToast({ message, type });
    setTimeout(() => {
      setScanToast(null);
    }, 2800);
  };

  const playScanBeep = (isSuccess = true) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = isSuccess ? 880 : 300;
      gain.gain.value = 0.12;
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, isSuccess ? 100 : 250);
    } catch (_) {}
  };

  const handleScanProductInPos = (rawScannedCode: string) => {
    const raw = rawScannedCode.trim();
    if (!raw) return;

    let targetSku = raw.toUpperCase();

    // Check if raw is a JSON payload
    try {
      if (raw.startsWith('{') && raw.endsWith('}')) {
        const parsed = JSON.parse(raw);
        if (parsed.sku || parsed.code) {
          targetSku = (parsed.sku || parsed.code).toUpperCase();
        }
      }
    } catch (_) {}

    // Find matching product in currently loaded catalog (filtered by active warehouse)
    const match = products.find(
      p => (p.sku && p.sku.toUpperCase() === targetSku) || (p.name && p.name.toUpperCase() === targetSku)
    );

    if (!match) {
      playScanBeep(false);
      showScanToast(`Código "${targetSku}" no registrado en el catálogo.`, 'error');
      return;
    }

    // Check stock
    if (match.current_stock !== undefined && match.current_stock <= 0) {
      playScanBeep(false);
      showScanToast(`"${match.name}" no tiene stock disponible en este almacén.`, 'warning');
      return;
    }

    // If has variations, open variation modal
    if (match.variations && match.variations.length > 0) {
      playScanBeep(true);
      setVariationModalProduct(match);
      showScanToast(`Selecciona la variante para "${match.name}"`, 'success');
      return;
    }

    // Add to cart directly
    addToCart(match);
    playScanBeep(true);
    showScanToast(`+1 "${match.name}" añadido al carrito`, 'success');
  };

  // Global Barcode / QR hardware scanner listener (HID keyboard wedge)
  const barcodeBufferRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input with multiple letters (unless Enter is pressed on search)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.trim().length >= 2) {
          const scannedCode = barcodeBufferRef.current.trim();
          handleScanProductInPos(scannedCode);
          barcodeBufferRef.current = '';
          e.preventDefault();
        }
        return;
      }

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          barcodeBufferRef.current = '';
        }, 250);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [products, cart]);

  const addToCart = (product: Product, variation?: ProductVariation) => {
    // If product has variations and none was selected yet, open variation selector modal
    if (!variation && product.variations && product.variations.length > 0) {
      setVariationModalProduct(product);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => 
        item.product.id === product.id && 
        (item.variation?.name === variation?.name)
      );

      if (existing) {
        return prev.map(item => 
          item.product.id === product.id && item.variation?.name === variation?.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, variation }];
    });

    if (variationModalProduct) {
      setVariationModalProduct(null);
    }
  };

  const updateQuantity = (productId: string, delta: number, variationName?: string) => {
    setCart(prev => 
      prev.map(item => {
        if (item.product.id === productId && item.variation?.name === variationName) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string, variationName?: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.variation?.name === variationName)));
  };

  // Calculations with exact 2-decimal financial precision
  const subtotal = Number(cart.reduce((sum, item) => sum + (item.product.priceUsd * item.quantity), 0).toFixed(2));
  const discountAmount = Number((subtotal * (discountPercent / 100)).toFixed(2));
  const discountedSubtotal = Number((subtotal - discountAmount).toFixed(2));
  const taxAmount = Number(cart.reduce((sum, item) => {
    const itemTotal = item.product.priceUsd * item.quantity;
    const itemDiscount = itemTotal * (discountPercent / 100);
    const itemTax = (itemTotal - itemDiscount) * (item.product.taxRate / 100);
    return sum + itemTax;
  }, 0).toFixed(2));
  const totalUsd = Number((discountedSubtotal + taxAmount).toFixed(2));
  const totalVes = Number((totalUsd * exchangeRate).toFixed(2));

  // Client Modal actions
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientDocNumber.trim()) {
      setClientError('El número de documento es obligatorio.');
      return;
    }
    const fullTaxId = `${clientDocType}-${clientDocNumber.trim().replace(/^[-_.]/, '')}`.toUpperCase();

    setIsSavingClient(true);
    setClientError(null);
    try {
      const res = await apiClient.post('/clients', {
        name: clientForm.name.trim(),
        tax_id: fullTaxId,
        address: clientForm.address.trim(),
        email: clientForm.email.trim() || undefined,
        phone: clientForm.phone.trim() || undefined
      });
      // Add newly registered client to state
      setClients(prev => [...prev, res.data]);
      setSelectedClientId(res.data.id);
      setIsClientModalOpen(false);
      setClientForm({ name: '', tax_id: '', address: '', email: '', phone: '' });
      setClientDocNumber('');
    } catch (err: any) {
      setClientError(err.response?.data?.message || 'Error al crear el cliente.');
    } finally {
      setIsSavingClient(false);
    }
  };

  // Search client by Tax ID (Cédula/RIF) in Identification Step
  const handleIdentifySearch = (docType: string, docNumber: string) => {
    const cleanNumber = docNumber.trim().replace(/^[-_.]/, '');
    setIdentifyDocType(docType);
    setIdentifyDocNumber(cleanNumber);
    setIdentifyError(null);

    if (!cleanNumber) {
      setIdentifyClientFound(null);
      return;
    }

    const fullTaxId = `${docType}-${cleanNumber}`.toUpperCase();
    const found = clients.find(c => {
      const cTax = c.tax_id.toUpperCase().replace(/\s+/g, '');
      return cTax === fullTaxId || cTax === `${docType}${cleanNumber}` || (docType === 'V' && cTax === cleanNumber);
    });

    if (found) {
      setIdentifyClientFound(found);
      setIdentifyNewClient({ name: '', tax_id: '', address: '', email: '', phone: '' });
    } else {
      setIdentifyClientFound(null);
      setIdentifyNewClient(prev => ({
        ...prev,
        tax_id: fullTaxId
      }));
    }
  };

  const handleSelectIdentifiedClientAndProceed = (client: Client) => {
    setSelectedClientId(client.id);
    setIsIdentifyModalOpen(false);
    setPaymentLines([
      { paymentMethod: 'CASH_USD', amountOriginal: totalUsd, currency: 'USD' }
    ]);
    setIsConfirmModalOpen(true);
  };

  const handleRegisterAndProceedWithIdentifiedClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifyDocNumber.trim()) {
      setIdentifyError('El número de documento es obligatorio.');
      return;
    }

    const fullTaxId = `${identifyDocType}-${identifyDocNumber.trim().replace(/^[-_.]/, '')}`.toUpperCase();

    if (!identifyNewClient.name.trim() || !identifyNewClient.address.trim()) {
      setIdentifyError('Nombre, Cédula/RIF y Sector son obligatorios.');
      return;
    }

    setIsIdentifyingLoading(true);
    setIdentifyError(null);

    try {
      const res = await apiClient.post('/clients', {
        name: identifyNewClient.name.trim(),
        tax_id: fullTaxId,
        address: identifyNewClient.address.trim(),
        email: identifyNewClient.email.trim() || undefined,
        phone: identifyNewClient.phone.trim() || undefined
      });

      const createdClient: Client = res.data;
      setClients(prev => [...prev, createdClient]);
      setSelectedClientId(createdClient.id);
      setIsIdentifyModalOpen(false);
      setIdentifyNewClient({ name: '', tax_id: '', address: '', email: '', phone: '' });
      setIdentifyDocNumber('');
      setIdentifyClientFound(null);

      // Open checkout payment confirmation
      setPaymentLines([
        { paymentMethod: 'CASH_USD', amountOriginal: totalUsd, currency: 'USD' }
      ]);
      setIsConfirmModalOpen(true);
    } catch (err: any) {
      setIdentifyError(err.response?.data?.message || 'Error al registrar el cliente.');
    } finally {
      setIsIdentifyingLoading(false);
    }
  };

  // Checkout submission
  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setError(null);

    // If client is already selected, proceed directly to payment confirmation
    if (selectedClientId) {
      setPaymentLines([
        { paymentMethod: 'CASH_USD', amountOriginal: totalUsd, currency: 'USD' }
      ]);
      setIsConfirmModalOpen(true);
      return;
    }

    // If no client selected, open mandatory Client Identification Modal with default 'V'
    setIdentifyDocType('V');
    setIdentifyDocNumber('');
    setIdentifyClientFound(null);
    setIdentifyNewClient({ name: '', tax_id: '', address: '', email: '', phone: '' });
    setIdentifyError(null);
    setIsIdentifyModalOpen(true);
  };

  const getTotalsFromLines = () => {
    let paidUsd = 0.00;
    let paidVes = 0.00;
    paymentLines.forEach(line => {
      const amount = Number(line.amountOriginal || 0);
      if (line.currency === 'USD') {
        paidUsd += amount;
        paidVes += amount * exchangeRate;
      } else {
        paidVes += amount;
        paidUsd += exchangeRate > 0 ? (amount / exchangeRate) : 0;
      }
    });
    return { paidUsd, paidVes };
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

    const { paidUsd } = getTotalsFromLines();
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
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] sm:h-[calc(100dvh-9rem)] lg:h-[calc(100vh-12rem)] min-h-[500px] bg-slate-50 w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm animate-in fade-in duration-500">
      
      {/* Fiscal Range Warning Banner */}
      {invoiceRangeError && (
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-3 flex items-center gap-3 text-rose-700 text-xs font-bold shrink-0 animate-in slide-in-from-top duration-300">
          <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
          <div className="flex-1">{invoiceRangeError}</div>
        </div>
      )}

      {/* Tablet & Mobile Tab Switch Bar (Visible on < lg screens) */}
      <div className="flex lg:hidden bg-white border-b border-slate-200 p-1.5 gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('CATALOG')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
            mobileTab === 'CATALOG'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Catálogo de Productos</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('CART')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none relative ${
            mobileTab === 'CART'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Carrito</span>
          {cart.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              mobileTab === 'CART' ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'
            }`}>
              {cart.reduce((sum, i) => sum + i.quantity, 0)} • ${totalUsd.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        {/* Left Side: Product catalog and search */}
        <div className={`flex-1 flex-col bg-white lg:border-r border-slate-200 min-w-0 ${
          mobileTab === 'CATALOG' ? 'flex' : 'hidden lg:flex'
        }`}>
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[200px] flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar o escanear por código SKU, barra o nombre..."
                  className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      e.preventDefault();
                      handleScanProductInPos(searchQuery);
                      setSearchQuery('');
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* QR / Camera Scanner Button */}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                title="Abrir lector de cámara para escanear productos"
              >
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Escanear</span>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Warehouse Selector in POS toolbar (OWNER only) */}
              {isOwner && warehouses.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100/90 border border-slate-200/80 rounded-xl text-xs shrink-0">
                  <Warehouse className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => {
                      const newWhId = e.target.value;
                      setSelectedWarehouseId(newWhId);
                      fetchData(newWhId);
                    }}
                    className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1 max-w-[130px] sm:max-w-none truncate"
                  >
                    <option value="ALL">📦 Todos</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        🏢 {wh.name} {wh.type ? `(${wh.type})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Branch and assigned warehouse indicator badge */}
              {user?.branch && (
                <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{user.branch.name}</span>
                  {user.branch.default_warehouse && (
                    <span className="text-[11px] text-indigo-600/80 font-medium">
                      • 🏢 {user.branch.default_warehouse.name}
                    </span>
                  )}
                </div>
              )}

              {/* Stock Filter Toggle (Option B: Solo con Stock Local) */}
              <button
                type="button"
                onClick={() => setOnlyInStock(!onlyInStock)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none shrink-0 ${
                  onlyInStock
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80'
                }`}
                title={onlyInStock ? "Mostrando solo productos con existencias en esta sucursal (Clic para ver todo)" : "Mostrando todos los productos (Clic para ocultar sin existencias)"}
              >
                {onlyInStock ? (
                  <>
                    <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="hidden sm:inline">Con Stock Local</span>
                  </>
                ) : (
                  <>
                    <PackageX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="hidden sm:inline">Todos los Productos</span>
                  </>
                )}
              </button>
            </div>

            {/* View Mode Toggle (Grid vs Fast List) */}
            <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1 shrink-0 border border-slate-200">
              <button
                type="button"
                onClick={() => setPosViewMode('LIST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                  posViewMode === 'LIST'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Modo Lista Rápida (Recomendado para mostrador)"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lista Rápida</span>
              </button>
              <button
                type="button"
                onClick={() => setPosViewMode('GRID')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                  posViewMode === 'GRID'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Modo Cuadrícula Táctil"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cuadrícula</span>
              </button>
            </div>

            {/* Toggle Cart Panel (Desktop/Tablet Collapse) */}
            <button
              type="button"
              onClick={() => setIsCartCollapsed(!isCartCollapsed)}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                isCartCollapsed
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs active:scale-95'
                  : 'bg-white text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-200 shadow-2xs'
              }`}
              title={isCartCollapsed ? "Mostrar Carrito de Compras" : "Colapsar Carrito para expandir Catálogo"}
            >
              {isCartCollapsed ? (
                <>
                  <PanelRightOpen className="w-4 h-4 text-white" />
                  <span>Ver Carrito</span>
                  {cart.length > 0 && (
                    <span className="bg-white text-indigo-700 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                      {cart.reduce((sum, i) => sum + i.quantity, 0)} • ${totalUsd.toFixed(2)}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <PanelRightClose className="w-4 h-4 text-slate-500" />
                  <span className="hidden xl:inline">Ocultar Carrito</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
            {isLoading ? (
              <div className="h-full flex items-center justify-center flex-col gap-2 py-16">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                <span className="text-xs text-slate-500 font-semibold">Cargando catálogo...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 py-16">
                <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No se encontraron productos disponibles</p>
                <p className="text-xs text-slate-400 mt-0.5">Intenta con otro término de búsqueda.</p>
              </div>
            ) : posViewMode === 'LIST' ? (
              /* FAST COMPACT LIST VIEW */
              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
                <div className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const stock = p.current_stock ?? 0;
                    const isCritical = stock <= 5 && stock > 0;
                    const isOut = stock <= 0;

                    // Identify alternative branches/warehouses with available stock
                    const alternateStocks = (p.warehouse_stocks || []).filter(ws => ws.stock > 0);
                    const hasAlternateStock = alternateStocks.length > 0;
                    const primaryAlt = alternateStocks[0];
                    const altLocationLabel = primaryAlt 
                      ? (primaryAlt.branch_name || primaryAlt.warehouse_name) 
                      : null;

                    return (
                      <div
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className={`p-3 transition-colors flex items-center justify-between gap-3 cursor-pointer group select-none ${
                          isOut ? 'hover:bg-slate-50 opacity-85' : 'hover:bg-indigo-50/40 active:bg-indigo-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100/90 border border-slate-200/70 px-2 py-0.5 rounded-md shrink-0">
                            {p.sku}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate group-hover:text-indigo-600 transition-colors">
                              {p.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {p.variations && p.variations.length > 0 && (
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-full">
                                  {p.variations.length} {p.variations.length === 1 ? 'Variante' : 'Variantes'}
                                </span>
                              )}
                              
                              {/* Stock status badge with Origin Branch Info */}
                              {!isOut ? (
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                                  isCritical 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {isCritical ? 'Stock Crítico' : 'Disponible'}
                                </span>
                              ) : hasAlternateStock ? (
                                <span 
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1 max-w-full truncate"
                                  title={`Disponible en ${alternateStocks.map(a => `${a.branch_name || a.warehouse_name} (${a.stock} un)`).join(', ')}`}
                                >
                                  <Building2 className="w-3 h-3 shrink-0 text-indigo-500" />
                                  <span className="truncate">
                                    Disp. en {altLocationLabel} ({primaryAlt.stock} un){alternateStocks.length > 1 ? ` +${alternateStocks.length - 1}` : ''}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                                  Sin Stock Global
                                </span>
                              )}

                              <span className="text-[11px] text-slate-400 font-medium">
                                Stock local: <strong className={`font-mono ${isOut ? 'text-rose-600' : 'text-slate-700'}`}>{stock} un</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price & Add Button */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="text-sm sm:text-base font-black text-slate-900 font-mono leading-tight">
                              ${(p.priceUsd ?? 0).toFixed(2)}
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 font-mono">
                              Bs. {((p.priceUsd ?? 0) * exchangeRate).toFixed(2)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                            className={`p-2 rounded-xl border transition-all shadow-2xs cursor-pointer active:scale-90 ${
                              isOut 
                                ? 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-600'
                                : 'bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white border-indigo-200/70 group-hover:border-indigo-600'
                            }`}
                            title={p.variations && p.variations.length > 0 ? "Seleccionar variación" : isOut ? "Sin stock en esta sucursal" : "Agregar al carrito"}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* GRID VIEW (Touch / Tablet Mode) */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const stock = p.current_stock ?? 0;
                  const isCritical = stock <= 5 && stock > 0;
                  const isOut = stock <= 0;

                  const alternateStocks = (p.warehouse_stocks || []).filter(ws => ws.stock > 0);
                  const hasAlternateStock = alternateStocks.length > 0;
                  const primaryAlt = alternateStocks[0];
                  const altLocationLabel = primaryAlt 
                    ? (primaryAlt.branch_name || primaryAlt.warehouse_name) 
                    : null;

                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all group cursor-pointer bg-white overflow-hidden ${
                        isOut 
                          ? 'border-slate-200/70 opacity-90 hover:border-slate-300' 
                          : 'border-slate-200/90 hover:border-indigo-400 hover:shadow-md hover:bg-indigo-50/20 active:scale-98'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                          {p.sku}
                        </span>

                        {!isOut ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isCritical 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {isCritical ? 'Crítico' : 'Disponible'}
                          </span>
                        ) : hasAlternateStock ? (
                          <span 
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1 max-w-[120px] truncate"
                            title={`Disponible en ${alternateStocks.map(a => `${a.branch_name || a.warehouse_name} (${a.stock} un)`).join(', ')}`}
                          >
                            <Building2 className="w-2.5 h-2.5 shrink-0 text-indigo-500" />
                            <span className="truncate">{altLocationLabel}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                            Agotado
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mt-1 group-hover:text-indigo-600 line-clamp-2 w-full leading-tight min-h-[2.5rem]">
                        {p.name}
                      </h4>
                      {p.variations && p.variations.length > 0 && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md w-fit">
                          {p.variations.length} {p.variations.length === 1 ? 'Variante' : 'Variantes'}
                        </span>
                      )}

                      {/* Origin warehouse subtitle for grid cards when out of local stock */}
                      {isOut && hasAlternateStock && (
                        <div className="mt-1 text-[10px] font-semibold text-indigo-600 flex items-center gap-1 truncate">
                          <span>📍 En {altLocationLabel}: <strong>{primaryAlt.stock} un</strong></span>
                        </div>
                      )}
                      
                      <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-slate-100 w-full">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-black text-slate-900 font-mono">${(p.priceUsd ?? 0).toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400 font-bold">USD</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-500 font-mono">
                            Bs. {((p.priceUsd ?? 0) * exchangeRate).toFixed(2)}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Stock local</span>
                          <span className={`text-xs font-bold font-mono ${isOut ? 'text-rose-600' : 'text-slate-700'}`}>{stock} un</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Floating Cart Bar when Cart is Collapsed or in Catalog View */}
          {cart.length > 0 && (isCartCollapsed || mobileTab === 'CATALOG') && (
            <div className="p-3 bg-white/95 backdrop-blur-xs border-t border-slate-200 flex items-center justify-between gap-3 shadow-lg shrink-0 animate-in slide-in-from-bottom-2 duration-200">
              <div 
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setMobileTab('CART');
                  } else {
                    setIsCartCollapsed(false);
                  }
                }}
                className="flex items-center gap-3 cursor-pointer group"
                title="Hacer clic para ver el desglose completo del carrito"
              >
                <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs">
                  <ShoppingCart className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {cart.reduce((sum, i) => sum + i.quantity, 0)} {cart.reduce((sum, i) => sum + i.quantity, 0) === 1 ? 'producto' : 'productos'}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded-md">
                      Ver detalle
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-black text-slate-900 font-mono">${totalUsd.toFixed(2)}</span>
                    <span className="text-[11px] font-bold text-slate-400 font-mono">({totalVes.toLocaleString('es-VE')} Bs.)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setMobileTab('CART');
                    } else {
                      setIsCartCollapsed(false);
                    }
                  }}
                  className="hidden sm:flex items-center gap-1 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Expandir Carrito</span>
                </button>

                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  disabled={isSubmittingSale || !!invoiceRangeError}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cobrar (${totalUsd.toFixed(2)})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Cart, Client selection and Totals panel */}
        <div className={`w-full lg:w-96 xl:w-104 bg-slate-50/50 flex-col shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 transition-all duration-300 ${
          mobileTab === 'CART' 
            ? 'flex flex-1' 
            : isCartCollapsed 
            ? 'hidden' 
            : 'hidden lg:flex'
        }`}>
          {/* Active Cashier Shift Banner */}
          <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setMobileTab('CATALOG');
                  } else {
                    setIsCartCollapsed(true);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                title="Ocultar Carrito y volver al Catálogo"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">Cajero en Turno</span>
                <span className="text-xs font-bold text-slate-800 truncate block">{user?.full_name || 'Cajero'}</span>
              </div>
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
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-semibold">Tasa (VES/USD)</span>
                <Link
                  href="/settings/company"
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 hover:border-indigo-200 px-1.5 py-0.5 rounded-md transition-all flex items-center gap-0.5"
                  title="Configurar tasa en Ajustes de Empresa & Divisas"
                >
                  ⚙️ Configurar
                </Link>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  className="w-24 text-right text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  title="Tasa de cambio aplicada a esta venta"
                />
                <span className="text-[10px] font-bold text-slate-400 font-mono">Bs.</span>
              </div>
            </div>
          </div>

          {/* Cart Items list */}
          <div className="flex-1 min-h-0 p-4 overflow-y-auto custom-scrollbar space-y-3">
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
                {cart.map((item, idx) => (
                  <div key={`${item.product.id}-${item.variation?.name || 'main'}-${idx}`} className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-800 text-sm truncate">{item.product.name}</h5>
                      {item.variation && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                            {item.variation.name}
                          </span>
                          {item.variation.sku && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {item.variation.sku}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-semibold text-primary-600">${item.product.priceUsd.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({(item.product.priceUsd * exchangeRate).toFixed(2)} Bs.)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1, item.variation?.name)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1, item.variation?.name)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.variation?.name)}
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
                <div className="text-xs font-semibold text-slate-500">
                  {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                </div>
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
                  <div className="flex gap-2">
                    <select
                      value={clientDocType}
                      onChange={(e) => setClientDocType(e.target.value)}
                      className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shrink-0"
                    >
                      <option value="V">V- (Venezolano)</option>
                      <option value="J">J- (Jurídico / Empresa)</option>
                      <option value="E">E- (Extranjero)</option>
                      <option value="G">G- (Gubernamental)</option>
                      <option value="P">P- (Pasaporte)</option>
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 18392019 o 309481920"
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold"
                      value={clientDocNumber}
                      onChange={(e) => setClientDocNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Sector donde vive / Municipio <span className="text-rose-500">*</span>
                  </label>
                  <SectorAutocompleteInput
                    required
                    value={clientForm.address}
                    placeholder="Ej. 5 de Julio, San Jacinto, La Coromoto, Delicias..."
                    onChange={(val) => setClientForm({ ...clientForm, address: val })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Correo Electrónico (Opcional)
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
                      Teléfono de Contacto (Opcional)
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

      {/* Mandatory Client Identification Modal (Sally Enterprise UX Standard) */}
      {isIdentifyModalOpen && (
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
                    Identificación del Cliente
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Ingrese la Cédula o RIF antes de proceder al cobro
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsIdentifyModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
              {identifyError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2 shadow-2xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{identifyError}</span>
                </div>
              )}

              {/* Tax ID Search / Prompt with Type Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Cédula de Identidad / RIF <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Tipo predeterminado: V-</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={identifyDocType}
                    onChange={(e) => handleIdentifySearch(e.target.value, identifyDocNumber)}
                    className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shrink-0"
                  >
                    <option value="V">V- (Venezolano)</option>
                    <option value="J">J- (Jurídico / Empresa)</option>
                    <option value="E">E- (Extranjero)</option>
                    <option value="G">G- (Gubernamental)</option>
                    <option value="P">P- (Pasaporte)</option>
                  </select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ingrese solo números (Ej. 18392019)"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold"
                      value={identifyDocNumber}
                      onChange={(e) => handleIdentifySearch(identifyDocType, e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                    />
                  </div>
                </div>
              </div>

              {/* CASE 1: Customer Found */}
              {identifyClientFound && (
                <div className="p-4 bg-gradient-to-br from-emerald-50/90 via-slate-50 to-teal-50/50 border border-emerald-200/80 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Cliente Registrado
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                      {identifyClientFound.tax_id}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {identifyClientFound.name}
                    </h4>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{identifyClientFound.address || 'Sector no especificado'}</span>
                    </p>
                    {identifyClientFound.phone && (
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        📞 {identifyClientFound.phone}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectIdentifiedClientAndProceed(identifyClientFound)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-200 text-sm cursor-pointer active:scale-98"
                  >
                    <span>Continuar al Pago</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* CASE 2: Customer NOT found -> New registration form */}
              {identifyDocNumber.trim().length >= 3 && !identifyClientFound && (
                <form onSubmit={handleRegisterAndProceedWithIdentifiedClient} className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                    <p className="font-semibold">⚠️ {identifyDocType}-{identifyDocNumber} no está registrado previamente.</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Complete los datos para registrarlo e identificarlo en esta venta:</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Razón Social / Nombre Completo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carlos Mendoza o Inversiones Los Andes C.A."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
                      value={identifyNewClient.name}
                      onChange={(e) => setIdentifyNewClient({ ...identifyNewClient, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      Sector donde vive / Municipio <span className="text-rose-500">*</span>
                    </label>
                    <SectorAutocompleteInput
                      required
                      value={identifyNewClient.address}
                      placeholder="Ej. 5 de Julio, San Jacinto, La Coromoto, Delicias..."
                      onChange={(val) => setIdentifyNewClient({ ...identifyNewClient, address: val })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Teléfono (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="0414-1234567"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                        value={identifyNewClient.phone}
                        onChange={(e) => setIdentifyNewClient({ ...identifyNewClient, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Correo (Opcional)
                      </label>
                      <input
                        type="email"
                        placeholder="cliente@ejemplo.com"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={identifyNewClient.email}
                        onChange={(e) => setIdentifyNewClient({ ...identifyNewClient, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isIdentifyingLoading}
                      className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 text-sm cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {isIdentifyingLoading && <Loader2 className="animate-spin h-4 w-4" />}
                      <span>{isIdentifyingLoading ? 'Registrando...' : 'Registrar y Proceder al Pago'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer Fijo */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setIsIdentifyModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-sm"
              >
                Cancelar
              </button>
            </div>
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
                
                {/* Client Information Header Badge */}
                {selectedClient && (
                  <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm truncate">{selectedClient.name}</span>
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 shrink-0">
                            {selectedClient.tax_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span>{selectedClient.address || 'Sector no especificado'}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsConfirmModalOpen(false);
                        const parts = selectedClient.tax_id.split('-');
                        if (parts.length === 2) {
                          setIdentifyDocType(parts[0]);
                          setIdentifyDocNumber(parts[1]);
                        } else {
                          setIdentifyDocType('V');
                          setIdentifyDocNumber(selectedClient.tax_id);
                        }
                        setIdentifyClientFound(selectedClient);
                        setIsIdentifyModalOpen(true);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline shrink-0 ml-2"
                    >
                      Cambiar
                    </button>
                  </div>
                )}

                {/* Luminous Summary Banner with explicit Tax (IVA) breakdown */}
                <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/60 border border-indigo-100/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white/95 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Total USD</span>
                      <div className="font-mono font-black text-lg sm:text-2xl text-slate-900 tracking-tight">
                        ${totalUsd.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1">Total VES</span>
                      <div className="font-mono font-black text-lg sm:text-2xl text-indigo-700 tracking-tight">
                        Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Explicit breakdown of Base, Descuento, IVA and Tasa */}
                  <div className="pt-2 border-t border-indigo-100/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 bg-white/60 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Subtotal Base:</span>
                      <span className="font-mono font-bold text-slate-800">${subtotal.toFixed(2)}</span>
                    </div>
                    {discountPercent > 0 ? (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-rose-500 block">Desc. ({discountPercent}%):</span>
                        <span className="font-mono font-bold text-rose-600">-${discountAmount.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Descuento:</span>
                        <span className="font-mono font-bold text-slate-500">$0.00</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Impuesto (IVA):</span>
                      <span className="font-mono font-bold text-slate-800">${taxAmount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Tasa BCV:</span>
                      <span className="font-mono font-bold text-indigo-700">Bs. {exchangeRate.toFixed(2)}</span>
                    </div>
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
                          const { paidUsd } = getTotalsFromLines();
                          const remaining = Math.max(0, Number((totalUsd - paidUsd).toFixed(2)));
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
                                    const nextMethod = e.target.value;
                                    const nextCurrency = nextMethod.endsWith('VES') || nextMethod === 'PAGO_MOVIL' || nextMethod === 'TARJETA_DEBITO' ? 'VES' : 'USD';
                                    const prevCurrency = line.currency;
                                    
                                    let newAmount = line.amountOriginal;
                                    // Automatic exact conversion between currencies when user switches payment method
                                    if (prevCurrency === 'USD' && nextCurrency === 'VES') {
                                      newAmount = Number((line.amountOriginal * exchangeRate).toFixed(2));
                                    } else if (prevCurrency === 'VES' && nextCurrency === 'USD') {
                                      newAmount = Number((line.amountOriginal / exchangeRate).toFixed(2));
                                    }

                                    setPaymentLines(paymentLines.map((l, i) => i === idx ? { 
                                      ...l, 
                                      paymentMethod: nextMethod, 
                                      currency: nextCurrency,
                                      amountOriginal: newAmount
                                    } : l));
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
                                <CurrencyInput
                                  value={line.amountOriginal}
                                  onChange={(val) => {
                                    setPaymentLines(paymentLines.map((l, i) => i === idx ? { ...l, amountOriginal: val } : l));
                                  }}
                                  placeholder="0.00"
                                  currencyPrefix={line.currency === 'USD' ? '$' : 'Bs.'}
                                  className="p-2 text-xs font-mono font-bold"
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
                    const { paidUsd, paidVes } = getTotalsFromLines();
                    const remainingUsd = Number((totalUsd - paidUsd).toFixed(4));
                    const remainingVes = Number((totalVes - paidVes).toFixed(2));

                    return (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold uppercase">Total a pagar:</span>
                          <span className="font-mono font-black text-slate-800">${totalUsd.toFixed(2)} / Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold uppercase">Total recibido:</span>
                          <span className="font-mono font-black text-indigo-700">${paidUsd.toFixed(2)} / Bs. {paidVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        {remainingUsd > 0.009 ? (
                          <div className="flex justify-between items-center p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-bold">
                            <span>Resta cobrar:</span>
                            <span className="font-mono">${Math.max(0, remainingUsd).toFixed(2)} / Bs. {Math.max(0, remainingVes).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        ) : remainingUsd < -0.009 ? (
                          <div className="space-y-2.5 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
                            <div className="flex justify-between items-center font-bold">
                              <span>Vuelto a entregar:</span>
                              <span className="font-mono">
                                {changeCurrency === 'USD'
                                  ? `$ ${Math.abs(remainingUsd).toFixed(2)}`
                                  : `Bs. ${Math.abs(remainingVes).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
                  <>
                    <p className="flex justify-between">
                      <span className="text-slate-500">RIF/C.I.:</span>
                      <span className="font-bold text-slate-900">{completedSale.client.tax_id}</span>
                    </p>
                    {completedSale.client.address && (
                      <p className="flex justify-between">
                        <span className="text-slate-500">Sector/Dir.:</span>
                        <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">{completedSale.client.address}</span>
                      </p>
                    )}
                  </>
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
      {/* Variation Selection Modal (Sally Enterprise UX Standard) */}
      {variationModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Fijo */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/30 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl p-3 shadow-md shadow-indigo-100 flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Seleccionar Variación
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {variationModalProduct.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVariationModalProduct(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Variations List */}
            <div className="p-6 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                <span>Variantes Disponibles</span>
                <span className="font-mono text-slate-600 font-semibold">{variationModalProduct.variations?.length || 0} opciones</span>
              </div>

              <div className="space-y-2">
                {/* Opción Producto Base (General) */}
                <div
                  onClick={() => addToCart(variationModalProduct, { name: 'Estándar / Base', quantity: variationModalProduct.current_stock ?? 0 })}
                  className="p-3.5 rounded-xl border border-slate-200/90 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-between gap-3 cursor-pointer group bg-white shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      Producto Base (General)
                    </h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Stock Global: <strong className="text-slate-800 font-mono">{variationModalProduct.current_stock ?? 0} un</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 font-mono leading-tight">
                        ${(variationModalProduct.priceUsd ?? 0).toFixed(2)}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 font-mono">
                        Bs. {((variationModalProduct.priceUsd ?? 0) * exchangeRate).toFixed(2)}
                      </div>
                    </div>
                    <div className="p-2 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white rounded-xl transition-all">
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Lista de Variaciones Específicas */}
                {variationModalProduct.variations?.map((v, idx) => (
                  <div
                    key={idx}
                    onClick={() => addToCart(variationModalProduct, v)}
                    className="p-3.5 rounded-xl border border-slate-200/90 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-between gap-3 cursor-pointer group bg-white shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {v.name}
                        </h5>
                        {v.sku && (
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                            {v.sku}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md font-mono">
                          Stock: {v.quantity ?? 0} un
                        </span>
                        {v.unit_cost !== undefined && v.unit_cost > 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Costo: ${v.unit_cost.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900 font-mono leading-tight">
                          ${(variationModalProduct.priceUsd ?? 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 font-mono">
                          Bs. {((variationModalProduct.priceUsd ?? 0) * exchangeRate).toFixed(2)}
                        </div>
                      </div>
                      <div className="p-2 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white rounded-xl transition-all">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Fijo */}
            <div className="flex justify-end items-center px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setVariationModalProduct(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-all text-sm cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS Barcode & QR Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => handleScanProductInPos(code)}
      />

      {/* Real-time Scan Notification Toast */}
      {scanToast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 backdrop-blur-xs border ${
          scanToast.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20' 
            : scanToast.type === 'warning'
            ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20'
            : 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'
        }`}>
          {scanToast.type === 'success' && <Check className="w-4 h-4" />}
          {scanToast.type === 'warning' && <AlertCircle className="w-4 h-4" />}
          {scanToast.type === 'error' && <X className="w-4 h-4" />}
          <span>{scanToast.message}</span>
        </div>
      )}
    </div>
  );
};
