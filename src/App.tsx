import React, { useState } from 'react';
import { StateProvider, useAppState } from './context/StateContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Suppliers from './components/Suppliers';
import Purchases from './components/Purchases';
import Payments from './components/Payments';
import HutangLaporan from './components/HutangLaporan';
import UserManagement from './components/UserManagement';
import Logs from './components/Logs';
import { 
  LayoutDashboard, 
  Truck, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Terminal, 
  LogOut, 
  Bell, 
  Menu, 
  X, 
  User,
  CheckCircle,
  ShieldAlert,
  Info,
  RefreshCw
} from 'lucide-react';

function AppContent() {
  const { currentUser, logout, notifications, markAllNotificationsRead, isOfflineFallback, authError, isSyncing } = useAppState();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // If not logged in, show polished Login screen
  if (!currentUser) {
    return <Login />;
  }

  // Count unread alerts
  const unreadNotifs = notifications.filter(n => !n.isRead);

  // Nav configuration by role
  const navItems = [
    { id: 'dashboard', label: 'Dasbor Analitik', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Staff'] },
    { id: 'supplier', label: 'Database Supplier', icon: Truck, roles: ['Admin', 'Manager', 'Staff'] },
    { id: 'pembelian', label: 'Buku Pembelian', icon: FileText, roles: ['Admin', 'Manager', 'Staff'] },
    { id: 'pembayaran', label: 'Mutasi Kas / Bayar', icon: CreditCard, roles: ['Admin', 'Manager', 'Staff'] },
    { id: 'laporan-hutang', label: 'Laporan Hutang', icon: TrendingUp, roles: ['Admin', 'Manager', 'Staff'] },
    { id: 'pengguna', label: 'Privilege User', icon: Users, roles: ['Admin', 'Manager'] }, // Hidden for Staff
    { id: 'log-audit', label: 'Jejak Log Audit', icon: Terminal, roles: ['Admin', 'Manager'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  const handleLogout = () => {
    logout();
    setActiveTab('dashboard');
  };

  const handleMarkNotifsRead = () => {
    markAllNotificationsRead();
    setIsNotifDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 flex flex-col md:flex-row font-sans selection:bg-indigo-50 selection:text-indigo-950">
      
      {/* 1. SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-950 text-slate-100 shrink-0 select-none">
        {/* Brand Banner */}
        <div className="p-6 border-b border-slate-800/40   flex items-center gap-3">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/9/90/National_emblem_of_Indonesia_Garuda_Pancasila.svg" 
            alt="Logo Garuda Pancasila"
            referrerPolicy="no-referrer"
            className="w-10 h-10 object-contain shrink-0"
          />
          <div>
            <h2 className="text-xs font-bold tracking-tight uppercase leading-snug">Koperasi GMP</h2>
            <p className="text-[9px] text-slate-400 font-mono">Buku Pembelian & Kas</p>
          </div>
        </div>

        {/* Navigation directory */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-black shadow-md shadow-indigo-500/15 font-bold' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-slate-500 group-hover:text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Account Details Footer inside sidebar */}
        <div className="p-4 border-t border-slate-800/40 bg-slate-950/20 space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/35">
            <div className="w-8 h-8 rounded-full bg-slate-700 font-bold text-xs text-slate-200 flex items-center justify-center border border-slate-600">
              {currentUser.name.charAt(0)}
            </div>
            <div className="truncate text-xs">
              <p className="font-bold text-slate-100 truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider uppercase font-mono ${
                  currentUser.role === 'Admin' 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : currentUser.role === 'Manager' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 bg-slate-800 hover:bg-slate-800/80 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-800/80 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE TOP-BAR & HAMBURGER */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-950 select-none print:hidden">
        <div className="flex items-center gap-2.5">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/9/90/National_emblem_of_Indonesia_Garuda_Pancasila.svg" 
            alt="Logo Garuda Pancasila"
            referrerPolicy="no-referrer"
            className="w-7 h-7 object-contain shrink-0"
          />
          <span className="font-extrabold text-xs uppercase tracking-tight">Koperasi GMP</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Notification bell */}
          <button 
            onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
            className="relative p-1 px-1.5 hover:bg-slate-800 rounded-md text-slate-300 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 px-1.5 hover:bg-slate-800 rounded-md text-slate-300 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER DRAWER NAVIGATION */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-950 text-slate-100 flex flex-col p-4 space-y-4 select-none print:hidden z-40 animate-fade-in">
          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold ${
                    isActive 
                      ? 'bg-indigo-600 text-black font-bold' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Hi, {currentUser.name} ({currentUser.role})</span>
            <button
              onClick={handleLogout}
              className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTAINER WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* UPPER TOP-BAR GLOBAL HEADER (Desktop only) */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-gray-100 px-8 py-4 shrink-0 print:hidden select-none">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-sans">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Mekanisme Kreditor Otomasi &mdash; Panel Berdasarkan Peran: <strong>{currentUser.role}</strong></span>
          </div>

          <div className="flex items-center gap-5">
            {/* Real-time drop alerts dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all border border-gray-100 cursor-pointer"
                title="Pemberitahuan Tempo"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-white">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Dynamic drops menu notifications */}
              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-gray-100 bg-white rounded-2xl shadow-xl overflow-hidden py-2 z-50 text-xs text-gray-700 animate-fade-in border border-gray-150">
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50 text-gray-900 font-semibold font-sans">
                    <span>Notifikasi Jatuh Tempo ({unreadNotifs.length})</span>
                    {unreadNotifs.length > 0 && (
                      <button 
                        onClick={handleMarkNotifsRead}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                      >
                        Tandai Dibaca
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 italic">
                        Tidak ada jatuh tempo tagihan beredar saat ini. Semuanya aman!
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3 space-y-1 transition-colors ${
                            n.type === 'overdue' ? 'bg-rose-50/20' : 'bg-amber-50/10'
                          }`}
                        >
                          <div className="flex items-center gap-1 font-bold text-gray-950">
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${n.type === 'overdue' ? 'bg-rose-600' : 'bg-amber-500'}`}></span>
                            <span>{n.title}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-normal">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Division Line */}
            <div className="w-[1px] h-5 bg-gray-200"></div>

            {/* Profile Avatar detail */}
            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <p className="font-bold text-gray-900 leading-tight">{currentUser.name}</p>
                <span className="text-[10px] text-gray-400 font-mono font-medium block mt-0.5 uppercase tracking-wide">
                  Privpriv: {currentUser.role}
                </span>
              </div>
              <div className="w-8.5 h-8.5 rounded-full bg-slate-900 border border-slate-950 flex items-center justify-center font-bold text-white text-xs">
                {currentUser.name.charAt(0)}
              </div>
            </div>

          </div>
        </header>

        {/* Firebase Connection / Authentication Fallback Banner */}
        {isOfflineFallback && (
          (() => {
            const isFirestoreErr = authError?.startsWith('firestore-error:');
            const cleanErr = authError ? authError.replace(/^(firestore-error:|auth-error:)\s*/, '') : '';
            const consoleUrl = isFirestoreErr 
              ? 'https://console.firebase.google.com/project/supplierkoperasi/firestore/databases/ai-studio-dcd95500-880b-4b6b-abb9-c86cffd7fa56/data'
              : 'https://console.firebase.google.com/project/supplierkoperasi/authentication/providers';
            
            return (
              <div className="bg-amber-50 border-b border-amber-200 px-8 py-3.5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 animate-fade-in text-xs text-amber-900 select-none shrink-0 border-l-4 border-l-amber-500">
                <div className="flex gap-3 items-start">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-bold text-amber-950 font-sans">
                      {isFirestoreErr 
                        ? 'Cloud Firestore Belum Dibuat atau Diaktifkan' 
                        : 'Mode Simpan Lokal Aktif (Firebase Auth Belum Dikonfigurasi)'}
                    </p>
                    <p className="text-amber-700 leading-normal mt-0.5">
                      {isFirestoreErr 
                        ? 'Database Cloud Firestore Anda tidak merespon atau belum dibuat di dalam Konsol Firebase Anda. Aplikasi beralih ke penyimpanan lokal (Local Storage) untuk menjaga agar data mutasi, user, dan supplier tetap bisa diisi dengan aman.' 
                        : 'Penyedia otentikasi Anonymous (Anonim) belum diaktifkan di konsol Firebase Anda. Aplikasi beralih sementara ke penyimpanan lokal (Local Storage) agar Anda tetap dapat melakukan demo dengan lancar.'}
                    </p>
                    {cleanErr && (
                      <p className="text-[10px] bg-amber-100/50 text-amber-950 px-2 py-1 rounded-sm font-mono mt-1 w-fit max-w-full truncate">
                        Log Error: {cleanErr}
                      </p>
                    )}
                    <div className="mt-2 flex flex-col gap-1.5 list-decimal pl-4 font-mono text-[10px] text-amber-800">
                      {isFirestoreErr ? (
                        <>
                          <div>1. Klik tombol <strong className="font-sans text-amber-950">"Buka Konsol Firestore"</strong> di sebelah kanan.</div>
                          <div>2. Klik tombol <strong className="font-sans text-amber-950">"Create database"</strong> (Buat database).</div>
                          <div>3. Setel nama/ID Database ke: <strong className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-150 rounded px-1 text-[9px]">ai-studio-dcd95500-880b-4b6b-abb9-c86cffd7fa56</strong>.</div>
                          <div>4. Pilih lokasi terdekat (misal <em className="italic">asia-southeast1</em>) & setel dalam Test Mode atau rules default, kemudian <strong className="font-sans text-amber-950">Muat Ulang Halaman ini</strong>.</div>
                        </>
                      ) : (
                        <>
                          <div>1. Klik tombol <strong className="font-sans text-amber-950">"Buka Konsol Firebase Auth"</strong> di sebelah kanan.</div>
                          <div>2. Pilih tab <strong className="font-sans text-amber-950">"Sign-in method"</strong> &gt; Klik <strong className="font-sans text-amber-950">"Add new provider"</strong>.</div>
                          <div>3. Cari <strong className="font-bold font-sans text-indigo-700">Anonymous</strong> (Anonim) dan klik <strong className="font-sans text-amber-950">Enable</strong> (Aktifkan).</div>
                          <div>4. <strong className="font-sans text-amber-950">Muat Ulang Halaman ini</strong> untuk mulai melakukan sinkronisasi cloud real-time.</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-750 text-white font-semibold rounded-xl text-[11px] shrink-0 transition-all shadow-sm cursor-pointer whitespace-nowrap hover:shadow-md self-end xl:self-auto"
                >
                  {isFirestoreErr ? "Buka Konsol Firestore \u2192" : "Buka Konsol Firebase Auth \u2192"}
                </a>
              </div>
            );
          })()
        )}

        {/* 4. WORK VIEW TARGET RENDER */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50">
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'supplier' && <Suppliers />}
          {activeTab === 'pembelian' && <Purchases />}
          {activeTab === 'pembayaran' && <Payments />}
          {activeTab === 'laporan-hutang' && <HutangLaporan />}
          {activeTab === 'pengguna' && <UserManagement />}
          {activeTab === 'log-audit' && <Logs />}
        </div>

      </main>

      {/* Floating Syncing Indicator */}
      {isSyncing && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-slate-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 select-none animate-bounce">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
          <span className="text-xs font-semibold tracking-wide">Sinkronisasi Data Offline...</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StateProvider>
      <AppContent />
    </StateProvider>
  );
}

