/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { Payment, PaymentMethod } from '../types';
import { formatRupiah, formatDate, exportToCSV } from '../data';
import { Plus, Search, Trash2, Landmark, CreditCard, ChevronRight, FileSpreadsheet, X, CheckCircle, Calendar, MessageSquare, ShieldAlert, Edit, Eye, Printer } from 'lucide-react';

export default function Payments() {
  const { payments, purchases, suppliers, addPayment, updatePayment, deletePayment, currentUser } = useAppState();

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

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

  const availableYears = Array.from(new Set(payments.map(p => p.paymentDate.split('-')[0]))).sort((a: string, b: string) => b.localeCompare(a)) as string[];
  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear().toString());
  }

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null);

  const [formPurchaseId, setFormPurchaseId] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formPaymentDate, setFormPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('Transfer Bank');
  const [formReferenceNumber, setFormReferenceNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Access privileges
  const canDelete = currentUser?.role !== 'Staff';
  const canEdit = currentUser?.role !== 'Staff';

  // Dropdown list computation
  const selectDropdownPurchases = purchases.filter(p => {
    if (editingPaymentId) {
      const activePayment = payments.find(pay => pay.id === editingPaymentId);
      if (activePayment && activePayment.purchaseId === p.id) {
        return true;
      }
    }
    return p.status !== 'Lunas';
  });

  const handleOpenForm = () => {
    if (currentUser?.role === 'Staff') {
      alert('Akses Ditolak: Peran Staff tidak diperbolehkan melakukan pelunasan / pembayaran.');
      return;
    }
    const available = purchases.filter(p => p.status !== 'Lunas');
    if (available.length === 0) {
      alert('Tidak ada tagihan atau hutang faktur aktif yang membutuhkan pelunasan saat ini.');
      return;
    }
    const defaultPurchase = available[0];
    setEditingPaymentId(null);
    setFormPurchaseId(defaultPurchase.id);
    setFormAmount(defaultPurchase.remainingAmount); // Autofill full remaining amount
    setFormPaymentDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('Transfer Bank');
    setFormReferenceNumber('');
    setFormNotes('');
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Payment) => {
    setEditingPaymentId(p.id);
    setFormPurchaseId(p.purchaseId);
    setFormAmount(p.amount);
    setFormPaymentDate(p.paymentDate);
    setFormPaymentMethod(p.paymentMethod);
    setFormReferenceNumber(p.referenceNumber || '');
    setFormNotes(p.notes || '');
    setErrorMessage('');
    setIsFormOpen(true);
  };

  // When changing selected invoice, update the default amount
  const handlePurchaseSelectChange = (id: string) => {
    setFormPurchaseId(id);
    const purch = purchases.find(p => p.id === id);
    if (purch) {
      let defaultVal = purch.remainingAmount;
      if (editingPaymentId) {
        const oldPayment = payments.find(pay => pay.id === editingPaymentId);
        if (oldPayment && oldPayment.purchaseId === id) {
          defaultVal += oldPayment.amount;
        }
      }
      setFormAmount(defaultVal);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUser?.role === 'Staff') {
      setErrorMessage('Akses Ditolak: Peran Staff tidak diperbolehkan melakukan pelunasan / pembayaran.');
      return;
    }

    if (!formPurchaseId) {
      setErrorMessage('Harap pilih faktur pembelian!');
      return;
    }

    const selectedPurch = purchases.find(p => p.id === formPurchaseId);
    if (!selectedPurch) {
      setErrorMessage('Faktur tidak ditemukan!');
      return;
    }

    if (formAmount <= 0) {
      setErrorMessage('Jumlah pelunasan wajib lebih besar dari Nol!');
      return;
    }

    let maxAllowed = selectedPurch.remainingAmount;
    if (editingPaymentId) {
      const oldPayment = payments.find(p => p.id === editingPaymentId);
      if (oldPayment && oldPayment.purchaseId === formPurchaseId) {
        maxAllowed += oldPayment.amount;
      }
    }

    if (editingPaymentId) {
      updatePayment(editingPaymentId, {
        purchaseId: formPurchaseId,
        amount: formAmount,
        paymentDate: formPaymentDate,
        paymentMethod: formPaymentMethod,
        referenceNumber: formReferenceNumber,
        notes: formNotes
      });
      setSuccessMessage('Pelunasan hutang berhasil diperbarui!');
    } else {
      addPayment({
        purchaseId: formPurchaseId,
        amount: formAmount,
        paymentDate: formPaymentDate,
        paymentMethod: formPaymentMethod,
        referenceNumber: formReferenceNumber,
        notes: formNotes
      });
      setSuccessMessage('Pelunasan hutang terdaftar dan diproses sukses!');
    }

    setIsFormOpen(false);
    setEditingPaymentId(null);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeletePayment = (id: string) => {
    if (!canDelete) return;
    if (window.confirm('Batalkan pembayaran ini? Pemotongan dana akan dibatalkan, meningkatkan sisa hutang default pada supplier terkait.')) {
      deletePayment(id);
      setSuccessMessage('Mutasi pembayaran berhasil dianulir.');
      setTimeout(() => setSuccessMessage(''), 3500);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Kode Transaksi', 'No Invoice', 'Supplier', 'Tanggal Bayar', 'Metode Pembayaran', 'Nomor Referensi', 'Nominal Pembayaran', 'Dicatat Oleh', 'Keterangan'];
    const data = filteredPayments.map(p => {
      const parentInvoice = purchases.find(purch => purch.id === p.purchaseId);
      const s = suppliers.find(su => su.id === parentInvoice?.supplierId);
      return [
        p.id,
        parentInvoice?.invoiceNumber || 'N/A',
        s?.name || 'N/A',
        p.paymentDate,
        p.paymentMethod,
        p.referenceNumber || '-',
        p.amount.toString(),
        p.receivedBy,
        p.notes || '-'
      ];
    });
    exportToCSV('Riwayat_Pelunasan_Hutang', headers, data);
  };

  // Search filter computes
  const filteredPayments = payments.filter(p => {
    const parentInvoice = purchases.find(purch => purch.id === p.purchaseId);
    const sName = suppliers.find(su => su.id === parentInvoice?.supplierId)?.name || '';
    const invoiceNum = parentInvoice?.invoiceNumber || '';
    const term = searchQuery.toLowerCase();

    const matchesSearch = sName.toLowerCase().includes(term) || 
                          invoiceNum.toLowerCase().includes(term) || 
                          (p.referenceNumber && p.referenceNumber.toLowerCase().includes(term));

    const [year, month] = p.paymentDate.split('-');
    const matchesMonth = selectedMonth === 'all' || month === selectedMonth;
    const matchesYear = selectedYear === 'all' || year === selectedYear;

    return matchesSearch && matchesMonth && matchesYear;
  });

  return (
    <div className="space-y-6">
      
      {/* Header sections */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans">Mutasi Kas & Pembayaran</h1>
          <p className="text-xs text-gray-500">Pencatatan rincian pelunasan nota, bukti transfer bank, audit log pelunasan.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.CSV)</span>
          </button>
          
          {currentUser?.role !== 'Staff' && (
            <button
              onClick={handleOpenForm}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs hover:shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lakukan Pembayaran</span>
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl">
          {successMessage}
        </div>
      )}

      {/* Control filter */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor invoice, supplier, atau nomor referensi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
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
        <div className="text-xs text-gray-500 flex items-center gap-1.5 font-mono shrink-0">
          <span>Tercatat</span>
          <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{filteredPayments.length}</span>
          <span>transaksi pelunasan kas</span>
        </div>
      </div>

      {/* Payments History Register Lists */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100 font-sans font-semibold">
                <th className="p-4">Tanggal Pembayaran</th>
                <th className="p-4">Faktur Rujukan</th>
                <th className="p-4">Supplier / Mitra</th>
                <th className="p-4 text-center">Metode</th>
                <th className="p-4">Ref Transaksi</th>
                <th className="p-4 text-right">Jumlah Dibayar</th>
                <th className="p-4 text-center">Dicatat Oleh</th>
                <th className="p-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 italic">
                    Belum ada riwayat pembayaran tercatat untuk kriteria pencarian ini.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const parentInvoice = purchases.find(purch => purch.id === p.purchaseId);
                  const s = suppliers.find(su => su.id === parentInvoice?.supplierId);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/40 transition-colors">
                      
                      <td className="p-4">
                        <div className="font-semibold text-gray-800 font-mono text-[11px] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDate(p.paymentDate)}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-gray-900 font-mono tracking-tight text-[11px]">
                          {parentInvoice?.invoiceNumber || 'N/A'}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-medium text-gray-800">{s?.name || 'N/A'}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{s?.code || '-'}</div>
                      </td>

                      {/* Payment Mode Badge */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          p.paymentMethod === 'Transfer Bank' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : p.paymentMethod === 'Cek_Giro' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                            : p.paymentMethod === 'Cash' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-gray-50 text-gray-700 border border-gray-100'
                        }`}>
                          {p.paymentMethod}
                        </span>
                      </td>

                      {/* Code Receipts Reference */}
                      <td className="p-4">
                        <span className="font-mono text-gray-700 text-[11px] font-semibold block uppercase">
                          {p.referenceNumber || 'N/A (Cash)'}
                        </span>
                        {p.notes && (
                          <div className="text-[10px] text-gray-400 italic truncate max-w-[124px]" title={p.notes}>
                            {p.notes}
                          </div>
                        )}
                      </td>

                      {/* Payment Cash Paid target */}
                      <td className="p-4 text-right font-bold text-gray-950 font-mono text-[11px]">
                        {formatRupiah(p.amount)}
                      </td>

                      {/* Employee Cashier recorder */}
                      <td className="p-4 text-center text-gray-600 font-medium">
                        {p.receivedBy}
                      </td>

                      {/* View, Edit, & Cancel/Delete Action */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingPayment(p)}
                            className="p-1.5 bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="Detail Bukti Pembayaran"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit rincian pembayaran"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDeletePayment(p.id)}
                              className="p-1.5 bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Batalkan / Hapuskan Pembayaran"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {!canEdit && !canDelete && (
                            <span className="text-[10px] text-gray-300 italic" title="Staff hanya boleh meninjau rincian">Hanya Lihat</span>
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

      {/* Slide-over Form Overlay: Register payment */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            
            {/* Header Form */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  {editingPaymentId ? 'Koreksi / Edit Pelunasan Hutang' : 'Pencatatan Pelunasan Hutang'}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingPaymentId ? 'Sesuaikan data mutasi dana atau koreksi nominal input secara real-time.' : 'Pangkas saldo hutang supplier dengan bayaran valid.'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingPaymentId(null);
                }} 
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scroll form elements */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl">
                  {errorMessage}
                </div>
              )}

              {/* Choose Target Invoice to reduce balance */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Pilih Invoice Rujukan Utang*</label>
                <select
                  value={formPurchaseId}
                  onChange={(e) => handlePurchaseSelectChange(e.target.value)}
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs outline-hidden font-mono font-medium"
                >
                  {selectDropdownPurchases.map(p => {
                    const s = suppliers.find(su => su.id === p.supplierId);
                    let infoAmt = p.remainingAmount;
                    if (editingPaymentId) {
                      const oldPayment = payments.find(pay => pay.id === editingPaymentId);
                      if (oldPayment && oldPayment.purchaseId === p.id) {
                        infoAmt += oldPayment.amount;
                      }
                    }
                    return (
                      <option key={p.id} value={p.id}>
                        {p.invoiceNumber} - {s?.name || 'N/A'} (Utang Tersisa: {formatRupiah(infoAmt)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Informative block showing purchase totals */}
              {(() => {
                const currentPurch = purchases.find(p => p.id === formPurchaseId);
                const s = suppliers.find(su => su.id === currentPurch?.supplierId);
                if (!currentPurch) return null;

                const activePayment = editingPaymentId ? payments.find(pay => pay.id === editingPaymentId) : null;
                const totalPaidExceptThis = activePayment && activePayment.purchaseId === currentPurch.id
                  ? currentPurch.paidAmount - activePayment.amount
                  : currentPurch.paidAmount;
                const remainingBeforeThis = currentPurch.total - totalPaidExceptThis;

                return (
                  <div className="bg-indigo-50/55 border border-indigo-100 rounded-2xl p-4 space-y-3 block text-indigo-950 font-sans shadow-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-indigo-100/40">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-500">Informasi Rujukan Supplier</span>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[9px] font-bold">
                        {currentPurch.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-start font-bold">
                      <div className="space-y-0.5">
                        <span className="text-[13px] block">{s?.name} ({s?.code})</span>
                        {currentPurch.notes && (
                          <span className="text-[10px] text-indigo-600/80 font-normal italic block">
                            Catatan: {currentPurch.notes}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-indigo-700 block text-xs">{currentPurch.invoiceNumber}</span>
                        <span className="text-[10px] text-gray-500 font-normal block font-sans mt-0.5">
                          Tgl Transaksi: {formatDate(currentPurch.purchaseDate)}
                        </span>
                      </div>
                    </div>

                    {/* Compact Item Breakdown */}
                    {currentPurch.items && currentPurch.items.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-400 block mb-1">Rincian Belanja Barang ({currentPurch.items.length})</span>
                        <div className="bg-white/70 border border-indigo-100/30 rounded-xl overflow-hidden max-h-32 overflow-y-auto">
                          <table className="w-full text-[10px] text-indigo-950">
                            <thead>
                              <tr className="bg-indigo-100/20 text-indigo-600 font-semibold border-b border-indigo-100/20">
                                <th className="text-left px-2 py-1.5 font-medium">Nama Barang</th>
                                <th className="text-center px-1 py-1.5 font-medium w-14">Qty</th>
                                <th className="text-right px-1 py-1.5 font-medium w-20">Harga</th>
                                <th className="text-right px-2 py-1.5 font-medium w-24">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-50/50">
                              {currentPurch.items.map((item) => (
                                <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors">
                                  <td className="px-2 py-1.5 font-medium text-gray-800">{item.itemName}</td>
                                  <td className="px-1 py-1.5 text-center font-mono text-gray-500">
                                    {item.quantity} {item.unit}
                                  </td>
                                  <td className="px-1 py-1.5 text-right font-mono text-gray-500">
                                    {formatRupiah(item.price)}
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono font-bold text-indigo-950">
                                    {formatRupiah(item.total)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-2.5 border-t border-indigo-100/40 font-mono">
                      <div>
                        <span className="text-[9px] block text-gray-400 font-sans font-semibold">Total Belanja</span>
                        <strong className="text-indigo-900">{formatRupiah(currentPurch.total)}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] block text-gray-400 font-sans font-semibold">
                          {editingPaymentId ? 'Telah Diangsur Lainnya' : 'Tergolong Bayar'}
                        </span>
                        <strong className="text-indigo-900">{formatRupiah(totalPaidExceptThis)}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] block text-gray-400 font-sans font-semibold">Sisa Maksimal</span>
                        <strong className="text-rose-600">{formatRupiah(remainingBeforeThis)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nominal pembayaran */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Nominal Pelunasan (Rp)*</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                    <input
                      type="number"
                      required
                      min="100"
                      value={formAmount}
                      onChange={(e) => setFormAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="Masukkan nilai"
                      className="w-full text-right pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:border-indigo-500 outline-hidden font-mono text-xs font-bold text-gray-900"
                    />
                  </div>
                </div>

                {/* Tanggal Pelunasan */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block font-sans">Tanggal Bayar*</label>
                  <input
                    type="date"
                    required
                    value={formPaymentDate}
                    onChange={(e) => setFormPaymentDate(e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Metode Pembayaran */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Metode Pembayaran*</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs outline-hidden font-medium"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Cash">Cash (Tunai)</option>
                    <option value="Cek_Giro">Cek / Giro</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Nomor / Keterangan ref transfer */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Nomor Referensi (Transfer)*</label>
                  <input
                    type="text"
                    required={formPaymentMethod === 'Transfer Bank' || formPaymentMethod === 'Cek_Giro'}
                    value={formReferenceNumber}
                    onChange={(e) => setFormReferenceNumber(e.target.value)}
                    placeholder="Contoh: TRF-MND-901 / No BG"
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono font-medium"
                  />
                </div>

              </div>

              {/* Memo desc */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Catatan Tambahan (Kasir)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Lampirkan bukti foto transfer bank lewat Whatsapp"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden block leading-relaxed"
                ></textarea>
              </div>

              {/* Warn flag */}
              <div className="flex items-start gap-2 text-[10px] text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Tindakan ini akan memotong secara real-time saldo hutang bapak/ibu yang tertunggak pada billing supplier bersangkutan. Pastikan dana fisik mencukupi.
                </p>
              </div>

              {/* Form submit/abort buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingPaymentId(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                >
                  {editingPaymentId ? 'Simpan Perubahan' : 'Bayar & Terbitkan Bukti'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Detail Viewer Modal / Printable Receipt */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-gray-800">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Kwitansi Pelunasan</h3>
                  <p className="text-xs font-mono font-bold text-gray-900 mt-1">{viewingPayment.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingPayment(null)} 
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs" id="printable-receipt">
              <div className="text-center pb-4 border-b border-dashed border-gray-200">
                <span className="text-xl font-bold font-sans tracking-tight block text-gray-900">BUKTI TRANSFER / KAS</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block mt-1">Sistem Manajemen Kelola Finansial</span>
              </div>

              <div className="space-y-4">
                {/* 2 column grid metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Tanggal Pelunasan</span>
                    <span className="font-mono text-gray-900 font-semibold">{formatDate(viewingPayment.paymentDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Metode Pembayaran</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      viewingPayment.paymentMethod === 'Transfer Bank' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : viewingPayment.paymentMethod === 'Cek_Giro' 
                        ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                        : viewingPayment.paymentMethod === 'Cash' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-gray-50 text-gray-700 border border-gray-100'
                    }`}>
                      {viewingPayment.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Faktur Rujukan</span>
                    <span className="font-mono text-indigo-600 font-bold">
                      {purchases.find(p => p.id === viewingPayment.purchaseId)?.invoiceNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Nomor Referensi</span>
                    <span className="font-mono text-gray-900 font-semibold">{viewingPayment.referenceNumber || 'N/A (Cash)'}</span>
                  </div>
                </div>

                {/* Supplier Detail Panel */}
                {(() => {
                  const purch = purchases.find(p => p.id === viewingPayment.purchaseId);
                  const supplier = suppliers.find(s => s.id === purch?.supplierId);
                  if (!supplier) return null;
                  return (
                    <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 space-y-2">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block">Pihak Penerima (Supplier Mitra)</span>
                      <div className="font-bold text-gray-900">{supplier.name}</div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 font-sans">
                        <div>
                          <span className="block text-[10px] text-gray-400">Hubungi Kontak</span>
                          <span>{supplier.phone || '-'}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-400">Rekening Bank</span>
                          <span className="font-mono text-gray-700 font-bold">{supplier.bankName} - {supplier.bankAccount}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Amount Box */}
                <div className="bg-indigo-900 text-white rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">TOTAL DANA DICAIRKAN</span>
                  <span className="text-xl font-black font-mono">{formatRupiah(viewingPayment.amount)}</span>
                </div>

                {/* Notes and operator detail */}
                <div className="space-y-3 text-gray-600">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Catatan Kasir</span>
                    <p className="italic leading-relaxed text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      {viewingPayment.notes || 'Tidak ada catatan tambahan untuk pembayaran ini.'}
                    </p>
                  </div>
                  <div className="flex justify-between text-[10px] pt-2 border-t border-gray-100 font-mono text-gray-400">
                    <span>Dicatat: <strong className="text-gray-700">{viewingPayment.receivedBy}</strong></span>
                    <span>Waktu entri: <strong className="text-gray-700">{formatDate(viewingPayment.createdAt)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Actions panel inside modal */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewingPayment(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const printContents = document.getElementById('printable-receipt')?.innerHTML;
                    if (printContents) {
                      const originalContents = document.body.innerHTML;
                      document.body.innerHTML = `
                        <div style="padding: 40px; font-family: sans-serif; max-width: 500px; margin: 0 auto; line-height: 1.5; color: #111;">
                          ${printContents}
                        </div>
                      `;
                      window.print();
                      document.body.innerHTML = originalContents;
                      window.location.reload(); 
                    }
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Kwitansi</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
