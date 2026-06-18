/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { formatRupiah, formatDate, exportToCSV } from '../data';
import { FileSpreadsheet, Printer, Calendar, Search, ClipboardList, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function HutangLaporan() {
  const { purchases, suppliers, payments } = useAppState();

  // Selected supplier drill-down state (null if none, supplierId if selected)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Calculate General Aging Brackets Grouping
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  let agingCurrent = 0; // Not due yet
  let agingOverdue1 = 0; // Overdue 1 - 30 days
  let agingOverdue2 = 0; // Overdue 31 - 60 days
  let agingOverdue3 = 0; // Overdue > 60 days

  purchases.forEach(p => {
    if (p.status !== 'Lunas' || p.remainingAmount < 0) {
      const dueDate = new Date(p.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24)); // positive means overdue!

      if (diffDays <= 0) {
        agingCurrent += p.remainingAmount;
      } else if (diffDays <= 30) {
        agingOverdue1 += p.remainingAmount;
      } else if (diffDays <= 60) {
        agingOverdue2 += p.remainingAmount;
      } else {
        agingOverdue3 += p.remainingAmount;
      }
    }
  });

  const totalOutstanding = agingCurrent + agingOverdue1 + agingOverdue2 + agingOverdue3;

  // 2. Map Supplier Accounts payable aggregations
  const supplierHutangSummary = suppliers.map(s => {
    const sPurchases = purchases.filter(p => p.supplierId === s.id);
    const totalPurchased = sPurchases.reduce((acc, p) => acc + p.total, 0);
    const totalPaid = sPurchases.reduce((acc, p) => acc + p.paidAmount, 0);
    const remainingHutang = sPurchases.reduce((acc, p) => acc + p.remainingAmount, 0);
    const activeInvoicesCount = sPurchases.filter(p => p.status !== 'Lunas' || p.remainingAmount < 0).length;

    return {
      supplier: s,
      totalPurchased,
      totalPaid,
      remainingHutang,
      activeInvoicesCount
    };
  }).filter(entry => entry.remainingHutang !== 0 || searchQuery === ''); // Show all or filter if searched

  // Filter based on search query
  const filteredSummary = supplierHutangSummary.filter(entry => 
    entry.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.supplier.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 3. Drill-down target purchases listing
  const activeDetailPurchases = selectedSupplierId 
    ? purchases.filter(p => p.supplierId === selectedSupplierId && (p.status !== 'Lunas' || p.remainingAmount < 0))
    : [];

  const drilldownSupplierName = selectedSupplierId
    ? suppliers.find(s => s.id === selectedSupplierId)?.name || 'Mitra'
    : '';

  // Export handlers
  const handleCSVExport = () => {
    const headers = ['Kode Supplier', 'Nama Supplier', 'Total Belanja Kotor', 'Total Dana Terbayar', 'Sisa Saldo Hutang Aktif', 'Jumlah Faktur Belum Lunas'];
    const data = filteredSummary.map(entry => [
      entry.supplier.code,
      entry.supplier.name,
      entry.totalPurchased.toString(),
      entry.totalPaid.toString(),
      entry.remainingHutang.toString(),
      entry.activeInvoicesCount.toString()
    ]);
    exportToCSV('Laporan_Hutang_Supplier_Maturity', headers, data);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header section (Invis in printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans">Laporan Hutang & Aging Kredit</h1>
          <p className="text-xs text-gray-500">Maturitas jatuh tempo saldo hutang dagang per supplier dengan rincian durasi keterlambatan.</p>
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
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs hover:shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Wrapper Header (Hidden by default, shown ONLY in Print) */}
      <div className="hidden print:block border-b pb-4 mb-4 font-sans space-y-1">
        <h1 className="text-2xl font-black text-gray-950">LAPORAN MUTASI & ANALISIS TEMPO HUTANG DAGANG</h1>
        <p className="text-sm text-gray-500">Sistem Pencatatan Supplierku | Tanggal Audit: {formatDate(todayStr)}</p>
      </div>

      {/* Aging maturity brackets visual block */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Analisis Umur Hutang Dagang (A/P Aging Overview)</h3>
          <p className="text-xs text-gray-400 mt-0.5">Pemetaan likuiditas berdasarkan selisih jatuh tempo faktur sisa bayar.</p>
        </div>

        {/* 4-Column Aging brackets */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
          
          {/* Current / Lancar */}
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl block space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Belum Jatuh Tempo</span>
            <div className="text-base font-bold text-emerald-950 font-mono tracking-tight">{formatRupiah(agingCurrent)}</div>
            <p className="text-[10px] text-emerald-600 font-sans">Mutasi aman / dalam masa kredit</p>
          </div>

          {/* Overdue 1-30 */}
          <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl block space-y-1">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Terlambat 1 - 30 Hari</span>
            <div className="text-base font-bold text-amber-950 font-mono tracking-tight">{formatRupiah(agingOverdue1)}</div>
            <p className="text-[10px] text-amber-600">Terhitung jatuh tempo bulanan</p>
          </div>

          {/* Overdue 31-60 */}
          <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl block space-y-1">
            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">Terlambat 31 - 60 Hari</span>
            <div className="text-base font-bold text-orange-950 font-mono tracking-tight">{formatRupiah(agingOverdue2)}</div>
            <p className="text-[10px] text-orange-600">Dibutuhkan monitoring ketat</p>
          </div>

          {/* Overdue >60 */}
          <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl block space-y-1">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Terlambat &gt; 60 Hari</span>
            <div className="text-base font-bold text-rose-950 font-mono tracking-tight">{formatRupiah(agingOverdue3)}</div>
            <p className="text-[10px] text-rose-600">Sangat kritis / Red alert</p>
          </div>

        </div>

        {/* Sum Outstanding meter bar */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-1.5 font-sans">
            <ClipboardList className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-gray-500 font-medium">Buku Besar Sisa Saldo Kredit Hutang:</span>
            <strong className="text-gray-900 font-bold font-mono text-[13px]">{formatRupiah(totalOutstanding)}</strong>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400">
            <span>Rerata pembagian:</span>
            <span className="px-2 py-0.5 rounded-sm bg-gray-100 text-gray-700 font-bold uppercase">
              {totalOutstanding === 0 ? 'Bersih Dari Hutang' : 'Terdapat Tagihan Aktif'}
            </span>
          </div>
        </div>

      </div>

      {/* Main ledger list: Supplier accounts outstanding */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs space-y-4">
        
        {/* Search header (Invis in printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Arsip Akun Kewajiban per Supplier</h3>
            <p className="text-xs text-gray-400 mt-0.5">Pemantauan neraca belanja kotor vs dana sisa bayar.</p>
          </div>

          <div className="relative max-w-xs w-full self-start">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50/70 border border-gray-150 rounded-lg text-xs focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Ledger table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <th className="p-3 font-semibold">Kode Supplier</th>
                <th className="p-3 font-semibold">Nama Supplier / Vendor</th>
                <th className="p-3 text-right font-semibold">Total Belanja Kotor</th>
                <th className="p-3 text-right font-semibold">Total Dana Terbayar</th>
                <th className="p-3 text-right font-semibold">Sisa Hutang Aktif</th>
                <th className="p-3 text-center font-semibold">Faktur Outstanding</th>
                <th className="p-3 text-center font-semibold print:hidden">Tindakan Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSummary.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                    Tidak ada supplier yang memikul sisa pinjaman operasional saat ini.
                  </td>
                </tr>
              ) : (
                filteredSummary.map((entry) => {
                  const isDrillActive = selectedSupplierId === entry.supplier.id;
                  return (
                    <React.Fragment key={entry.supplier.id}>
                      <tr className={`hover:bg-gray-50/40 transition-colors ${entry.remainingHutang > 0 ? 'font-medium' : 'text-gray-500'}`}>
                        
                        {/* Code */}
                        <td className="p-3 font-mono text-gray-700">{entry.supplier.code}</td>
                        
                        {/* Name */}
                        <td className="p-3 font-bold text-gray-900">{entry.supplier.name}</td>
                        
                        {/* Total Purchased kotor */}
                        <td className="p-3 text-right font-mono text-gray-600">{formatRupiah(entry.totalPurchased)}</td>
                        
                        {/* Total Paid */}
                        <td className="p-3 text-right font-mono text-emerald-600">{formatRupiah(entry.totalPaid)}</td>
                        
                        {/* Sisa Hutang Aktif */}
                        <td className={`p-3 text-right font-mono font-bold text-[12px] ${entry.remainingHutang > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatRupiah(entry.remainingHutang)}
                        </td>

                        {/* Counts invoices */}
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            entry.activeInvoicesCount > 0 
                              ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {entry.activeInvoicesCount} Faktur
                          </span>
                        </td>

                        {/* Trigger expand drilldown */}
                        <td className="p-3 text-center print:hidden">
                          <button
                            onClick={() => setSelectedSupplierId(isDrillActive ? null : entry.supplier.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                          >
                            <span>{isDrillActive ? 'Tutup Detail' : 'Periksa Rincian'}</span>
                            {isDrillActive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                      </tr>

                      {/* Expandable sub-table drilldown for this supplier */}
                      {isDrillActive && (
                        <tr className="bg-gray-50/60 print:table-row">
                          <td colSpan={7} className="p-4 border-y border-gray-150">
                            <div className="space-y-3 font-sans max-w-4xl mx-auto">
                              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                Rincian Faktur Belum Lunas Milik: {entry.supplier.name}
                              </h4>

                              <div className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-xs">
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                    <tr>
                                      <th className="p-2.5 font-semibold">Nomor Invoice</th>
                                      <th className="p-2.5 font-semibold">Tgl Transaksi</th>
                                      <th className="p-2.5 font-semibold">Jatuh Tempo</th>
                                      <th className="p-2.5 text-center">Terhitung Hari</th>
                                      <th className="p-2.5 text-right">Total Nota</th>
                                      <th className="p-2.5 text-right">Sudah Dibayar</th>
                                      <th className="p-2.5 text-right">Sisa Unpaid</th>
                                      <th className="p-2.5 text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {purchases.filter(p => p.supplierId === entry.supplier.id && (p.status !== 'Lunas' || p.remainingAmount < 0)).map(p => {
                                      const daysLeft = Math.ceil((new Date(p.dueDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
                                      return (
                                        <tr key={p.id} className="hover:bg-gray-50/40">
                                          <td className="p-2.5 font-bold font-mono text-gray-900">{p.invoiceNumber}</td>
                                          <td className="p-2.5 text-gray-500">{p.purchaseDate}</td>
                                          <td className="p-2.5 text-gray-600 font-mono font-medium">{p.dueDate}</td>
                                          
                                          {/* Days calculation */}
                                          <td className="p-2.5 text-center font-bold">
                                            {daysLeft < 0 ? (
                                              <span className="text-rose-600">Terlambat {Math.abs(daysLeft)} hr</span>
                                            ) : (
                                              <span className="text-amber-600">{daysLeft} hr lagi</span>
                                            )}
                                          </td>

                                          <td className="p-2.5 text-right font-mono">{formatRupiah(p.total)}</td>
                                          <td className="p-2.5 text-right font-mono text-emerald-600">{formatRupiah(p.paidAmount)}</td>
                                          <td className={`p-2.5 text-right font-mono font-bold ${p.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatRupiah(p.remainingAmount)}</td>
                                          
                                          {/* Status label */}
                                          <td className="p-2.5 text-center">
                                            {p.remainingAmount < 0 ? (
                                              <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                                {p.status} (Lebih)
                                              </span>
                                            ) : (
                                              <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px]">
                                                {p.status}
                                              </span>
                                            )}
                                          </td>

                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
