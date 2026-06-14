/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useAppState } from '../context/StateContext';
import { ShieldAlert, Sparkles, LogIn, Users, Mail, Lock, Info } from 'lucide-react';

export default function Login() {
  const { login, users } = useAppState();
  const [typedEmail, setTypedEmail] = useState('');
  const [typedPassword, setTypedPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [selectedProfileName, setSelectedProfileName] = useState('');
  const [selectedProfilePass, setSelectedProfilePass] = useState('');

  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedEmail.trim()) {
      setErrorText('Email tidak boleh kosong!');
      return;
    }
    if (!typedPassword) {
      setErrorText('Password tidak boleh kosong!');
      return;
    }
    const works = login(typedEmail.trim().toLowerCase(), typedPassword);
    if (!works) {
      setErrorText('Email atau password tidak cocok! Silakan periksa kembali.');
    } else {
      setErrorText('');
      setSelectedProfileName('');
      setSelectedProfilePass('');
    }
  };

  const handleSelectProfile = (name: string, email: string, passwordText: string) => {
    setTypedEmail(email);
    setTypedPassword(''); // Force manual input for security verification
    setSelectedProfileName(name);
    setSelectedProfilePass(passwordText);
    setErrorText('');
    
    // Focus the password input
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 60);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Visual Launcher Badge */}
      <div className="flex items-center gap-2 mb-6 select-none">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-lg shadow-indigo-500/20 text-sm">
          KG
        </div>
        <div>
          <h2 className="text-sm font-black tracking-tight text-gray-900 uppercase font-sans">Koperasi GMP</h2>
          <p className="text-[10px] text-gray-400 font-mono">Accounts Payable & Supplier Manager</p>
        </div>
      </div>

      {/* Main card box container */}
      <div className="bg-white border border-gray-100 rounded-3xl w-full max-w-md shadow-xl overflow-hidden p-8 space-y-6">
        
        {/* Card Title info */}
        <div className="text-center space-y-1.5 pb-2">
          <h1 className="text-xl font-bold text-gray-900 font-sans tracking-tight">Kredensial Port Kontrol</h1>
          <p className="text-xs text-gray-500">Masuk menggunakan alamat email dan kata sandi Anda.</p>
        </div>

        {errorText && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <p className="leading-snug">{errorText}</p>
          </div>
        )}

        {selectedProfileName && (
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs p-3.5 rounded-2xl flex items-start gap-2.5 animate-fade-in">
            <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-bold font-sans text-indigo-950">Profil Terpilih: {selectedProfileName}</p>
              <p className="text-indigo-700 text-[11px] leading-relaxed">
                Demi keamanan, silakan isi kolom password di bawah menggunakan kata sandi: <span className="font-mono font-black text-indigo-950 bg-indigo-150 px-1.5 py-0.5 rounded-md">{selectedProfilePass}</span> lalu klik <span className="font-bold">Verifikasi Masuk</span>.
              </p>
            </div>
          </div>
        )}

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email field */}
          <div className="space-y-1.5 block">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-sans">Alamat E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={typedEmail}
                onChange={(e) => {
                  setTypedEmail(e.target.value);
                  if (selectedProfileName) {
                    setSelectedProfileName('');
                    setSelectedProfilePass('');
                  }
                }}
                placeholder="contoh: budi.admin@supplierku.com"
                className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono text-gray-800"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5 block">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-sans">Kata Sandi (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={passwordInputRef}
                type="password"
                required
                value={typedPassword}
                onChange={(e) => setTypedPassword(e.target.value)}
                placeholder="Masukkan kata sandi Anda"
                className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden text-gray-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 hover:shadow-lg transition-all cursor-pointer mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Verifikasi Masuk</span>
          </button>
        </form>

        {/* Bypass profiles launcher for fast sandbox demonstration */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-sans">Pilih Profil Penguji Demo</span>
          </div>
          
          <div className="grid grid-cols-1 gap-2 max-h-[170px] overflow-y-auto pr-1">
            {users.map((u) => {
              // Custom text summaries per role
              let roleDesc = 'Akses input nota purchases';
              if (u.role === 'Admin') roleDesc = 'Kontrol mutlak sistem + crud personil';
              if (u.role === 'Manager') roleDesc = 'Sunting & ekspor audit';

              return (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => handleSelectProfile(u.name, u.email, u.password || 'password')}
                  className="w-full text-left p-2.5 border border-gray-100 rounded-2xl hover:border-indigo-500 hover:bg-slate-50/40 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-800 font-sans group-hover:text-indigo-700">{u.name}</p>
                    <p className="text-[9px] text-gray-450 font-mono leading-none mt-0.5">{u.email}</p>
                  </div>
                  
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase shrink-0 font-mono ${
                    u.role === 'Admin' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                      : u.role === 'Manager' 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                      : 'bg-gray-50 text-gray-700 border border-gray-150'
                  }`}>
                    {u.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footnote information */}
        <div className="flex items-center gap-1.5 justify-center text-[10px] text-gray-400 font-sans py-1">
          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
          <span>Sesi multi-user disimpan bersandarkan cookies lokal</span>
        </div>

      </div>
    </div>
  );
}
