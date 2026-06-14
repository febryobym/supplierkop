/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { Payment, PaymentMethod } from '../types';
import { formatRupiah, formatDate, exportToCSV } from '../data';
import { Plus, Search, Trash2, Landmark, CreditCard, ChevronRight, FileSpreadsheet, X, CheckCircle, Calendar, MessageSquare, ShieldAlert } from 'lucide-react';

export default function Payments() {
  const { payments, purchases, suppliers, addPayment, deletePayment, currentUser, showConfirm, showAlert } = useAppState();

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  // Filter purchases that still have outstanding balances for recording payment
  const unpaidPurchases = purchases.filter(p => p.status !== 'Lunas');

  const handleOpenForm = () => {
    if (unpaidPurchases.length === 0) {
      showAlert('Antrian Kosong', 'Tidak ada tagihan atau hutang faktur aktif yang membutuhkan pelunasan saat ini.');
      return;
    }
    const defaultPurchase = unpaidPurchases[0];
    setFormPurchaseId(defaultPurchase.id);
    setFormAmount(defaultPurchase.remainingAmount); // Autofill full remaining amount
    setFormPaymentDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('Transfer Bank');
    setFormReferenceNumber('');
    setFormNotes('');
    setErrorMessage('');
    setIsFormOpen(true);
  };

  // When changing selected invoice, update the default amount to current max remaining
  const handlePurchaseSelectChange = (id: string) => {
    setFormPurchaseId(id);
    const purch = purchases.find(p => p.id === id);
    if (purch) {
      setFormAmount(purch.remainingAmount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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

    if (formAmount > selectedPurch.remainingAmount) {
      setErrorMessage(`Jumlah pelunasan melebihi sisa hutang aktif (${formatRupiah(selectedPurch.remainingAmount)})!`);
      return;
    }

    // Trigger state context save
    addPayment({
      purchaseId: formPurchaseId,
      amount: formAmount,
      paymentDate: formPaymentDate,
      paymentMethod: formPaymentMethod,
      referenceNumber: formReferenceNumber,
      notes: formNotes
    });

    setSuccessMessage('Pelunasan hutang terdaftar dan diproses sukses!');
    setIsFormOpen(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeletePayment = (id: string) => {
    if (!canDelete) return;
    showConfirm(
      'Batalkan Pelunasan',
      'Apakah Anda yakin ingin membatalkan pembayaran ini? Pemotongan dana akan dianulir, sehingga sisa hutang pada supplier terkait akan bertambah kembali.',
      () => {
        deletePayment(id);
        setSuccessMessage('Mutasi pembayaran berhasil dianulir.');
        setTimeout(() => setSuccessMessage(''), 3500);
      }
    );
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

    return sName.toLowerCase().includes(term) || 
           invoiceNum.toLowerCase().includes(term) || 
           (p.referenceNumber && p.referenceNumber.toLowerCase().includes(term));
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
          
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lakukan Pembayaran</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl">
          {successMessage}
        </div>
      )}

      {/* Control filter */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        <div className="text-xs text-gray-500 flex items-center gap-1.5 font-mono">
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

                      {/* Cancel / Revoke Action */}
                      <td className="p-4 text-center">
                        {canDelete ? (
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1.5 bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Batalkan / Hapuskan Pembayaran"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-300 italic" title="Staff tidak diperbolehkan mendelete">Lembaga</span>
                        )}
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
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Pencatatan Pelunasan Hutang</h3>
                <p className="text-xs text-gray-500">Pangkas saldo hutang supplier dengan bayaran valid.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)} 
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
                  {unpaidPurchases.map(p => {
                    const s = suppliers.find(s => s.id === p.supplierId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.invoiceNumber} - {s?.name || 'N/A'} (Sisa Hutang: {formatRupiah(p.remainingAmount)})
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
                return (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-2 block text-indigo-950 font-sans">
                    <span className="text-[9px] uppercase tracking-widest font-bold block text-indigo-500">Informasi Rujukan Supplier</span>
                    <div className="flex justify-between font-bold">
                      <span>{s?.name} ({s?.code})</span>
                      <span className="font-mono text-indigo-700">{currentPurch.invoiceNumber}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-indigo-100/40 font-mono">
                      <div>
                        <span className="text-[10px] block text-gray-400">Total Belanja</span>
                        <strong>{formatRupiah(currentPurch.total)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] block text-gray-400">Tergolong Bayar</span>
                        <strong>{formatRupiah(currentPurch.paidAmount)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] block text-gray-400">Sisa Outstanding</span>
                        <strong className="text-rose-600">{formatRupiah(currentPurch.remainingAmount)}</strong>
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
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                >
                  Bayar & Terbitkan Bukti
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
