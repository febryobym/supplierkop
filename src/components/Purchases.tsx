/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { Purchase, PurchaseItem, PurchaseStatus } from '../types';
import { formatRupiah, formatDate, exportToCSV } from '../data';
import { Plus, Search, Eye, Trash2, Calendar, FileText, ShoppingCart, Percent, DollarSign, X, CheckCircle, Clock, AlertTriangle, FileSpreadsheet, Printer } from 'lucide-react';

export default function Purchases() {
  const { purchases, suppliers, addPurchase, deletePurchase, currentUser, showConfirm, showAlert } = useAppState();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Creation Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formDueDate, setFormDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // Default 30-day term (Net 30)
    return d.toISOString().split('T')[0];
  });
  const [formNotes, setFormNotes] = useState('');
  const [formTaxPercent, setFormTaxPercent] = useState<number>(11); // Standard PPN INDONESIA is 11%
  const [formDiscount, setFormDiscount] = useState<number>(0);

  // Line items state
  const [lineItems, setLineItems] = useState<Omit<PurchaseItem, 'id'>[]>([
    { itemName: '', quantity: 1, unit: 'Pcs', price: 0, total: 0 }
  ]);

  // Invoice Detail Viewer State
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Access check
  const canDelete = currentUser?.role !== 'Staff';

  // Calculations for active form
  const formSubTotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const formTaxAmount = Math.round((formSubTotal - formDiscount) * (formTaxPercent / 100));
  const formTotal = Math.max(0, formSubTotal - formDiscount + formTaxAmount);

  const handleOpenCreateForm = () => {
    if (suppliers.length === 0) {
      showAlert('Supplier Kosong', 'Harap daftarkan supplier terlebih dahulu di tab Supplier sebelum menginput transaksi pembelian.');
      return;
    }
    setFormSupplierId(suppliers[0].id);
    setFormInvoiceNumber(`INV/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/0${purchases.length + 101}`);
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormDueDate(d.toISOString().split('T')[0]);
    
    setFormNotes('');
    setFormTaxPercent(11);
    setFormDiscount(0);
    setLineItems([{ itemName: '', quantity: 1, unit: 'Pcs', price: 0, total: 0 }]);
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { itemName: '', quantity: 1, unit: 'Pcs', price: 0, total: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: keyof Omit<PurchaseItem, 'id'>, value: any) => {
    const updated = [...lineItems];
    if (field === 'quantity') {
      const q = Math.max(0, parseInt(value) || 0);
      updated[index].quantity = q;
      updated[index].total = q * updated[index].price;
    } else if (field === 'price') {
      const p = Math.max(0, parseFloat(value) || 0);
      updated[index].price = p;
      updated[index].total = updated[index].quantity * p;
    } else {
      updated[index][field] = value as never;
    }
    setLineItems(updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formInvoiceNumber || !formSupplierId || !formPurchaseDate || !formDueDate) {
      setErrorMessage('Harap isi kelengkapan header faktur!');
      return;
    }

    // Filter out blank lines
    const validItems = lineItems.filter(item => item.itemName.trim() !== '' && item.quantity > 0 && item.price > 0);
    if (validItems.length === 0) {
      setErrorMessage('Faktur wajib diisi minimal 1 barang dengan kuantitas & harga valid!');
      return;
    }

    const compiledItems: PurchaseItem[] = validItems.map((item, idx) => ({
      ...item,
      id: `itm-${Date.now()}-${idx}`
    }));

    // Trigger action in StateContext
    addPurchase({
      supplierId: formSupplierId,
      invoiceNumber: formInvoiceNumber,
      purchaseDate: formPurchaseDate,
      dueDate: formDueDate,
      items: compiledItems,
      subTotal: formSubTotal,
      tax: formTaxPercent,
      taxAmount: formTaxAmount,
      discount: formDiscount,
      total: formTotal,
      notes: formNotes
    });

    setSuccessMessage('Sukses menerbitkan faktur pembelian barang!');
    setIsFormOpen(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeletePurchase = (id: string) => {
    if (!canDelete) return;
    showConfirm(
      'Hapus Transaksi',
      'Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini hanya diijinkan jika faktur memiliki sisa hutang utuh tanpa log riwayat pengembalian kas / pelunasan sebelumnya.',
      () => {
        const success = deletePurchase(id);
        if (success) {
          setSuccessMessage('Faktur pembelian dibatalkan dan dihapus.');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          showAlert(
            'Gagal Menghapus',
            'Gagal menghapus! Faktur ini sudah memiliki mutasi pembayaran tercatat. Hapus riwayat pembayaran terkait terlebih dahulu.'
          );
        }
      }
    );
  };

  const handleCSVExport = () => {
    const headers = ['No Invoice', 'Supplier', 'Tanggal Transaksi', 'Jatuh Tempo', 'Sisa Hari', 'Subtotal', 'Diskon', 'Pajak (11%)', 'Total Belanja', 'Terbayar', 'Sisa Hutang', 'Status'];
    const data = filteredPurchases.map(p => {
      const s = suppliers.find(s => s.id === p.supplierId);
      const daysLeft = Math.ceil((new Date(p.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return [
        p.invoiceNumber,
        s?.name || 'N/A',
        p.purchaseDate,
        p.dueDate,
        daysLeft < 0 ? `Terlambat ${Math.abs(daysLeft)} hr` : `${daysLeft} hr lagi`,
        p.subTotal.toString(),
        p.discount.toString(),
        p.taxAmount.toString(),
        p.total.toString(),
        p.paidAmount.toString(),
        p.remainingAmount.toString(),
        p.status
      ];
    });
    exportToCSV('Pencatatan_Pembelian_Faktur', headers, data);
  };

  // Browser Print triggered helper
  const handlePrintInvoice = () => {
    window.print();
  };

  // Search Filter computation
  const filteredPurchases = purchases.filter(p => {
    const sName = suppliers.find(s => s.id === p.supplierId)?.name || 'N/A';
    const matchesSearch = p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.items.some(item => item.itemName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSupplier = supplierFilter === '' || p.supplierId === supplierFilter;
    const matchesStatus = statusFilter === '' || p.status === statusFilter;

    return matchesSearch && matchesSupplier && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans">Buku Pembelian Barang</h1>
          <p className="text-xs text-gray-500">Pencatatan nota belanja material, alokasi pajak, diskon, dan tempo hutang.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-2 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.CSV)</span>
          </button>
          
          <button
            onClick={handleOpenCreateForm}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Input Nota Pembelian</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl">
          {successMessage}
        </div>
      )}

      {/* Control Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
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
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="border border-gray-150 rounded-xl px-3 py-2 text-xs bg-white text-gray-600 outline-hidden"
          >
            <option value="">Semua Supplier</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-150 rounded-xl px-3 py-2 text-xs bg-white text-gray-600 outline-hidden"
          >
            <option value="">Semua Status</option>
            <option value="Belum Lunas">Belum Lunas</option>
            <option value="Sebagian">Sebagian</option>
            <option value="Lunas">Lunas</option>
          </select>
        </div>
      </div>

      {/* Main invoices table register */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100 font-sans font-semibold">
                <th className="p-4">Invoice / Tanggal</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Jatuh Tempo</th>
                <th className="p-4 text-right">Total Belanja</th>
                <th className="p-4 text-right">Hutang Outstanding</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                    Belum ada transaksi pembelian terdokumentasi yang cocok dengan pencarian / filter ini.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const s = suppliers.find(s => s.id === p.supplierId);
                  const isOverdue = p.status !== 'Lunas' && new Date(p.dueDate) < new Date(new Date().toISOString().split('T')[0]);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/40 transition-colors">
                      
                      {/* Invoice & Date info card nested */}
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 font-mono text-[12px]">{p.invoiceNumber}</div>
                        <div className="text-gray-400 mt-0.5 text-[10px]">{formatDate(p.purchaseDate)}</div>
                      </td>

                      {/* Supplier Code Name */}
                      <td className="p-4">
                        <div className="font-medium text-gray-800">{s?.name || 'N/A'}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{s?.code || '-'}</div>
                      </td>

                      {/* Due Date Indicator */}
                      <td className="p-4">
                        <div className={`flex items-center gap-1 font-medium font-mono text-[11px] ${
                          isOverdue ? 'text-rose-600' : p.status === 'Lunas' ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{p.dueDate}</span>
                        </div>
                        {p.status !== 'Lunas' && (
                          <div className={`text-[10px] mt-0.5 font-bold uppercase ${isOverdue ? 'text-rose-500 animate-pulse' : 'text-amber-600'}`}>
                            {isOverdue ? 'Terlambat Bayar' : 'Outstanding'}
                          </div>
                        )}
                      </td>

                      {/* Absolute Invoice Cost */}
                      <td className="p-4 text-right font-bold text-gray-900 font-mono text-[11px]">
                        {formatRupiah(p.total)}
                      </td>

                      {/* Sisa / Unpaid Balance */}
                      <td className="p-4 text-right">
                        <div className={`font-mono font-bold text-[11px] ${p.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatRupiah(p.remainingAmount)}
                        </div>
                        {p.paidAmount > 0 && (
                          <div className="text-[10px] text-gray-400 font-mono">Dibayar: {formatRupiah(p.paidAmount)}</div>
                        )}
                      </td>

                      {/* Color-coded badges */}
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

                      {/* Quick Inspect View & delete */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedPurchase(p)}
                            className="p-1.5 bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Rincian / Cetak Nota"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDeletePurchase(p.id)}
                              className="p-1.5 bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Hapus / Batalkan Faktur"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* MODAL 1: Recording Purchase Order Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Input Transaksi Pembelian Barang</h3>
                <p className="text-xs text-gray-500 font-sans">Buat faktur utang baru dari supplier.</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1.5 hover:bg-gray-150 rounded-lg cursor-pointer">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scroll form area */}
            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl">
                  {errorMessage}
                </div>
              )}

              {/* Form Section Header Invoice */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                
                {/* Select Supplier */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Pilih Supplier*</label>
                  <select
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs outline-hidden font-medium"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                {/* Nomor Invoice */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">No Invoice / Faktur*</label>
                  <input
                    type="text"
                    required
                    value={formInvoiceNumber}
                    onChange={(e) => setFormInvoiceNumber(e.target.value)}
                    placeholder="INV/2026/06/xxxx"
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono font-semibold"
                  />
                </div>

                {/* Tanggal Transaksi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Tanggal Transaksi*</label>
                  <input
                    type="date"
                    required
                    value={formPurchaseDate}
                    onChange={(e) => setFormPurchaseDate(e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
                  />
                </div>

                {/* Jatuh Tempo */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Jatuh Tempo (Tempo)*</label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    min={formPurchaseDate}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
                  />
                </div>

              </div>

              {/* Form Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-indigo-500" />
                    Daftar Barang yang Dibeli
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Baris
                  </button>
                </div>

                <div className="border border-gray-150 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="p-3 font-semibold w-[40%]">Nama Barang / Deskripsi*</th>
                        <th className="p-3 font-semibold text-center w-[12%]">Kuantitas*</th>
                        <th className="p-3 font-semibold text-center w-[12%]">Satuan</th>
                        <th className="p-3 font-semibold text-right w-[18%]">Harga Satuan*</th>
                        <th className="p-3 font-semibold text-right w-[15%]">Total</th>
                        <th className="p-3 font-semibold text-center w-[3%]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lineItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/20">
                          
                          {/* Nama item */}
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              value={item.itemName}
                              onChange={(e) => handleLineItemChange(idx, 'itemName', e.target.value)}
                              placeholder="Nama semen, pipa, stopkontak, dll..."
                              className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:border-indigo-500 outline-hidden"
                            />
                          </td>

                          {/* Kuantitas */}
                          <td className="p-2">
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                              className="w-full text-center px-2 py-1.5 border border-gray-200 rounded-lg focus:border-indigo-500 outline-hidden font-mono"
                            />
                          </td>

                          {/* Satuan */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleLineItemChange(idx, 'unit', e.target.value)}
                              placeholder="Pcs / Box"
                              className="w-full text-center px-1 py-1.5 border border-gray-200 rounded-lg focus:border-indigo-500 outline-hidden"
                            />
                          </td>

                          {/* Harga Satuan */}
                          <td className="p-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">Rp</span>
                              <input
                                type="number"
                                required
                                min="0"
                                value={item.price}
                                onChange={(e) => handleLineItemChange(idx, 'price', e.target.value)}
                                className="w-full pl-6 pr-2 py-1.5 text-right border border-gray-200 rounded-lg focus:border-indigo-500 outline-hidden font-mono"
                              />
                            </div>
                          </td>

                          {/* Line Total */}
                          <td className="p-2 text-right font-medium text-gray-700 font-mono">
                            {formatRupiah(item.quantity * item.price)}
                          </td>

                          {/* Delete Action row */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(idx)}
                              disabled={lineItems.length === 1}
                              className="p-1 text-gray-300 hover:text-rose-500 disabled:opacity-30 rounded-md cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Totals & Discount & tax Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Notes Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Catatan / Keterangan Faktur</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={4}
                    placeholder="Contoh: Kebutuhan bahan renovasi ruko Sidoarjo, cicilan sisa di akhir bulan..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden leading-relaxed block text-gray-700"
                  ></textarea>
                </div>

                {/* Sub Total calculations and Adjustments */}
                <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-150 space-y-3 shrink-0">
                  
                  {/* Raw Subtotal display */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Subtotal Total Barang</span>
                    <span className="font-mono text-gray-700 font-semibold">{formatRupiah(formSubTotal)}</span>
                  </div>

                  {/* Discount input inline */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Diskon Potongan Harga (Rp)</span>
                    <div className="relative max-w-[160px]">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">IDR</span>
                      <input
                        type="number"
                        min="0"
                        max={formSubTotal}
                        value={formDiscount}
                        onChange={(e) => setFormDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full text-right pl-9 pr-2.5 py-1.5 border border-gray-200 bg-white rounded-lg focus:border-indigo-500 outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  {/* Tax percentage select standard */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span>Alokasi PPN Pajak (%)</span>
                      <span className="bg-indigo-50 text-indigo-700 font-mono text-[9px] px-1.5 py-0.5 rounded-sm">Default 11%</span>
                    </div>
                    <select
                      value={formTaxPercent}
                      onChange={(e) => setFormTaxPercent(parseInt(e.target.value) || 0)}
                      className="border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 max-w-[120px] text-right font-mono outline-hidden"
                    >
                      <option value="11">PPN 11%</option>
                      <option value="12">PPN 12%</option>
                      <option value="0">0% (Bebas)</option>
                    </select>
                  </div>

                  {/* Absolute Tax (derived) */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Nilai Tambahan PPN ({formTaxPercent}%)</span>
                    <span className="font-mono text-gray-700">{formatRupiah(formTaxAmount)}</span>
                  </div>

                  {/* Ultimate net target price */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="font-bold text-gray-800 text-[13px]">Total Belanja Bersih</span>
                    <span className="font-bold text-indigo-700 font-mono text-[14px]">{formatRupiah(formTotal)}</span>
                  </div>

                </div>

              </div>

              {/* Form submit/abort buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                >
                  Tandatangani & Simpan Faktur
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Page styled Invoice Detail Viewer (Print-Friendly) */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          {/* Main Printable Card Sheet */}
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:rounded-none">
            
            {/* Modal Actions Controller (Invis in printing) */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold text-gray-400 capitalize">Arsip Nota Pembelian Barang</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintInvoice}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak PDF</span>
                </button>
                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="p-1 px-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 text-xs font-medium cursor-pointer"
                >
                  Tutup [X]
                </button>
              </div>
            </div>

            {/* Print Area Core */}
            <div id="printable-invoice-sheet" className="p-8 overflow-y-auto flex-1 font-sans space-y-6 print:overflow-visible print:p-0">
              
              {/* Receipt Visual Header */}
              <div className="flex items-start justify-between border-b-2 border-gray-100 pb-5">
                <div className="space-y-1">
                  <div className="text-xs tracking-wider uppercase font-bold text-indigo-700 font-sans">
                    Faktur Pembelian Resmi
                  </div>
                  <h2 className="text-2xl font-black text-gray-950 font-mono tracking-tight">
                    {selectedPurchase.invoiceNumber}
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Oleh Staff: <strong className="font-semibold text-gray-700">{selectedPurchase.createdBy}</strong> | Terdaftar: {selectedPurchase.createdAt.split('T')[0]}
                  </p>
                </div>

                {/* Status indicator stamp styled */}
                <div className="text-right space-y-1">
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest font-sans font-bold">Status Pembayaran</div>
                  <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-all font-bold tracking-wide uppercase ${
                    selectedPurchase.status === 'Lunas' 
                      ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300' 
                      : selectedPurchase.status === 'Sebagian' 
                      ? 'bg-amber-50 text-amber-800 border-2 border-amber-300' 
                      : 'bg-rose-50 text-rose-800 border-2 border-rose-300'
                  }`}>
                    {selectedPurchase.status}
                  </span>
                </div>
              </div>

              {/* Vendor & Client Address Metadata Inline Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 border border-gray-100 p-5 rounded-2xl block text-xs">
                
                {/* To: Purchasing Company Entity */}
                <div className="space-y-1">
                  <div className="font-semibold text-gray-400 text-[10px] uppercase tracking-wider block">Entitas Pembeli</div>
                  <div className="font-bold text-gray-900 text-sm">Gudang Penyimpanan Pusat</div>
                  <p className="text-gray-500 leading-relaxed max-w-[240px]">
                    Kawasan Niaga Terpadu, Jl. Sudirman Kav 12, DKI Jakarta, Indonesia
                  </p>
                </div>

                {/* From: Supplier Creditor Entity */}
                <div className="space-y-1">
                  <div className="font-semibold text-gray-400 text-[10px] uppercase tracking-wider block">Ditagihkan Oleh (Supplier)</div>
                  {(() => {
                    const s = suppliers.find(s => s.id === selectedPurchase.supplierId);
                    return s ? (
                      <>
                        <div className="font-bold text-gray-900 text-sm">{s.name}</div>
                        <div className="text-gray-600 font-medium font-mono">{s.code}</div>
                        <p className="text-gray-500 leading-relaxed">
                          {s.address || 'Alamat tidak ditentukan'}
                        </p>
                        <p className="text-gray-700 pt-1 font-mono text-[10px]">
                          Telp: {s.phone} | CP: {s.contactPerson}
                        </p>
                      </>
                    ) : (
                      <span className="text-gray-400 font-medium italic">Informasi Supplier tidak tersedia/sudah dihapus</span>
                    );
                  })()}
                </div>

              </div>

              {/* Purchase Specific Dates */}
              <div className="flex items-center gap-6 text-xs bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Tanggal Nota</span>
                  <span className="font-mono text-gray-800 font-semibold">{formatDate(selectedPurchase.purchaseDate)}</span>
                </div>
                <div className="h-6 w-[1.5px] bg-gray-200"></div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Tempo Jatuh Tempo</span>
                  <span className="font-mono text-gray-800 font-semibold">{formatDate(selectedPurchase.dueDate)}</span>
                </div>
                <div className="h-6 w-[1.5px] bg-gray-200"></div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">Outstanding Hutang</span>
                  <span className={`font-mono font-bold ${selectedPurchase.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatRupiah(selectedPurchase.remainingAmount)}
                  </span>
                </div>
              </div>

              {/* Items List inside sheet */}
              <div className="space-y-2">
                <span className="font-semibold text-gray-400 text-[10px] uppercase tracking-wider block">Itemized Billing</span>
                <div className="border border-gray-150 rounded-2xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                      <tr>
                        <th className="p-3 font-semibold">Deskripsi Barang</th>
                        <th className="p-3 font-semibold text-center w-24">Jumlah</th>
                        <th className="p-3 font-semibold text-right w-36">Harga Satuan</th>
                        <th className="p-3 font-semibold text-right w-36">Total Harga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {selectedPurchase.items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3">{item.itemName}</td>
                          <td className="p-3 text-center font-mono text-gray-600">{item.quantity} {item.unit}</td>
                          <td className="p-3 text-right font-mono">{formatRupiah(item.price)}</td>
                          <td className="p-3 text-right font-mono text-gray-900">{formatRupiah(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Receipt Bottom Summary Calculation */}
              <div className="flex flex-col md:flex-row gap-6 justify-between pt-4">
                
                {/* Notes stamp */}
                <div className="flex-1 space-y-1.5 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 max-w-sm text-xs self-start">
                  <span className="font-semibold text-gray-400 text-[9px] uppercase tracking-wider block">Keterangan Tambahan / Memo</span>
                  <p className="text-gray-600 leading-relaxed italic">
                    {selectedPurchase.notes || 'Tidak ada catatan tambahan untuk dicantumkan.'}
                  </p>
                </div>

                {/* Aggregated sums */}
                <div className="w-full max-w-xs space-y-2.5 text-xs">
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Subtotal Kotor</span>
                    <span className="font-mono text-gray-700">{formatRupiah(selectedPurchase.subTotal)}</span>
                  </div>
                  {selectedPurchase.discount > 0 && (
                    <div className="flex justify-between text-rose-500 font-medium">
                      <span>Loyalty Discount (-)</span>
                      <span className="font-mono"> - {formatRupiah(selectedPurchase.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>PPN Pertambahan Nilai ({selectedPurchase.tax}%)</span>
                    <span className="font-mono text-gray-700"> + {formatRupiah(selectedPurchase.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3 text-sm font-bold text-gray-950">
                    <span>Grand Total Bersih</span>
                    <span className="font-mono text-indigo-700 text-sm">{formatRupiah(selectedPurchase.total)}</span>
                  </div>

                  <div className="h-[1px] bg-dashed bg-gray-300 my-2"></div>

                  <div className="flex justify-between text-[11px] font-bold text-gray-500">
                    <span>Sudah Dibayar (Dana Pelunasan)</span>
                    <span className="font-mono text-gray-700">{formatRupiah(selectedPurchase.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-rose-600">
                    <span>Total Sisa / Hutang Dagang</span>
                    <span className="font-mono">{formatRupiah(selectedPurchase.remainingAmount)}</span>
                  </div>
                </div>

              </div>

              {/* Visual Signatures blocks in printed copy */}
              <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-center text-[10px] w-full mt-10">
                <div className="space-y-12">
                  <p className="font-medium text-gray-400 block uppercase">Disetujui Oleh (PT Warehousing Pusat)</p>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900 border-t border-gray-300 pt-1.5 w-40 mx-auto">
                      ({currentUser?.name || 'Authorized Staff'})
                    </p>
                    <p className="text-gray-400 font-mono">Staff Logistik & Keuangan</p>
                  </div>
                </div>
                <div className="space-y-12">
                  <p className="font-medium text-gray-400 block uppercase">Disiapkan Oleh (Supplier Terkait)</p>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900 border-t border-gray-300 pt-1.5 w-40 mx-auto">
                      (Narahubung Supplier)
                    </p>
                    <p className="text-gray-400 font-mono">Mitra Vendor Kreditor</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
