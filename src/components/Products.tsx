/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useAppState } from '../context/StateContext';
import { Product, PurchaseItem } from '../types';
import { formatRupiah, formatDate, exportToCSV } from '../data';
import { findMatchingSiskaperbapoItem } from '../data/siskaperbapoKediri';
import { 
  Package, 
  Search, 
  Tag, 
  Filter, 
  Edit3, 
  History, 
  Download, 
  X, 
  Check, 
  Truck, 
  FileText, 
  Layers, 
  Info,
  ChevronRight,
  TrendingUp,
  Boxes,
  Barcode,
  Store
} from 'lucide-react';

// Default categories list for selection
const DEFAULT_CATEGORIES = [
  'Tepung & Olahan',
  'Bumbu Dapur',
  'Bahan Pokok',
  'Minyak & Lemak',
  'Minuman & Konsumsi',
  'Kemasan & Perlengkapan',
  'Umum / Lainnya'
];

// Helper auto-detect category based on item name keywords
const detectCategory = (itemName: string): string => {
  const name = itemName.toLowerCase();
  if (name.includes('tepung') || name.includes('terigu') || name.includes('maizena') || name.includes('tapioka') || name.includes('sagu')) {
    return 'Tepung & Olahan';
  }
  if (name.includes('royco') || name.includes('masako') || name.includes('bumbu') || name.includes('garam') || name.includes('penyedap') || name.includes('ladaku') || name.includes('ketumbar')) {
    return 'Bumbu Dapur';
  }
  if (name.includes('minyak') || name.includes('margarine') || name.includes('mentega') || name.includes('palmia') || name.includes('bimoli') || name.includes('sania')) {
    return 'Minyak & Lemak';
  }
  if (name.includes('gula') || name.includes('beras') || name.includes('telur') || name.includes('gandum')) {
    return 'Bahan Pokok';
  }
  if (name.includes('kopi') || name.includes('teh') || name.includes('susu') || name.includes('sirup') || name.includes('air') || name.includes('marjan')) {
    return 'Minuman & Konsumsi';
  }
  if (name.includes('plastik') || name.includes('dus') || name.includes('kertas') || name.includes('kemasan') || name.includes('box') || name.includes('kantong')) {
    return 'Kemasan & Perlengkapan';
  }
  return 'Umum / Lainnya';
};

interface AggregatedProduct {
  id: string; // Product ID (or slug from normalized name)
  itemName: string;
  itemCode: string;
  category: string;
  unit: string;
  notes?: string;
  totalQty: number; // Total Terbeli
  totalSoldQty: number; // Total Terjual
  currentStock: number; // Stok Saat Ini (totalQty - totalSoldQty)
  totalCost: number;
  purchaseCount: number;
  latestPurchaseDate: string;
  latestPrice: number;
  avgPrice: number;
  latestSellingPrice: number;
  suppliers: string[];
  history: {
    purchaseId: string;
    purchaseDate: string;
    invoiceNumber: string;
    supplierName: string;
    quantity: number;
    unit: string;
    price: number;
    total: number;
    sellingPrice?: number;
  }[];
}

