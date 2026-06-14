/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { formatDate } from '../data';
import { Terminal, ShieldAlert, RotateCcw, Search, Database } from 'lucide-react';

export default function Logs() {
  const { logs, clearAllData, currentUser } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = currentUser?.role === 'Admin';

  const handleResetSystem = () => {
    if (!isAdmin) {
      alert('Akses Terbatas: Hanya Administrator Sistem Utama yang diperbolehkan memicu refresh database.');
      return;
    }
    if (window.confirm('PERINGATAN: Tindakan ini akan menghapus semua supplier, transaksi pembelian, dan pelunasan pembayaran yang Anda input sendiri, lalu memulihkannya ke demo bawaan awal! Lanjutkan?')) {
      clearAllData();
      alert('Sistem berhasil direstorasi bersih!');
    }
  };

  const filteredLogs = logs.filter(l => 
    l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.target.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jejak Log Audit & Aktivitas</h1>
          <p className="text-xs text-gray-500">Log transaksi internal, pencatatan waktu audit, dan manajemen pemulihan cloud.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleResetSystem}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Database Contoh</span>
          </button>
        )}
      </div>

      {/* Control filter */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Saring berdasarkan nama personil, jenis aktivitas atau rujukan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50/50 border border-gray-150 rounded-lg text-xs focus:bg-white focus:outline-hidden"
          />
        </div>
        <div className="text-[11px] text-gray-400 font-mono">
          <span>Menyimpan jejak sebanyak {filteredLogs.length} rangkaian mutasi audit</span>
        </div>
      </div>

      {/* Audit Log Table Visuals */}
      <div className="bg-slate-900 border border-slate-950 rounded-2xl overflow-hidden p-5 shadow-inner">
        
        {/* Visual Terminal barHeader */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-slate-400 font-mono text-[10px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-500 font-bold uppercase tracking-wider block ml-2">Audit-Ledger:~ Terminal Live</span>
          </div>
          <span className="text-slate-600">Encrypted DB Node: Active</span>
        </div>

        {/* Logging dynamic rows */}
        <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <p className="text-slate-500 italic text-xs font-mono text-center py-10">[Output Empty: Tidak ada log audit kecocokan]</p>
          ) : (
            filteredLogs.map((log) => {
              // Color highlight actions
              let actionColor = 'text-indigo-400';
              if (log.action === 'TAMBAH_PEMBELIAN') actionColor = 'text-cyan-400';
              if (log.action === 'PROSES_BAYAR') actionColor = 'text-emerald-400';
              if (log.action.includes('HAPUS') || log.action === 'BATAL_BAYAR') actionColor = 'text-rose-400';
              if (log.action === 'LOGIN') actionColor = 'text-yellow-400';

              return (
                <div key={log.id} className="text-xs font-mono leading-relaxed text-slate-300 border-b border-slate-800/40 pb-2 flex flex-col md:flex-row md:items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                      <span className="text-slate-500">[{log.timestamp}]</span>
                      <span className="text-slate-400 font-bold uppercase">{log.userName}</span>
                      <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.2 rounded-sm uppercase font-sans tracking-wide">
                        {log.userRole}
                      </span>
                    </div>
                    <p className="text-slate-200">
                      Pemicu <strong className={`${actionColor} font-bold`}>{log.action}</strong> terhadap target: <span className="text-indigo-200 hover:underline">{log.target}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-600 self-start md:self-end">Node_ID: {log.id}</span>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
