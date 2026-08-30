'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '@/infrastructure/api/api-client';
import { STOCK_LEVEL_FILTERS, StockLevelFilter, PRODUCT_TAX_TYPES, ProductTaxType } from '@/constants/domain-constants';
import { InventoryProduct, ProductCategoryOption, SearchFieldScope, SortField, SortOrder } from '../types/stock.types';

export function useStockData() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategoryOption[]>([]);
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState<SearchFieldScope>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<StockLevelFilter>(STOCK_LEVEL_FILTERS.ALL);
  const [taxFilter, setTaxFilter] = useState<ProductTaxType | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit & Delete Modal States
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async (query = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/inventory/products', {
        params: query ? { name: query } : {}
      });
      const productList: InventoryProduct[] = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.items || []);
      setProducts(productList);
    } catch (err: any) {
      console.error('Error fetching stock products:', err);
      setError(err.response?.data?.message || 'Error al cargar la lista de stock. Por favor reintenta.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get('/inventory/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(search);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, fetchProducts]);

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSearchField('ALL');
    setSelectedCategory('ALL');
    setStockFilter(STOCK_LEVEL_FILTERS.ALL);
    setTaxFilter('ALL');
    setSortField('name');
    setSortOrder('asc');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/inventory/products/${deletingId}`);
      setProducts(prev => prev.filter(p => p.id !== deletingId));
      setDeletingId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al desactivar el producto.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed & Filtered Products with strict null safety
  const processedProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search Filter by Scope
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          if (searchField === 'SKU') {
            if (!(p.sku?.toLowerCase() ?? '').includes(q)) return false;
          } else if (searchField === 'NAME') {
            if (!(p.name?.toLowerCase() ?? '').includes(q)) return false;
          } else {
            const matchesSku = (p.sku?.toLowerCase() ?? '').includes(q);
            const matchesName = (p.name?.toLowerCase() ?? '').includes(q);
            if (!matchesSku && !matchesName) return false;
          }
        }

        // Category Filter
        if (selectedCategory !== 'ALL') {
          const catName = p.category ?? 'General';
          if (catName !== selectedCategory) return false;
        }

        // Stock Level Filter
        const currentStock = Number(p.current_stock ?? 0);
        if (stockFilter === STOCK_LEVEL_FILTERS.IN_STOCK && currentStock <= 10) return false;
        if (stockFilter === STOCK_LEVEL_FILTERS.LOW_STOCK && (currentStock <= 0 || currentStock > 10)) return false;
        if (stockFilter === STOCK_LEVEL_FILTERS.OUT_OF_STOCK && currentStock > 0) return false;

        // Tax Type Filter
        if (taxFilter === PRODUCT_TAX_TYPES.TAXABLE && p.tax_type !== PRODUCT_TAX_TYPES.TAXABLE && p.tax_type !== undefined) return false;
        if (taxFilter === PRODUCT_TAX_TYPES.EXEMPT && p.tax_type !== PRODUCT_TAX_TYPES.EXEMPT) return false;
        if (taxFilter === PRODUCT_TAX_TYPES.EXONERATED && p.tax_type !== PRODUCT_TAX_TYPES.EXONERATED) return false;

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'costUsd' || sortField === 'priceUsd' || sortField === 'current_stock') {
          valA = Number(valA ?? 0);
          valB = Number(valB ?? 0);
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }

        valA = String(valA ?? '').toLowerCase();
        valB = String(valB ?? '').toLowerCase();
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
  }, [products, search, searchField, selectedCategory, stockFilter, taxFilter, sortField, sortOrder]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  return {
    products,
    processedProducts,
    uniqueCategories,
    categories,
    search,
    setSearch,
    searchField,
    setSearchField,
    selectedCategory,
    setSelectedCategory,
    stockFilter,
    setStockFilter,
    taxFilter,
    setTaxFilter,
    sortField,
    sortOrder,
    isLoading,
    error,
    setError,
    editingProduct,
    setEditingProduct,
    deletingId,
    setDeletingId,
    isDeleting,
    handleToggleSort,
    handleResetFilters,
    handleDeleteConfirm,
    fetchProducts,
  };
}
