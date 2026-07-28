/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { Purchase, PurchaseItem } from '../types';
import { formatRupiah, formatDate, exportToCSV } from '../data';
import { Search, Eye, Edit2, Calendar, FileSpreadsheet, X, CheckCircle, Percent, DollarSign, TrendingUp, ShoppingBag, ArrowUpRight } from 'lucide-react';

export default function Sales() {
  const { purchases, suppliers, updatePurchaseItems } = useAppState();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const monthsList = [
    { value: 'all', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  const availableYears = Array.from(new Set(purchases.map(p => p.purchaseDate.split('-')[0]))).sort((a: string, b: string) => b.localeCompare(a)) as string[];
  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear().toString());
  }

  // Editing selling price Modal state
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [tempItems, setTempItems] = useState<PurchaseItem[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Detail viewer state
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  // Search Filter computation
  const filteredPurchases = purchases.filter(p => {
    const sName = suppliers.find(s => s.id === p.supplierId)?.name || 'N/A';
    const matchesSearch = p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.items.some(item => item.itemName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSupplier = supplierFilter === '' || p.supplierId === supplierFilter;
    const matchesStatus = statusFilter === '' || p.status === statusFilter;

    const [year, month] = p.purchaseDate.split('-');
    const matchesMonth = selectedMonth === 'all' || month === selectedMonth;
    const matchesYear = selectedYear === 'all' || year === selectedYear;

    return matchesSearch && matchesSupplier && matchesStatus && matchesMonth && matchesYear;
  });

  // Calculate projected values of a purchase
  const getPurchaseSalesMetrics = (p: Purchase) => {
    const costTotal = p.total;
    const salesTotal = p.items.reduce((sum, item) => {
      const sellPrice = item.sellingPrice !== undefined ? item.sellingPrice : item.price;
      const soldQty = item.soldQuantity !== undefined ? item.soldQuantity : item.quantity;
      return sum + (soldQty * sellPrice);
    }, 0);
    const profit = salesTotal - costTotal;
    const margin = costTotal > 0 ? (profit / costTotal) * 100 : 0;
    return { costTotal, salesTotal, profit, margin };
  };

  // KPI Calculations
  const kpiCostTotal = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  const kpiSalesTotal = filteredPurchases.reduce((sum, p) => {
    return sum + p.items.reduce((sumI, item) => {
      const sellPrice = item.sellingPrice !== undefined ? item.sellingPrice : item.price;
      const soldQty = item.soldQuantity !== undefined ? item.soldQuantity : item.quantity;
      return sumI + (soldQty * sellPrice);
    }, 0);
  }, 0);
  const kpiProfitTotal = kpiSalesTotal - kpiCostTotal;
  const kpiAverageMargin = kpiCostTotal > 0 ? (kpiProfitTotal / kpiCostTotal) * 100 : 0;

  const handleOpenEditModal = (p: Purchase) => {
    setEditingPurchase(p);
    // Deep copy items to avoid modifying state directly
    setTempItems(p.items.map(item => ({
      ...item,
      sellingPrice: item.sellingPrice !== undefined ? item.sellingPrice : item.price, // default to cost price if not set
      soldQuantity: item.soldQuantity !== undefined ? item.soldQuantity : item.quantity, // default to bought qty
      soldUnit: item.soldUnit !== undefined ? item.soldUnit : item.unit, // default to bought unit
      soldTo: item.soldTo !== undefined ? item.soldTo : '' // default to empty
    })));
    setErrorMessage('');
  };

  const handleTempItemFieldChange = (itemId: string, field: keyof PurchaseItem, val: string) => {
    setTempItems(prev => prev.map(item => {
      if (item.id === itemId) {
        if (field === 'sellingPrice') {
          return { ...item, sellingPrice: parseFloat(val) || 0 };
        } else if (field === 'soldQuantity') {
          return { ...item, soldQuantity: parseFloat(val) || 0 };
        } else if (field === 'soldUnit') {
          return { ...item, soldUnit: val };
        } else if (field === 'soldTo') {
          return { ...item, soldTo: val };
        }
      }
      return item;
    }));
  };

  const handleSaveSellingPrices = async () => {
    if (!editingPurchase) return;

    try {
      await updatePurchaseItems(editingPurchase.id, tempItems);
      setSuccessMessage(`Berhasil memperbarui rincian penjualan untuk Invoice ${editingPurchase.invoiceNumber}`);
      setEditingPurchase(null);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menyimpan perubahan');
    }
  };

  const handleCSVExport = () => {
    const headers = [
      'No Invoice',
      'Tanggal Pembelian',
      'Supplier',
      'Total Nilai Beli (Modal)',
      'Total Nilai Jual (Omset)',
      'Total Keuntungan (Profit)',
      'Margin %',
      'Status Pembayaran'
    ];
    const data = filteredPurchases.map(p => {
      const s = suppliers.find(s => s.id === p.supplierId);
      const metrics = getPurchaseSalesMetrics(p);
      return [
        p.invoiceNumber,
        p.purchaseDate,
        s?.name || 'N/A',
        metrics.costTotal.toString(),
        metrics.salesTotal.toString(),
        metrics.profit.toString(),
        metrics.margin.toFixed(2) + '%',
        p.status
      ];
    });
    exportToCSV('Buku_Penjualan_GMP_Rekap', headers, data);
  };

  const handleDetailedCSVExport = () => {
    const headers = [
      'Tanggal Pembelian',
      'No Invoice',
      'Supplier',
      'Nama Barang',
      'Qty Beli',
      'Satuan Beli',
      'Harga Beli',
      'Total Beli',
      'Harga Jual',
      'Qty Terjual',
      'Satuan Terjual',
      'Total Penjualan',
      'Dijual Ke (Tujuan)',
      'Profit Barang'
    ];
    const data: string[][] = [];
    filteredPurchases.forEach(p => {
      const s = suppliers.find(s => s.id === p.supplierId);
      p.items.forEach(item => {
        const sellPrice = item.sellingPrice !== undefined ? item.sellingPrice : item.price;
        const soldQty = item.soldQuantity !== undefined ? item.soldQuantity : item.quantity;
        const soldUnit = item.soldUnit !== undefined ? item.soldUnit : item.unit;
        const soldTo = item.soldTo || '-';
        const itemSalesTotal = soldQty * sellPrice;
        const itemCostTotal = item.total;
        const itemProfit = itemSalesTotal - itemCostTotal;

        data.push([
          p.purchaseDate,
          p.invoiceNumber,
          s?.name || 'N/A',
          item.itemName,
          item.quantity.toString(),
          item.unit,
          item.price.toString(),
          itemCostTotal.toString(),
          sellPrice.toString(),
          soldQty.toString(),
          soldUnit,
          itemSalesTotal.toString(),
          soldTo,
          itemProfit.toString()
        ]);
      });
    });
    exportToCSV('Rincian_Penjualan_GMP', headers, data);
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans">Buku Penjualan & Margin Keuntungan</h1>
          <p className="text-xs text-gray-500 font-sans">Rekap nilai jual barang koperasi, hitungan omset proyeksi, dan laba kotor penjualan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-2 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
            title="Ekspor rekap tingkat invoice"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Rekap (.CSV)</span>
          </button>
          <button
            onClick={handleDetailedCSVExport}
            className="flex items-center gap-2 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
            title="Ekspor rincian tiap barang terjual"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Ekspor Rincian Penjualan (.CSV)</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Modal Beli */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-sans">Total Modal Beli</span>
            <div className="p-2.5 rounded-xl bg-gray-50 text-gray-500">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-gray-900 font-mono">{formatRupiah(kpiCostTotal)}</h3>
            <p className="text-xs text-gray-400 mt-1">Berdasarkan total harga beli supplier</p>
          </div>
        </div>

        {/* KPI 2: Nilai Jual */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-sans">Proyeksi Omset Jual</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-gray-900 font-mono">{formatRupiah(kpiSalesTotal)}</h3>
            <p className="text-xs text-gray-400 mt-1">Berdasarkan akumulasi harga jual barang</p>
          </div>
        </div>

        {/* KPI 3: Keuntungan */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-sans">Estimasi Keuntungan</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-emerald-600 font-mono">{formatRupiah(kpiProfitTotal)}</h3>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span>Laba kotor potensial koperasi</span>
            </p>
          </div>
        </div>

        {/* KPI 4: Margin */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-sans">Margin Rata-rata</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-gray-900 font-mono">{kpiAverageMargin.toFixed(1)}%</h3>
            <p className="text-xs text-gray-400 mt-1">Rasio keuntungan dari modal belanja</p>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="search-sales-input"
            type="text"
            placeholder="Cari nomor invoice atau nama barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex gap-2 shrink-0 flex-wrap">
          <select
            id="month-sales-filter"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-150 rounded-xl px-3 py-2 text-xs bg-white text-gray-600 outline-hidden cursor-pointer"
          >
            {monthsList.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
            id="year-sales-filter"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-150 rounded-xl px-3 py-2 text-xs bg-white text-gray-600 outline-hidden cursor-pointer"
          >
            <option value="all">Semua Tahun</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          <select
            id="supplier-sales-filter"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="border border-gray-150 rounded-xl px-3 py-2 text-xs bg-white text-gray-600 outline-hidden cursor-pointer"
          >
            <option value="">Semua Supplier</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            id="status-sales-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-150 rounded-xl px-3 py-2 text-xs bg-white text-gray-600 outline-hidden cursor-pointer"
          >
            <option value="">Semua Status Pembayaran</option>
            <option value="Lunas">Lunas</option>
            <option value="Sebagian">Sebagian</option>
            <option value="Belum Lunas">Belum Lunas</option>
          </select>

          {(selectedMonth !== 'all' || selectedYear !== 'all') && (
            <button
              onClick={() => {
                setSelectedMonth('all');
                setSelectedYear('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline cursor-pointer pl-1 self-center"
            >
              Reset Waktu
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100 font-sans font-semibold">
                <th className="p-4">Invoice / Tanggal</th>
                <th className="p-4">Supplier</th>
                <th className="p-4 text-right">Modal Beli (A)</th>
                <th className="p-4 text-right">Nilai Jual (B)</th>
                <th className="p-4 text-right">Keuntungan (B - A)</th>
                <th className="p-4 text-center">Rasio Margin</th>
                <th className="p-4 text-center">Status Pembayaran</th>
                <th className="p-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 italic">
                    Belum ada transaksi pembelian terdokumentasi yang cocok dengan pencarian / filter ini.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const s = suppliers.find(s => s.id === p.supplierId);
                  const metrics = getPurchaseSalesMetrics(p);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 font-mono text-[12px]">{p.invoiceNumber}</div>
                        <div className="text-gray-400 mt-0.5 text-[10px]">{formatDate(p.purchaseDate)}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{s?.name || 'N/A'}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{s?.code || '-'}</div>
                      </td>
                      <td className="p-4 text-right font-semibold text-gray-900 font-mono text-[11px]">
                        {formatRupiah(metrics.costTotal)}
                      </td>
                      <td className="p-4 text-right font-semibold text-indigo-950 font-mono text-[11px]">
                        {formatRupiah(metrics.salesTotal)}
                      </td>
                      <td className={`p-4 text-right font-bold font-mono text-[11px] ${metrics.profit > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {formatRupiah(metrics.profit)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          metrics.margin > 20 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : metrics.margin > 0 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                            : 'bg-gray-50 text-gray-500 border border-gray-200'
                        }`}>
                          +{metrics.margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.status === 'Lunas' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : p.status === 'Sebagian' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingPurchase(p)}
                            className="p-1.5 bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Detail Barang"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 bg-gray-50 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Atur Harga Jual"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: EDIT SELLING PRICES */}
      {editingPurchase && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-950 text-white">
              <div>
                <h3 className="text-md font-bold">Atur Nilai & Rincian Penjualan</h3>
                <p className="text-[11px] text-gray-300 mt-0.5">Invoice: {editingPurchase.invoiceNumber}</p>
              </div>
              <button 
                onClick={() => setEditingPurchase(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-2 rounded-xl">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-sans">
                  Tentukan harga jual, jumlah barang yang terjual beserta satuannya, serta ke mana barang tersebut disalurkan/dijual untuk menghitung laporan laba kotor yang presisi.
                </p>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {tempItems.map((item) => {
                    const defaultSellingPrice = item.sellingPrice !== undefined ? item.sellingPrice : item.price;
                    const defaultSoldQty = item.soldQuantity !== undefined ? item.soldQuantity : item.quantity;
                    const defaultSoldUnit = item.soldUnit !== undefined ? item.soldUnit : item.unit;
                    const defaultSoldTo = item.soldTo !== undefined ? item.soldTo : '';

                    return (
                      <div key={item.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-3.5 hover:border-indigo-100 hover:bg-indigo-50/5 transition-all">
                        {/* Item Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md mb-1">
                              Barang Belanja
                            </span>
                            <h4 className="text-xs font-bold text-gray-900 font-sans">{item.itemName}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              Stok Masuk: <span className="font-mono text-gray-700 font-semibold">{item.quantity} {item.unit}</span> @ <span className="font-mono text-gray-700 font-semibold">{formatRupiah(item.price)}</span> (Total: {formatRupiah(item.total)})
                            </p>
                          </div>
                          <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-dashed border-gray-200">
                            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">Subtotal Penjualan</span>
                            <span className="text-xs font-bold text-indigo-950 font-mono">
                              {formatRupiah(defaultSoldQty * defaultSellingPrice)}
                            </span>
                          </div>
                        </div>

                        {/* Input Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2.5 border-t border-dashed border-gray-200/60">
                          {/* Harga Jual */}
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Harga Jual (IDR/Unit)</label>
                            <input
                              type="number"
                              value={item.sellingPrice !== undefined ? item.sellingPrice : ''}
                              onChange={(e) => handleTempItemFieldChange(item.id, 'sellingPrice', e.target.value)}
                              placeholder="Harga Jual"
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>

                          {/* Qty Terjual */}
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Qty Terjual</label>
                            <input
                              type="number"
                              value={item.soldQuantity !== undefined ? item.soldQuantity : ''}
                              onChange={(e) => handleTempItemFieldChange(item.id, 'soldQuantity', e.target.value)}
                              placeholder={`Maks ${item.quantity}`}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>

                          {/* Satuan Terjual */}
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Satuan Terjual</label>
                            <input
                              type="text"
                              value={item.soldUnit || ''}
                              onChange={(e) => handleTempItemFieldChange(item.id, 'soldUnit', e.target.value)}
                              placeholder={item.unit}
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>

                          {/* Dijual Ke */}
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Dijual Ke (Tujuan)</label>
                            <input
                              type="text"
                              value={item.soldTo || ''}
                              onChange={(e) => handleTempItemFieldChange(item.id, 'soldTo', e.target.value)}
                              placeholder="Klien / Proyek / Unit"
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time projection in modal */}
              <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase block">Total Modal</span>
                  <span className="text-xs font-bold text-gray-800 font-mono">
                    {formatRupiah(editingPurchase.total)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase block">Proyeksi Omset</span>
                  <span className="text-xs font-bold text-indigo-900 font-mono">
                    {formatRupiah(tempItems.reduce((acc, item) => {
                      const qty = item.soldQuantity !== undefined ? item.soldQuantity : item.quantity;
                      const price = item.sellingPrice !== undefined ? item.sellingPrice : item.price;
                      return acc + (qty * price);
                    }, 0))}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase block">Margin Keuntungan</span>
                  {(() => {
                    const cost = editingPurchase.total;
                    const sell = tempItems.reduce((acc, item) => {
                      const qty = item.soldQuantity !== undefined ? item.soldQuantity : item.quantity;
                      const price = item.sellingPrice !== undefined ? item.sellingPrice : item.price;
                      return acc + (qty * price);
                    }, 0);
                    const profit = sell - cost;
                    const margin = cost > 0 ? (profit / cost) * 100 : 0;
                    return (
                      <span className={`text-xs font-bold font-mono ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatRupiah(profit)} ({margin.toFixed(1)}%)
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-2.5">
              <button
                onClick={() => setEditingPurchase(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveSellingPrices}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Simpan Penjualan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL VIEWER */}
      {viewingPurchase && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Rincian Barang & Laba Penjualan</h3>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{viewingPurchase.invoiceNumber}</p>
              </div>
              <button 
                onClick={() => setViewingPurchase(null)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="space-y-3">
                {viewingPurchase.items.map((item) => {
                  const sell = item.sellingPrice !== undefined ? item.sellingPrice : item.price;
                  const soldQty = item.soldQuantity !== undefined ? item.soldQuantity : item.quantity;
                  const soldUnit = item.soldUnit !== undefined ? item.soldUnit : item.unit;
                  const soldTo = item.soldTo || '-';
                  const itemSalesTotal = soldQty * sell;
                  const itemCostTotal = item.total;
                  const itemProfit = itemSalesTotal - itemCostTotal;

                  return (
                    <div key={item.id} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-3">
                      {/* Header info */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{item.itemName}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">Beli: {item.quantity} {item.unit} @ {formatRupiah(item.price)}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold block">Total Modal</span>
                          <span className="text-xs font-semibold text-gray-700 font-mono">{formatRupiah(itemCostTotal)}</span>
                        </div>
                      </div>

                      {/* Sold details info */}
                      <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-gray-100 text-[11px]">
                        <div>
                          <span className="text-[9px] text-gray-400 font-medium block">Qty Terjual</span>
                          <span className="font-semibold text-gray-800 font-mono">{soldQty} {soldUnit}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 font-medium block">Harga Jual / Unit</span>
                          <span className="font-semibold text-gray-800 font-mono">{formatRupiah(sell)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 font-medium block">Total Penjualan</span>
                          <span className="font-semibold text-indigo-950 font-mono">{formatRupiah(itemSalesTotal)}</span>
                        </div>
                      </div>

                      {/* Extra info (Dijual ke, Profit) */}
                      <div className="flex justify-between items-center text-[10px] pt-2 border-t border-dashed border-gray-200">
                        <div>
                          <span className="text-gray-400 font-medium">Dijual ke: </span>
                          <span className="font-semibold text-gray-700">{soldTo}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">Laba Barang: </span>
                          <span className={`font-bold font-mono ${itemProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {itemProfit >= 0 ? `+${formatRupiah(itemProfit)}` : formatRupiah(itemProfit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingPurchase(null)}
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