export default function Products() {
  const { purchases, suppliers, products, updateProduct, currentUser } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'qty' | 'stock' | 'cost' | 'latestPrice'>('name');

  // Modal states
  const [editingProduct, setEditingProduct] = useState<AggregatedProduct | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [historyProduct, setHistoryProduct] = useState<AggregatedProduct | null>(null);

  // 1. Aggregate all items from all purchases
  const aggregatedProducts = useMemo(() => {
    const productMap: { [key: string]: AggregatedProduct } = {};

    // Sort purchases by date ascending first so latest values override naturally
    const sortedPurchases = [...purchases].sort(
      (a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
    );

    let productIndex = 1;

    sortedPurchases.forEach((purchase) => {
      const supplierName = suppliers.find((s) => s.id === purchase.supplierId)?.name || 'Supplier General';

      (purchase.items || []).forEach((item) => {
        if (!item.itemName) return;
        const rawName = item.itemName.trim();
        const cleanKey = rawName.toLowerCase().replace(/[^a-z0-9]/g, '') || rawName.toLowerCase();

        // Check if there's a custom stored metadata in products array
        const storedProd = products.find(
          (p) => p.itemName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanKey || p.id === `prd-${cleanKey}`
        );

        if (!productMap[cleanKey]) {
          const defaultCode = storedProd?.itemCode || `PRD-${String(productIndex++).padStart(3, '0')}`;
          const defaultCat = storedProd?.category || detectCategory(rawName);
          const prodId = storedProd?.id || `prd-${cleanKey}`;

          productMap[cleanKey] = {
            id: prodId,
            itemName: rawName,
            itemCode: defaultCode,
            category: defaultCat,
            unit: storedProd?.unit || item.unit || 'Pcs',
            notes: storedProd?.notes || '',
            totalQty: 0,
            totalSoldQty: 0,
            currentStock: 0,
            totalCost: 0,
            purchaseCount: 0,
            latestPurchaseDate: purchase.purchaseDate,
            latestPrice: item.price,
            avgPrice: 0,
            latestSellingPrice: item.sellingPrice !== undefined ? item.sellingPrice : item.price,
            suppliers: [],
            history: []
          };
        }

        const prod = productMap[cleanKey];
        prod.totalQty += item.quantity;
        const itemSoldQty = (item.salesRecords && item.salesRecords.length > 0)
          ? item.salesRecords.reduce((sum, r) => sum + (r.quantity || 0), 0)
          : (item.soldQuantity !== undefined ? item.soldQuantity : 0);
        prod.totalSoldQty += itemSoldQty;
        prod.totalCost += item.total;
        prod.purchaseCount += 1;
        prod.latestPurchaseDate = purchase.purchaseDate;
        prod.latestPrice = item.price;
        if (item.sellingPrice !== undefined) {
          prod.latestSellingPrice = item.sellingPrice;
        }

        if (!prod.suppliers.includes(supplierName)) {
          prod.suppliers.push(supplierName);
        }

        prod.history.push({
          purchaseId: purchase.id,
          purchaseDate: purchase.purchaseDate,
          invoiceNumber: purchase.invoiceNumber,
          supplierName,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          total: item.total,
          sellingPrice: item.sellingPrice
        });
      });
    });

    // Compute average price, current stock, and convert to array
    const result = Object.values(productMap).map((prod) => {
      prod.currentStock = prod.totalQty - prod.totalSoldQty;
      prod.avgPrice = prod.totalQty > 0 ? prod.totalCost / prod.totalQty : prod.latestPrice;
      // Reverse history so newest purchases appear on top
      prod.history.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
      return prod;
    });

    return result;
  }, [purchases, suppliers, products]);

  // Extract all categories available in the current dataset
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    aggregatedProducts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [aggregatedProducts]);

  // 2. Filter & Sort products
  const filteredProducts = useMemo(() => {
    return aggregatedProducts
      .filter((p) => {
        const matchesSearch =
          p.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.suppliers.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.itemName.localeCompare(b.itemName);
        if (sortBy === 'code') return a.itemCode.localeCompare(b.itemCode);
        if (sortBy === 'stock') return b.currentStock - a.currentStock;
        if (sortBy === 'qty') return b.totalQty - a.totalQty;
        if (sortBy === 'cost') return b.totalCost - a.totalCost;
        if (sortBy === 'latestPrice') return b.latestPrice - a.latestPrice;
        return 0;
      });
  }, [aggregatedProducts, searchQuery, categoryFilter, sortBy]);

  // Top KPI Metrics
  const totalProductsCount = aggregatedProducts.length;
  const totalCategoriesCount = availableCategories.length;
  const totalPurchasedVolume = aggregatedProducts.reduce((sum, p) => sum + p.totalQty, 0);
  const totalCurrentStockVolume = aggregatedProducts.reduce((sum, p) => sum + p.currentStock, 0);
  const totalPurchasedValue = aggregatedProducts.reduce((sum, p) => sum + p.totalCost, 0);

  // Open Edit Modal
  const handleOpenEdit = (product: AggregatedProduct) => {
    setEditingProduct(product);
    setEditCode(product.itemCode);
    setEditCategory(product.category);
    setCustomCategoryInput('');
    setEditNotes(product.notes || '');
  };

  // Save Product Code & Category Edit
  const handleSaveProductEdit = () => {
    if (!editingProduct) return;

    const finalCategory = editCategory === 'custom' ? customCategoryInput.trim() : editCategory;

    const updatedProductData: Product = {
      id: editingProduct.id,
      itemName: editingProduct.itemName,
      itemCode: editCode.trim() || editingProduct.itemCode,
      category: finalCategory || editingProduct.category,
      unit: editingProduct.unit,
      notes: editNotes.trim(),
    };

    updateProduct(updatedProductData);
    setEditingProduct(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Kode Barang',
      'Nama Barang',
      'Kategori',
      'Satuan',
      'Stok Saat Ini',
      'Total Qty Terbeli',
      'Total Qty Terjual',
      'Frekuensi Pembelian',
      'Harga Beli Terbaru (IDR)',
      'Harga Beli Rata-Rata (IDR)',
      'Harga Jual Terbaru (IDR)',
      'Total Nilai Belanja (IDR)',
      'Supplier Terkait'
    ];

    const data = filteredProducts.map((p) => [
      p.itemCode,
      p.itemName,
      p.category,
      p.unit,
      p.currentStock.toString(),
      p.totalQty.toString(),
      p.totalSoldQty.toString(),
      p.purchaseCount.toString(),
      p.latestPrice.toString(),
      Math.round(p.avgPrice).toString(),
      p.latestSellingPrice.toString(),
      p.totalCost.toString(),
      p.suppliers.join('; ')
    ]);

    exportToCSV('Database_Master_Produk_Koperasi', headers, data);
  };

  // Category badge color mapper
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Tepung & Olahan':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Bumbu Dapur':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Bahan Pokok':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Minyak & Lemak':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'Minuman & Konsumsi':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Kemasan & Perlengkapan':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-sans">
              Database Master Produk & Barang
            </h1>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
              {totalProductsCount} Jenis Item
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Katalog lengkap seluruh barang yang pernah tercatat dalam Buku Pembelian, dilengkapi Kode Barang (SKU), Kategori, &amp; Riwayat Harga.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer self-start md:self-center"
        >
          <Download className="w-4 h-4 text-gray-500" />
          <span>Ekspor Database (.CSV)</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Master Produk */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-sans">Master Barang</p>
            <h3 className="text-xl font-extrabold text-gray-900 font-sans mt-0.5">{totalProductsCount} Item</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Tercatat di Pembelian</p>
          </div>
        </div>

        {/* Card 2: Total Kategori */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-sans">Total Kategori</p>
            <h3 className="text-xl font-extrabold text-gray-900 font-sans mt-0.5">{totalCategoriesCount} Kelompok</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Klasifikasi Barang</p>
          </div>
        </div>

        {/* Card 3: Total Stok Tersisa (Saat Ini) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-sans">Stok Tersisa Saat Ini</p>
            <h3 className="text-xl font-extrabold text-emerald-950 font-sans mt-0.5">{totalCurrentStockVolume.toLocaleString('id-ID')} Unit</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Total Terbeli: {totalPurchasedVolume.toLocaleString('id-ID')} Unit</p>
          </div>
        </div>

        {/* Card 4: Total Belanja IDR */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-sans">Total Nilai Pembelian</p>
            <h3 className="text-base font-extrabold text-gray-900 font-mono mt-0.5">{formatRupiah(totalPurchasedValue)}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Nilai Belanja Barang</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama barang, kode SKU, atau supplier..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Sort controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs text-gray-600">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent focus:outline-hidden font-medium text-gray-700 cursor-pointer"
            >
              <option value="all">Semua Kategori ({availableCategories.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs text-gray-600">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent focus:outline-hidden font-medium text-gray-700 cursor-pointer"
            >
              <option value="name">Urut: Nama Barang (A-Z)</option>
              <option value="code">Urut: Kode Barang</option>
              <option value="stock">Urut: Stok Tersisa (Terbanyak)</option>
              <option value="qty">Urut: Stok Terbeli Terbanyak</option>
              <option value="cost">Urut: Nilai Belanja Terbesar</option>
              <option value="latestPrice">Urut: Harga Beli Terbaru</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <Package className="w-12 h-12 text-gray-300 mx-auto stroke-1" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Tidak ada produk ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Coba ubah kata kunci pencarian atau filter kategori Anda.'
                  : 'Belum ada data barang dalam Buku Pembelian.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-sans">Kode Barang</th>
                  <th className="py-3.5 px-4 font-sans">Nama Barang</th>
                  <th className="py-3.5 px-4 font-sans">Kategori</th>
                  <th className="py-3.5 px-4 font-sans text-center">Satuan</th>
                  <th className="py-3.5 px-4 font-sans text-right">Stok Saat Ini</th>
                  <th className="py-3.5 px-4 font-sans text-right">Harga Beli Terbaru</th>
                  <th className="py-3.5 px-4 font-sans text-right">Harga Beli Rata-Rata</th>
                  <th className="py-3.5 px-4 font-sans text-right">Harga Jual Saat Ini</th>
                  <th className="py-3.5 px-4 font-sans text-right">Siskaperbapo Kediri</th>
                  <th className="py-3.5 px-4 font-sans text-right">Total Terbeli</th>
                  <th className="py-3.5 px-4 font-sans text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p, idx) => {
                  const marginAmount = p.latestSellingPrice - p.latestPrice;
                  const marginPercent = p.latestPrice > 0 ? (marginAmount / p.latestPrice) * 100 : 0;
                  const siskaMatch = findMatchingSiskaperbapoItem(p.itemName);

                  return (
                    <tr key={`prod-row-${p.id}-${p.itemCode}-${idx}`} className="hover:bg-indigo-50/20 transition-colors group">
                      {/* Kode Barang */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-950 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100">
                          <Barcode className="w-3 h-3 text-indigo-500 shrink-0" />
                          {p.itemCode}
                        </span>
                      </td>

                      {/* Nama Barang & Supplier */}
                      <td className="py-3.5 px-4 align-middle max-w-xs">
                        <div className="font-bold text-gray-900 font-sans text-xs group-hover:text-indigo-900 transition-colors">
                          {p.itemName}
                        </div>
                        {p.suppliers.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5 truncate">
                            <Truck className="w-3 h-3 text-gray-300 shrink-0" />
                            <span className="truncate">{p.suppliers.join(', ')}</span>
                          </div>
                        )}
                      </td>

                      {/* Kategori */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full border ${getCategoryBadgeClass(p.category)}`}>
                          {p.category}
                        </span>
                      </td>

                      {/* Satuan */}
                      <td className="py-3.5 px-4 align-middle text-center font-mono text-gray-600">
                        {p.unit}
                      </td>

                      {/* Stok Saat Ini */}
                      <td className="py-3.5 px-4 align-middle text-right font-mono">
                        <div>
                          {p.currentStock <= 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 text-[11px]">
                              Habis ({p.currentStock} {p.unit})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-[11px]">
                              {p.currentStock.toLocaleString('id-ID')} {p.unit}
                            </span>
                          )}
                          <span className="text-[9px] text-gray-400 font-sans block mt-0.5">
                            Beli: {p.totalQty.toLocaleString('id-ID')} | Jual: {p.totalSoldQty.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </td>

                      {/* Harga Beli Terbaru */}
                      <td className="py-3.5 px-4 align-middle text-right font-mono font-bold text-gray-800">
                        {formatRupiah(p.latestPrice)}
                        <span className="text-[9px] text-gray-400 font-sans block font-normal">
                          Per {p.unit}
                        </span>
                      </td>

                      {/* Harga Beli Rata-Rata */}
                      <td className="py-3.5 px-4 align-middle text-right font-mono text-gray-600">
                        {formatRupiah(Math.round(p.avgPrice))}
                      </td>

                      {/* Harga Jual Saat Ini */}
                      <td className="py-3.5 px-4 align-middle text-right font-mono">
                        <span className="font-bold text-indigo-950">{formatRupiah(p.latestSellingPrice)}</span>
                        <span className={`text-[9px] font-bold block font-mono ${marginAmount >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {marginAmount >= 0 ? `+${formatRupiah(marginAmount)} (${marginPercent.toFixed(1)}%)` : `${formatRupiah(marginAmount)}`}
                        </span>
                      </td>

                      {/* Siskaperbapo Pasaran Kediri */}
                      <td className="py-3.5 px-4 align-middle text-right font-mono">
                        {siskaMatch ? (
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{formatRupiah(siskaMatch.priceKediri)}</span>
                            <span className="text-[9px] text-gray-400 font-sans block">Pasar Kab. Kediri</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-[10px] font-sans font-normal italic">-</span>
                        )}
                      </td>

                      {/* Total Akumulasi Terbeli */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <div className="font-bold text-gray-900 font-mono">
                          {p.totalQty.toLocaleString('id-ID')} {p.unit}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {formatRupiah(p.totalCost)} ({p.purchaseCount}x beli)
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Kode & Kategori */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100 cursor-pointer"
                            title="Edit Kode Barang & Kategori"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Detail Riwayat Pembelian */}
                          <button
                            onClick={() => setHistoryProduct(p)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100 cursor-pointer"
                            title="Lihat Riwayat Pembelian"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: EDIT KODE BARANG & KATEGORI */}
      {editingProduct && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Atur Kode Barang &amp; Kategori</h3>
                  <p className="text-[10px] text-gray-300 font-mono mt-0.5">{editingProduct.itemName}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Product Name Display */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Nama Barang Master</span>
                <span className="text-xs font-bold text-gray-900 font-sans block mt-0.5">{editingProduct.itemName}</span>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-2 pt-2 border-t border-slate-200/60">
                  <span>Satuan: <strong className="font-mono text-gray-700">{editingProduct.unit}</strong></span>
                  <span>&bull;</span>
                  <span>Total Terbeli: <strong className="font-mono text-gray-700">{editingProduct.totalQty} {editingProduct.unit}</strong></span>
                </div>
              </div>

              {/* Input Kode Barang */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Kode Barang / SKU <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  placeholder="Contoh: PRD-001, BRG-TPG-01"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono font-semibold text-indigo-950 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Kode unik barang untuk mempermudah pencarian dan pengelompokan laporan.
                </p>
              </div>

              {/* Input Kategori */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Kategori Barang <span className="text-rose-500">*</span>
                </label>
                <select
                  value={DEFAULT_CATEGORIES.includes(editCategory) ? editCategory : 'custom'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setEditCategory('custom');
                    } else {
                      setEditCategory(val);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-sans font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="custom">+ Tambah Kategori Baru...</option>
                </select>

                {/* Custom Category Input if selected */}
                {(editCategory === 'custom' || (!DEFAULT_CATEGORIES.includes(editCategory) && editCategory !== '')) && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={editCategory === 'custom' ? customCategoryInput : editCategory}
                      onChange={(e) => {
                        setEditCategory(e.target.value);
                        setCustomCategoryInput(e.target.value);
                      }}
                      placeholder="Ketikkan nama kategori baru..."
                      className="w-full px-3 py-2 border border-indigo-200 bg-indigo-50/20 rounded-xl text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Input Notes */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Keterangan spesifikasi produk, lokasi simpan, atau instruksi..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveProductEdit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RIWAYAT PEMBELIAN PRODUK */}
      {historyProduct && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Riwayat Pembelian Barang</h3>
                  <p className="text-[10px] text-gray-300 font-mono mt-0.5">{historyProduct.itemName}</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryProduct(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Product Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">Total Terbeli</span>
                  <span className="font-extrabold text-gray-900 font-mono">{historyProduct.totalQty} {historyProduct.unit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">Total Terjual</span>
                  <span className="font-extrabold text-amber-600 font-mono">{historyProduct.totalSoldQty} {historyProduct.unit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">Stok Saat Ini</span>
                  <span className={`font-extrabold font-mono ${historyProduct.currentStock <= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {historyProduct.currentStock} {historyProduct.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-medium block">Harga Beli Terbaru</span>
                  <span className="font-extrabold text-indigo-950 font-mono">{formatRupiah(historyProduct.latestPrice)}</span>
                </div>
              </div>

              {/* History Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Daftar Transaksi Nota Pembelian ({historyProduct.history.length})
                </h4>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                  {historyProduct.history.map((h, idx) => (
                    <div key={idx} className="p-3 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-950 font-bold">{h.invoiceNumber}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{formatDate(h.purchaseDate)}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-gray-400" />
                          <span>{h.supplierName}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-gray-900">{h.quantity} {h.unit}</span>
                        <span className="text-[11px] text-gray-500 font-mono block">
                          @ {formatRupiah(h.price)} = <strong className="text-indigo-950">{formatRupiah(h.total)}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryProduct(null)}
                className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
