/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { formatRupiah, formatDate } from '../data';
import { ShoppingBag, CheckCircle, AlertCircle, TrendingUp, ArrowUpRight, DollarSign, Calendar } from 'lucide-react';

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const { purchases, suppliers, payments, notifications } = useAppState();
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // List of Indonesian months
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

  // Extract unique years from purchases
  const availableYears = Array.from(new Set(purchases.map(p => p.purchaseDate.split('-')[0]))).sort((a: string, b: string) => b.localeCompare(a)) as string[];
  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear().toString());
  }

  // Filter purchases based on selected month and year
  const filteredPurchases = purchases.filter(p => {
    const [year, month] = p.purchaseDate.split('-');
    const matchMonth = selectedMonth === 'all' || month === selectedMonth;
    const matchYear = selectedYear === 'all' || year === selectedYear;
    return matchMonth && matchYear;
  });

  // 1. KPI Calculations
  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  const totalPaidAmount = filteredPurchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalHutangAmount = filteredPurchases.reduce((sum, p) => sum + p.remainingAmount, 0);

  const overdueInvoices = filteredPurchases.filter(p => {
    if (p.status === 'Lunas') return false;
    const today = new Date().toISOString().split('T')[0];
    return p.dueDate < today;
  });

  const totalOverdueAmount = overdueInvoices.reduce((sum, p) => sum + p.remainingAmount, 0);

  // 2. Chart Data Prep: Hutang per Supplier
  const supplierHutangMap: { [supplierName: string]: number } = {};
  filteredPurchases.forEach(p => {
    const sName = suppliers.find(s => s.id === p.supplierId)?.name || 'Lainnya';
    supplierHutangMap[sName] = (supplierHutangMap[sName] || 0) + p.remainingAmount;
  });

  const supplierHutangList = Object.entries(supplierHutangMap)
    .map(([name, amount]) => ({ name, amount }))
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // 3. Status Distribution calculations (for Ring/Donut chart rendering)
  const statusCounts = {
    Lunas: filteredPurchases.filter(p => p.status === 'Lunas').length,
    Sebagian: filteredPurchases.filter(p => p.status === 'Sebagian').length,
    'Belum Lunas': filteredPurchases.filter(p => p.status === 'Belum Lunas').length,
  };
  const totalStatus = filteredPurchases.length || 1;

  // Recent Purchases List
  const recentPurchases = filteredPurchases.slice(0, 5);

  // SVG Chart Helper Parameters
  const chartMaxVal = Math.max(...supplierHutangList.map(item => item.amount), 100000);

  return (
    <div className="space-y-6">
      {/* Upper Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 font-sans">
            Dasbor Analitik Pembelian & Hutang
          </h1>
          <p className="text-sm text-gray-500">
            Pemantauan instan laporan hutang dagang, pembayaran jatuh tempo, dan riwayat aktivitas supplier.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg text-gray-600 font-mono self-start md:self-center">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>Hari ini: {formatDate(new Date().toISOString().split('T')[0])}</span>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-gray-700">Filter Analitik Periode:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Select */}
          <select
            id="month-filter"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans outline-none cursor-pointer"
          >
            {monthsList.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Year Select */}
          <select
            id="year-filter"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans outline-none cursor-pointer"
          >
            <option value="all">Semua Tahun</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          {/* Reset button if filtered */}
          {(selectedMonth !== 'all' || selectedYear !== 'all') && (
            <button
              onClick={() => {
                setSelectedMonth('all');
                setSelectedYear('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline cursor-pointer pl-1"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Critical Overdue Alert Banner if any overdue */}
      {overdueInvoices.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-4 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900">
              Perhatian: Terdapat {overdueInvoices.length} faktur melewati tanggal jatuh tempo!
            </h4>
            <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
              Total hutang yang terlambat dilunasi adalah <strong className="font-semibold">{formatRupiah(totalOverdueAmount)}</strong>. Harap segera koordinasikan jadwal pembayaran dengan supplier terkait.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('laporan-hutang')} 
            className="text-xs font-medium text-amber-800 hover:text-amber-900 underline shrink-0 cursor-pointer"
          >
            Selesaikan Pelunasan &rarr;
          </button>
        </div>
      )}

      {/* Metric 4-Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-gray-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-sans">Total Pembelian</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-gray-900">{formatRupiah(totalPurchasesAmount)}</h3>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-mono">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>{purchases.length} Faktur Terbit</span>
            </p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-gray-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-sans">Hutang Terbayar</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-gray-900">{formatRupiah(totalPaidAmount)}</h3>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-mono">
              <span>{((totalPaidAmount / (totalPurchasesAmount || 1)) * 100).toFixed(1)}% Terlunasi</span>
            </p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-gray-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider font-sans">Sisa Hutang Aktif</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-gray-900">{formatRupiah(totalHutangAmount)}</h3>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-mono">
              <span>{((totalHutangAmount / (totalPurchasesAmount || 1)) * 100).toFixed(1)}% Dari Total Tagihan</span>
            </p>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-gray-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider font-sans">Supplier & Vendor</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <div className="w-5 h-5 flex items-center justify-center font-bold text-sm">S</div>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold text-gray-900">{suppliers.length} Supplier</h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span>Pemasok utama operasional</span>
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Custom SVG Bar Chart: Hutang Per Supplier */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Distribusi Sisa Hutang per Supplier</h3>
              <p className="text-xs text-gray-400 mt-0.5">Pemetaan hutang yang masih aktif untuk diselesaikan</p>
            </div>
          </div>

          {supplierHutangList.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-gray-100 rounded-xl bg-gray-50/50">
              <p className="text-xs text-gray-400 font-sans">Semua hutang supplier telah lunas sepenuhnya!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {supplierHutangList.map((item, idx) => {
                const pct = (item.amount / chartMaxVal) * 100;
                return (
                  <div 
                    key={idx} 
                    className="space-y-1"
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">{item.name}</span>
                      <span className="font-semibold text-gray-900 font-mono">{formatRupiah(item.amount)}</span>
                    </div>
                    <div className="w-full bg-gray-50 h-5 rounded-md overflow-hidden relative border border-gray-100/50">
                      <div 
                        className={`h-full transition-all duration-500 rounded-r-sm ${
                          idx === 0 
                            ? 'bg-rose-500 hover:bg-rose-600' 
                            : idx === 1 
                            ? 'bg-amber-500 hover:bg-amber-600' 
                            : 'bg-indigo-500 hover:bg-indigo-600'
                        }`}
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      ></div>
                      {hoveredBarIndex === idx && (
                        <div className="absolute inset-y-0 right-2 flex items-center text-[10px] font-mono text-gray-500">
                          {pct.toFixed(0)}% dari tagihan tertinggi
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom SVG Pie/Donut Chart: Status Faktur */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Status Pembayaran Faktur</h3>
          <p className="text-xs text-gray-400 mt-0.5 mb-6">Porsi rasio lunas vs tertunggak</p>

          <div className="flex flex-col items-center justify-center">
            {/* Embedded SVG Circle Chart */}
            <svg className="w-40 h-40" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3" />
              
              {/* Green Lunas segment */}
              {statusCounts.Lunas > 0 && (
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.915" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="3.5" 
                  strokeDasharray={`${(statusCounts.Lunas / totalStatus) * 100} ${100 - ((statusCounts.Lunas / totalStatus) * 100)}`} 
                  strokeDashoffset="100" 
                />
              )}

              {/* Amber Sebagian segment */}
              {statusCounts.Sebagian > 0 && (
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.915" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="3.5" 
                  strokeDasharray={`${(statusCounts.Sebagian / totalStatus) * 100} ${100 - ((statusCounts.Sebagian / totalStatus) * 100)}`} 
                  strokeDashoffset={`${100 - ((statusCounts.Lunas / totalStatus) * 100)}`} 
                />
              )}

              {/* Red Belum Lunas segment */}
              {statusCounts['Belum Lunas'] > 0 && (
                <circle 
                  cx="18" 
                  cy="18" 
                  r="15.915" 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="3.5" 
                  strokeDasharray={`${(statusCounts['Belum Lunas'] / totalStatus) * 100} ${100 - ((statusCounts['Belum Lunas'] / totalStatus) * 100)}`} 
                  strokeDashoffset={`${100 - (((statusCounts.Lunas + statusCounts.Sebagian) / totalStatus) * 100)}`} 
                />
              )}
              
              {/* Text in inside */}
              <g className="translate-y-1">
                <text x="18" y="16" alignmentBaseline="middle" textAnchor="middle" className="text-[5px] font-bold fill-gray-900 font-sans">
                  {filteredPurchases.length}
                </text>
                <text x="18" y="21" alignmentBaseline="middle" textAnchor="middle" className="text-[2.5px] fill-gray-400 font-sans tracking-wide">
                  FAKTUR
                </text>
              </g>
            </svg>

            {/* Donut Legend */}
            <div className="mt-6 w-full space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-gray-500">Lunas</span>
                </div>
                <span className="font-semibold text-gray-800 font-mono">
                  {statusCounts.Lunas} ({((statusCounts.Lunas / totalStatus) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                  <span className="text-gray-500">Sebagian</span>
                </div>
                <span className="font-semibold text-gray-800 font-mono">
                  {statusCounts.Sebagian} ({((statusCounts.Sebagian / totalStatus) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                  <span className="text-gray-500">Belum Lunas</span>
                </div>
                <span className="font-semibold text-gray-800 font-mono">
                  {statusCounts['Belum Lunas']} ({((statusCounts['Belum Lunas'] / totalStatus) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Purchases & Live Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Purchases Column */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Daftar Faktur Pembelian Terbaru</h3>
              <p className="text-xs text-gray-400 mt-0.5">Daftar mutasi belanja material terbaru</p>
            </div>
            <button 
              onClick={() => setActiveTab('pembelian')} 
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="p-3 font-semibold">Tgl Transaksi</th>
                  <th className="p-3 font-semibold">No Invoice</th>
                  <th className="p-3 font-semibold">Supplier</th>
                  <th className="p-3 font-semibold text-right">Total Tagihan</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPurchases.map((p) => {
                  const sName = suppliers.find(s => s.id === p.supplierId)?.name || 'N/A';
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="p-3 text-gray-600">{formatDate(p.purchaseDate)}</td>
                      <td className="p-3 font-medium text-gray-900 font-mono">{p.invoiceNumber}</td>
                      <td className="p-3 text-gray-600 truncate max-w-[150px]">{sName}</td>
                      <td className="p-3 font-medium text-gray-900 text-right font-mono">{formatRupiah(p.total)}</td>
                      <td className="p-3 text-center">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live System Alerts Module */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Pusat Alert Jatuh Tempo</h3>
            <p className="text-xs text-gray-400 mt-0.5">Disinkronkan secara real-time</p>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center p-4 text-center">
                <CheckCircle className="w-7 h-7 text-emerald-400 mb-2" />
                <p className="text-xs text-gray-700 font-semibold">Semua tagihan aman!</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Tidak ada jatuh tempo terdekat atau keterlambatan beredar.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                    notif.type === 'overdue' 
                      ? 'bg-rose-50/50 border-rose-100 text-rose-950' 
                      : 'bg-amber-50/50 border-amber-100 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${notif.type === 'overdue' ? 'bg-rose-600' : 'bg-amber-500'}`}></span>
                      {notif.title}
                    </span>
                    <span className="text-[9px] text-gray-400 shrink-0 font-mono">
                      Jatuh Tempo: {notif.targetDate}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
