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

    return matchesSearch && matchesSupplier && matchesStatus;
  });

  // Calculate projected values of a purchase
  const getPurchaseSalesMetrics = (p: Purchase) => {
    const costTotal = p.total;
    const salesTotal = p.items.reduce((sum, item) => {
      const sellPrice = item.sellingPrice !== undefined ? item.sellingPrice : item.price;
      return sum + (item.quantity * sellPrice);
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
      return sumI + (item.quantity * sellPrice);
    }, 0);
  }, 0);
  const kpiProfitTotal = kpiSalesTotal - kpiCostTotal;
  const kpiAverageMargin = kpiCostTotal > 0 ? (kpiProfitTotal / kpiCostTotal) * 100 : 0;

  const handleOpenEditModal = (p: Purchase) => {
    setEditingPurchase(p);
    // Deep copy items to avoid modifying state directly
    setTempItems(p.items.map(item => ({
      ...item,
      sellingPrice: item.sellingPrice !== undefined ? item.sellingPrice : item.price // default to cost price if not set
    })));
    setErrorMessage('');
  };

  const handleTempItemPriceChange = (itemId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setTempItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, sellingPrice: num };
      }
      return item;
    }));
  };

  const handleSaveSellingPrices = async () => {
    if (!editingPurchase) return;

    try {
      await updatePurchaseItems(editingPurchase.id, tempItems);
      setSuccessMessage(`Berhasil memperbarui nilai jual untuk Invoice ${editingPurchase.invoiceNumber}`);
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
    exportToCSV('Buku_Penjualan_GMP', headers, data);
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans">Buku Penjualan & Margin Keuntungan</h1>
          <p className="text-xs text-gray-500 font-sans">Rekap nilai jual barang koperasi, hitungan omset proyeksi, dan laba kotor penjualan.</p>
        </div>
        <div>
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-2 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Buku Penjualan (.CSV)</span>
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
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-950 text-white">
              <div>
                <h3 className="text-md font-bold">Atur Nilai Jual Barang</h3>
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
                  Tentukan harga jual untuk masing-masing item belanja guna menghitung proyeksi margin dan keuntungan koperasi.
                </p>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-12 bg-gray-50 p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-4">Nama Barang</div>
                    <div className="col-span-2 text-center">Jumlah</div>
                    <div className="col-span-3 text-right">Harga Beli</div>
                    <div className="col-span-3 text-right">Harga Jual (IDR)</div>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    {tempItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 p-3 text-xs items-center">
                        <div className="col-span-4 font-medium text-gray-800 truncate pr-2" title={item.itemName}>
                          {item.itemName}
                        </div>
                        <div className="col-span-2 text-center text-gray-500 font-mono">
                          {item.quantity} {item.unit}
                        </div>
                        <div className="col-span-3 text-right font-mono text-gray-600">
                          {formatRupiah(item.price)}
                        </div>
                        <div className="col-span-3 pl-3">
                          <input
                            type="number"
                            value={item.sellingPrice || ''}
                            onChange={(e) => handleTempItemPriceChange(item.id, e.target.value)}
                            placeholder="Harga Jual"
                            className="w-full text-right px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <span className="text-[10px] text-gray-500 font-semibold uppercase block">Total Jual</span>
                  <span className="text-xs font-bold text-indigo-900 font-mono">
                    {formatRupiah(tempItems.reduce((acc, item) => acc + (item.quantity * (item.sellingPrice || 0)), 0))}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase block">Margin Keuntungan</span>
                  {(() => {
                    const cost = editingPurchase.total;
                    const sell = tempItems.reduce((acc, item) => acc + (item.quantity * (item.sellingPrice || 0)), 0);
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
                Simpan Nilai Jual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL VIEWER */}
      {viewingPurchase && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Rincian Barang & Harga</h3>
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
              <div className="space-y-2">
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-12 bg-gray-50 p-2.5 font-semibold text-gray-500">
                    <div className="col-span-5">Nama Barang</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Harga Beli</div>
                    <div className="col-span-3 text-right">Harga Jual</div>
                  </div>
                  {viewingPurchase.items.map((item) => {
                    const sell = item.sellingPrice !== undefined ? item.sellingPrice : item.price;
                    const diff = sell - item.price;
                    return (
                      <div key={item.id} className="grid grid-cols-12 p-2.5 items-center">
                        <div className="col-span-5 text-gray-800 font-medium truncate pr-1">{item.itemName}</div>
                        <div className="col-span-2 text-center text-gray-500 font-mono">{item.quantity} {item.unit}</div>
                        <div className="col-span-2 text-right text-gray-600 font-mono">{formatRupiah(item.price)}</div>
                        <div className="col-span-3 text-right font-mono text-indigo-950 font-semibold">
                          <div>{formatRupiah(sell)}</div>
                          <div className={`text-[9px] font-bold ${diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {diff >= 0 ? `+${formatRupiah(diff)}` : formatRupiah(diff)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingPurchase(null)}
                className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-xs font-semibold cursor-pointer"
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
