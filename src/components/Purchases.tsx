/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { Purchase, PurchaseItem, PurchaseStatus, PaymentMethod } from '../types';
import { formatRupiah, formatDate, exportToCSV } from '../data';
import { Plus, Search, Eye, Trash2, Calendar, FileText, ShoppingCart, Percent, DollarSign, X, CheckCircle, Clock, AlertTriangle, FileSpreadsheet, Printer, Edit } from 'lucide-react';

interface FormLineItem {
  itemName: string;
  quantity: string | number;
  unit: string;
  price: number;
  total: number;
}

export default function Purchases() {
  const { purchases, suppliers, payments, addPurchase, updatePurchase, deletePurchase, currentUser } = useAppState();

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

  // Overpayment / Underpayment adjustment choices states
  const [applyOverpayment, setApplyOverpayment] = useState(false);
  const [selectedUnpaidInvoiceIds, setSelectedUnpaidInvoiceIds] = useState<Record<string, boolean>>({});
  const [unpaidInvoicePaymentMethods, setUnpaidInvoicePaymentMethods] = useState<Record<string, PaymentMethod>>({});

  // Line items state
  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    { itemName: '', quantity: '1', unit: 'Pcs', price: 0, total: 0 }
  ]);

  // Invoice Detail Viewer State
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Access check
  const canDelete = currentUser?.role !== 'Staff';
  const canEdit = true;

  // Helper to compute original remaining amount of a purchase before this editing transaction's adjustments
  const getOriginalRemainingAmount = (invoice: Purchase) => {
    if (!editingPurchaseId) return invoice.remainingAmount;
    
    // Find any adjustment payments related to this invoice from this editing transaction
    const matchPay = payments.filter(pay => 
      pay.purchaseId === invoice.id && 
      pay.notes && 
      (
        pay.notes.includes(`(Input gabungan saat transaksi ${formInvoiceNumber})`) ||
        pay.notes.includes(`Kelebihan dana dipindahkan ke ${formInvoiceNumber}`)
      )
    ).reduce((acc, pay) => acc + pay.amount, 0);
    
    return invoice.remainingAmount + matchPay;
  };

  // Calculations for active form
  const formSubTotal = lineItems.reduce((acc, item) => {
    const q = typeof item.quantity === 'string' ? (parseFloat(item.quantity.replace(',', '.')) || 0) : item.quantity;
    return acc + (q * item.price);
  }, 0);
  const formTaxAmount = Math.round((formSubTotal - formDiscount) * (formTaxPercent / 100));
  const formTotal = Math.max(0, formSubTotal - formDiscount + formTaxAmount);

  // Derived calculations for adjustment options (utilizing original amounts when editing)
  const selectedSupplierOverpaidPurchases = purchases.filter(p => {
    const origRemaining = getOriginalRemainingAmount(p);
    return p.supplierId === formSupplierId && origRemaining < 0 && p.id !== editingPurchaseId;
  });
  const totalOverpaymentAvailable = selectedSupplierOverpaidPurchases.reduce((acc, p) => acc + Math.abs(getOriginalRemainingAmount(p)), 0);
  
  const selectedSupplierUnderpaidPurchases = purchases.filter(p => {
    const origRemaining = getOriginalRemainingAmount(p);
    return p.supplierId === formSupplierId && origRemaining > 0 && p.id !== editingPurchaseId;
  });

  const totalUnderpaymentSettle = selectedSupplierUnderpaidPurchases
    .filter(p => selectedUnpaidInvoiceIds[p.id])
    .reduce((acc, p) => acc + getOriginalRemainingAmount(p), 0);

  const formTotalBelanjaBersih = formTotal + totalUnderpaymentSettle;
  const appliedOverpaymentValue = applyOverpayment ? Math.min(totalOverpaymentAvailable, formTotalBelanjaBersih) : 0;
  const formNetPayable = Math.max(0, formTotalBelanjaBersih - appliedOverpaymentValue);

  const handleOpenCreateForm = () => {
    if (suppliers.length === 0) {
      alert('Harap daftarkan supplier terlebih dahulu di tab Supplier sebelum menginput transaksi pembelian.');
      return;
    }
    setEditingPurchaseId(null);
    setFormSupplierId(suppliers[0].id);
    setFormInvoiceNumber(`INV/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/0${purchases.length + 101}`);
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormDueDate(d.toISOString().split('T')[0]);
    
    setFormNotes('');
    setFormTaxPercent(11);
    setFormDiscount(0);
    setLineItems([{ itemName: '', quantity: '1', unit: 'Pcs', price: 0, total: 0 }]);
    
    // Reset adjustments states
    setApplyOverpayment(false);
    setSelectedUnpaidInvoiceIds({});
    setUnpaidInvoicePaymentMethods({});
    
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (p: Purchase) => {
    setEditingPurchaseId(p.id);
    setFormSupplierId(p.supplierId);
    setFormInvoiceNumber(p.invoiceNumber);
    setFormPurchaseDate(p.purchaseDate);
    setFormDueDate(p.dueDate);
    setFormNotes(p.notes || '');
    setFormTaxPercent(p.tax);
    setFormDiscount(p.discount);
    
    const mappedItems = p.items.map(item => ({
      itemName: item.itemName,
      quantity: String(item.quantity),
      unit: item.unit,
      price: item.price,
      total: item.total
    }));
    setLineItems(mappedItems);
    
    // Check if overpayment was applied to this purchase
    const overpaymentPayment = payments.find(pay => 
      pay.purchaseId === p.id && 
      pay.notes && 
      pay.notes.includes('kelebihan dana')
    );
    setApplyOverpayment(!!overpaymentPayment);

    // Find previous unpaid invoices settled during this transaction
    const matchingPayments = payments.filter(pay => 
      pay.notes && 
      pay.notes.includes(`(Input gabungan saat transaksi ${p.invoiceNumber})`)
    );

    const initialSelectedUnpaid: Record<string, boolean> = {};
    const initialUnpaidMethods: Record<string, PaymentMethod> = {};

    matchingPayments.forEach(pay => {
      initialSelectedUnpaid[pay.purchaseId] = true;
      initialUnpaidMethods[pay.purchaseId] = pay.paymentMethod;
    });

    setSelectedUnpaidInvoiceIds(initialSelectedUnpaid);
    setUnpaidInvoicePaymentMethods(initialUnpaidMethods);
    
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { itemName: '', quantity: '1', unit: 'Pcs', price: 0, total: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: keyof FormLineItem, value: any) => {
    const updated = [...lineItems];
    if (field === 'quantity') {
      // Allow only numbers, dot, and comma
      const cleaned = String(value).replace(/[^0-9.,\-]/g, '');
      updated[index].quantity = cleaned;
      const q = parseFloat(cleaned.replace(',', '.')) || 0;
      updated[index].total = q * updated[index].price;
    } else if (field === 'price') {
      const p = Math.max(0, parseFloat(value) || 0);
      updated[index].price = p;
      const q = typeof updated[index].quantity === 'string' ? (parseFloat(updated[index].quantity.replace(',', '.')) || 0) : updated[index].quantity;
      updated[index].total = q * p;
    } else {
      updated[index][field] = value as never;
    }
    setLineItems(updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formInvoiceNumber || !formSupplierId || !formPurchaseDate || !formDueDate) {
      setErrorMessage('Harap isi kelengkapan header faktur!');
      return;
    }

    // Filter out blank lines
    const validItems = lineItems.filter(item => {
      const qty = typeof item.quantity === 'string' ? (parseFloat(item.quantity.replace(',', '.')) || 0) : item.quantity;
      return item.itemName.trim() !== '' && qty > 0 && item.price > 0;
    });
    if (validItems.length === 0) {
      setErrorMessage('Faktur wajib diisi minimal 1 barang dengan kuantitas & harga valid!');
      return;
    }

    const compiledItems: PurchaseItem[] = validItems.map((item, idx) => {
      const qty = typeof item.quantity === 'string' ? (parseFloat(item.quantity.replace(',', '.')) || 0) : item.quantity;
      return {
        itemName: item.itemName,
        quantity: qty,
        unit: item.unit,
        price: item.price,
        total: qty * item.price,
        id: `itm-${Date.now()}-${idx}`
      };
    });

    const purchasePayload = {
      supplierId: formSupplierId,
      invoiceNumber: formInvoiceNumber,
      purchaseDate: formPurchaseDate,
      dueDate: formDueDate,
      items: compiledItems,
      subTotal: formSubTotal,
      tax: formTaxPercent,
      taxAmount: formTaxAmount,
      discount: formDiscount,
      total: formTotalBelanjaBersih,
      notes: formNotes
    };

    const settleInvoicesList = Object.keys(selectedUnpaidInvoiceIds)
      .filter(id => selectedUnpaidInvoiceIds[id])
      .map(id => {
        const p = purchases.find(p => p.id === id);
        return {
          purchaseId: id,
          amountToPay: p ? p.remainingAmount : 0,
          paymentMethod: unpaidInvoicePaymentMethods[id] || 'Transfer Bank'
        };
      })
      .filter(item => item.amountToPay > 0);

    if (editingPurchaseId) {
      // Backend safety check:
      const existing = purchases.find(p => p.id === editingPurchaseId);
      if (existing && (existing.paidAmount > 0 || existing.status !== 'Belum Lunas')) {
        alert('Tidak bisa mengubah pembelian yang sudah mulai diangsur atau dilunasi!');
        return;
      }
      updatePurchase(editingPurchaseId, purchasePayload, {
        applyOverpaymentAmount: appliedOverpaymentValue,
        settleInvoices: settleInvoicesList
      });
      setSuccessMessage('Sukses memperbarui faktur pembelian barang!');
    } else {
      // Trigger action in StateContext
      addPurchase(purchasePayload, {
        applyOverpaymentAmount: appliedOverpaymentValue,
        settleInvoices: settleInvoicesList
      });
      setSuccessMessage('Sukses menerbitkan faktur pembelian barang!');
    }

    setIsFormOpen(false);
    setEditingPurchaseId(null);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeletePurchase = (id: string) => {
    if (!canDelete) return;
    if (window.confirm('Hapus transaksi ini? Tindakan ini hanya diijinkan jika faktur memiliki sisa hutang utuh tanpa log riwayat pengembalian kas / pelunasan sebelumnya.')) {
      const success = deletePurchase(id);
      if (success) {
        setSuccessMessage('Faktur pembelian dibatalkan dan dihapus.');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Gagal menghapus! Faktur ini sudah memiliki mutasi pembayaran tercatat. Hapus riwayat pembayaran terkait terlebih dahulu.');
      }
    }
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

    const [year, month] = p.purchaseDate.split('-');
    const matchesMonth = selectedMonth === 'all' || month === selectedMonth;
    const matchesYear = selectedYear === 'all' || year === selectedYear;

    return matchesSearch && matchesSupplier && matchesStatus && matchesMonth && matchesYear;
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
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-150 rounded-xl px-3 py-2 text-xs bg-white text-gray-600 outline-hidden cursor-pointer"
          >
            {monthsList.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-150 rounded-xl px-3 py-2 text-xs bg-white text-gray-600 outline-hidden cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="Belum Lunas">Belum Lunas</option>
            <option value="Sebagian">Sebagian</option>
            <option value="Lunas">Lunas</option>
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

                      {/* Quick Inspect View, edit, & delete */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedPurchase(p)}
                            className="p-1.5 bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Rincian / Cetak Nota"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => {
                                if (p.paidAmount > 0 || p.status !== 'Belum Lunas') {
                                  alert('Transaksi pembelian ini tidak dapat diubah karena sudah ada pembayaran yang berjalan atau lunas!');
                                  return;
                                }
                                handleOpenEditForm(p);
                              }}
                              disabled={p.paidAmount > 0 || p.status !== 'Belum Lunas'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                p.paidAmount > 0 || p.status !== 'Belum Lunas'
                                  ? 'bg-gray-100/50 text-gray-300 cursor-not-allowed'
                                  : 'bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-600'
                              }`}
                              title={
                                p.paidAmount > 0 || p.status !== 'Belum Lunas'
                                  ? 'Tidak dapat diubah karena sudah ada pelunasan kas'
                                  : 'Ubah / Edit Faktur Pembelian'
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
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
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  {editingPurchaseId ? 'Koreksi / Edit Transaksi Pembelian Barang' : 'Input Transaksi Pembelian Barang'}
                </h3>
                <p className="text-xs text-gray-500 font-sans">
                  {editingPurchaseId ? 'Sesuaikan data transaksi atau rincian item belanjaan Mitra Supplier.' : 'Buat faktur utang baru dari supplier.'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingPurchaseId(null);
                }} 
                className="p-1.5 hover:bg-gray-150 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scroll form area */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
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
                    onChange={(e) => {
                      setFormSupplierId(e.target.value);
                      setApplyOverpayment(false);
                      setSelectedUnpaidInvoiceIds({});
                      setUnpaidInvoicePaymentMethods({});
                    }}
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

              {/* Optional adjustments section for Overpayments and Underpayments */}
              {(totalOverpaymentAvailable > 0 || selectedSupplierUnderpaidPurchases.length > 0) && (
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-indigo-600" />
                    Penyesuaian Saldo Piutang / Hutang Supplier
                  </h4>
                  
                  {/* Case 1: Overpayment exists */}
                  {totalOverpaymentAvailable > 0 && (
                    <div className="bg-white p-3 rounded-xl border border-indigo-100/50 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-gray-800">
                          Gunakan Kelebihan Bayar Sebelumnya
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Supplier ini memiliki kelebihan bayar total sebesar{" "}
                          <strong className="text-indigo-600 font-mono font-semibold">
                            {formatRupiah(totalOverpaymentAvailable)}
                          </strong>{" "}
                          dari invoice sebelumnya.
                        </div>
                      </div>
                      
                      <label className="relative flex items-center gap-2 cursor-pointer bg-indigo-50/70 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all select-none self-start md:self-auto">
                        <input
                          type="checkbox"
                          checked={applyOverpayment}
                          onChange={(e) => setApplyOverpayment(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-indigo-800">
                          Gunakan Dana Kelebihan
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Case 2: Underpayment exists */}
                  {selectedSupplierUnderpaidPurchases.length > 0 && (
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-indigo-100/50 shadow-xs">
                      <div>
                        <div className="text-xs font-bold text-gray-800">
                          Pelunasan Sisa Tagihan Kurang Bayar Sebelumnya
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Beri tanda centang untuk melunasi tagihan yang masih outstanding saat menginput transaksi ini.
                        </div>
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {selectedSupplierUnderpaidPurchases.map((p) => {
                          const isSelected = !!selectedUnpaidInvoiceIds[p.id];
                          return (
                            <div
                              key={p.id}
                              className={`flex flex-col md:flex-row md:items-center justify-between p-2.5 rounded-lg border text-xs gap-3 transition-colors ${
                                isSelected
                                  ? "bg-indigo-50/30 border-indigo-200"
                                  : "bg-gray-50/50 border-gray-150 hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    setSelectedUnpaidInvoiceIds(prev => ({
                                      ...prev,
                                      [p.id]: e.target.checked
                                    }));
                                  }}
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-0.5 cursor-pointer"
                                />
                                <div className="space-y-0.5">
                                  <span className="font-mono font-bold text-gray-800">{p.invoiceNumber}</span>
                                  <span className="text-gray-400 text-[10px] block">
                                    Tanggal: {formatDate(p.purchaseDate)} | Jatuh tempo: {p.dueDate}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-end md:self-auto">
                                <div className="text-right space-y-0.5">
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-medium">Sisa Hutang</span>
                                  <span className="font-mono font-bold text-rose-600">
                                    {formatRupiah(getOriginalRemainingAmount(p))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                              type="text"
                              required
                              inputMode="decimal"
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
                            {formatRupiah((typeof item.quantity === 'string' ? (parseFloat(item.quantity.replace(',', '.')) || 0) : item.quantity) * item.price)}
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

                   {/* Item total of this invoice */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-dashed border-gray-150">
                    <span>Total Belanja Invoice Baru</span>
                    <span className="font-mono text-gray-700">{formatRupiah(formTotal)}</span>
                  </div>

                  {/* Underpayment settlements added to Total Belanja Bersih */}
                  {totalUnderpaymentSettle > 0 && (
                    <div className="flex items-center justify-between text-xs text-indigo-600 font-semibold animate-fade-in">
                      <span>Pelunasan Sisa Kurang Bayar (Tambahan)</span>
                      <span className="font-mono">+{formatRupiah(totalUnderpaymentSettle)}</span>
                    </div>
                  )}

                  {/* Ultimate net target price */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="font-bold text-gray-800 text-[13px]">Total Belanja Bersih</span>
                    <span className="font-bold text-gray-900 font-mono text-[13px]">{formatRupiah(formTotalBelanjaBersih)}</span>
                  </div>

                  {applyOverpayment && appliedOverpaymentValue > 0 && (
                    <>
                      <div className="flex items-center justify-between text-xs text-emerald-600 font-medium">
                        <span>Potongan Kelebihan Dana</span>
                        <span className="font-mono">-{formatRupiah(appliedOverpaymentValue)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
                        <span className="font-bold text-indigo-900 text-[13px]">Sisa Tagihan Baru (Net)</span>
                        <span className="font-bold text-indigo-700 font-mono text-[14px]">{formatRupiah(formNetPayable)}</span>
                      </div>
                    </>
                  )}

                </div>

              </div>

              {/* Form submit/abort buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingPurchaseId(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                >
                  {editingPurchaseId ? 'Simpan Perubahan' : 'Tandatangani & Simpan Faktur'}
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
                  <div className="font-bold text-gray-900 text-sm">Koperasi Garuda Merah Putih</div>
                  <p className="text-gray-500 leading-relaxed max-w-[240px]">
                    Dsn. Padangan RT 02 RW 03 Ds. Pagu Kec. Pagu Kab. Kediri
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
                  {/* Find and display settled invoices for selectedPurchase */}
                  {(() => {
                    const matchedPays = payments.filter(pay => 
                      pay.notes && pay.notes.includes(`(Input gabungan saat transaksi ${selectedPurchase.invoiceNumber})`)
                    );
                    if (matchedPays.length === 0) return null;
                    return (
                      <div className="space-y-1.5 border-t border-gray-100 pt-2 animate-fade-in bg-indigo-50/20 p-2 rounded-xl">
                        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Pelunasan Sisa Hutang Tambahan:</span>
                        {matchedPays.map((pay, idx) => {
                          const p = purchases.find(p => p.id === pay.purchaseId);
                          return (
                            <div key={idx} className="flex justify-between text-[11px] text-indigo-700 font-medium font-mono pl-1">
                              <span>• {p ? p.invoiceNumber : 'Invoice'} ({pay.paymentMethod})</span>
                              <span>+ {formatRupiah(pay.amount)}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  <div className="flex justify-between border-t border-gray-200 pt-3 text-sm font-bold text-gray-950">
                    <span>Grand Total Bersih</span>
                    <span className="font-mono text-indigo-700 text-sm">{formatRupiah(selectedPurchase.total)}</span>
                  </div>

                  <div className="h-[1px] bg-dashed bg-gray-300 my-2"></div>

                  <div className="flex justify-between text-[11px] font-bold text-gray-500">
                    <span>Sudah Dibayar (Dana Pelunasan)</span>
                    <span className="font-mono text-gray-700">{formatRupiah(selectedPurchase.paidAmount)}</span>
                  </div>

                  {(() => {
                    const ovPay = payments.find(pay => 
                      pay.purchaseId === selectedPurchase.id && 
                      pay.notes && 
                      pay.notes.includes('kelebihan dana')
                    );
                    if (!ovPay) return null;
                    return (
                      <div className="flex justify-between text-[11px] text-emerald-600 font-medium bg-emerald-50/20 p-1.5 rounded-lg border border-emerald-100/30">
                        <span>• Potongan Kelebihan Dana</span>
                        <span className="font-mono"> - {formatRupiah(ovPay.amount)}</span>
                      </div>
                    );
                  })()}
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
