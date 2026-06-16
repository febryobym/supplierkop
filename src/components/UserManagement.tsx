/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { User, UserRole } from '../types';
import { Shield, Plus, ShieldCheck, Trash2, Key, Users, Sparkles, X, Edit } from 'lucide-react';

export default function UserManagement() {
  const { users, addUser, deleteUser, updateUser, currentUser } = useAppState();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Staff');
  const [formPassword, setFormPassword] = useState('');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Staff');
  const [editPassword, setEditPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Check strict security permission
  const isLocked = currentUser?.role === 'Staff';
  const isAdmin = currentUser?.role === 'Admin';

  if (isLocked) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-4 animate-bounce">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-gray-900">Akses Ditolak! Security Lockout</h2>
        <p className="text-xs text-gray-500 leading-relaxed mt-2">
          Peran akun Anda (<span className="font-semibold text-rose-600 font-mono">STAFF</span>) tidak memiliki hak akses untuk menginspeksi atau mengonfigurasi struktur manajemen kredensial administrator.
        </p>
        <p className="text-[11px] text-gray-400 mt-1">Hubungi staff Admin Anda untuk peningkatan privilege.</p>
      </div>
    );
  }

  const handleOpenCreateForm = () => {
    if (!isAdmin) {
      alert('Hanya Administrator Utama yang diijinkan meremot akun ke dalam database pusat.');
      return;
    }
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormRole('Staff');
    setFormPassword('');
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!formName || !formUsername || !formEmail) {
      setErrorMessage('Harap isi semua kolom!');
      return;
    }

    const compiledUser = {
      username: formUsername.trim().toLowerCase(),
      name: formName.trim(),
      role: formRole,
      email: formEmail.trim().toLowerCase(),
      password: formPassword.trim() || 'password'
    };

    const success = addUser(compiledUser);
    if (!success) {
      setErrorMessage(`Username "${formUsername}" sudah digunakan oleh personil lain!`);
      return;
    }

    setSuccessMessage(`User "${formName}" berhasil diprovisikan dengan peran ${formRole}.`);
    setIsFormOpen(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      alert('Akses Admin dibutuhkan untuk mengeliminasi kredensial personil.');
      return;
    }
    if (id === currentUser?.id) {
      alert('Kesalahan Keamanan: Anda tidak diperbolehkan menghapus akun aktif Anda sendiri.');
      return;
    }

    if (window.confirm('Apakah Anda yakin ingin mencabut seluruh hak akses log dari personil ini?')) {
      const ok = deleteUser(id);
      if (ok) {
        setSuccessMessage('Kredensial log dicabut sukses.');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };

  const handleOpenEdit = (user: User) => {
    if (!isAdmin) {
      alert('Hanya akun Admin yang diijinkan mengubah hak akses atau profil personil.');
      return;
    }
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword(user.password || '');
    setErrorMessage('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingUser) return;

    if (!editName || !editEmail) {
      setErrorMessage('Harap isi semua kolom!');
      return;
    }

    const updatedUser: User = {
      ...editingUser,
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      password: editPassword.trim() || editingUser.password || 'password'
    };

    updateUser(updatedUser);
    setSuccessMessage(`Hak akses/profil untuk "${editName}" berhasil diperbarui.`);
    setEditingUser(null);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans">Manajemen Personil & Hak Akses</h1>
          <p className="text-xs text-gray-500">Konfigurasi token login dan pembagian batasan peran (Admin, Manager, Staff).</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreateForm}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Provisikan User Baru</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl">
          {successMessage}
        </div>
      )}

      {/* Info warning */}
      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-2.5 text-xs">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-amber-900">Peraturan Hak Akses (Role-Based Access Matrix):</h4>
          <ul className="list-disc pl-4 space-y-1 text-amber-700 text-[10px] leading-relaxed">
            <li><strong>Admin</strong>: Kontrol mutak (CRUD Suppliers, Purchases, Payments, Kredensial, Reset Sistem).</li>
            <li><strong>Manager</strong>: Menyunting & menyetujui transaksi (Ubah Supplier, Tambah Pembelian/Bayar, Lihat Log Audit). Tidak bisa hapus user.</li>
            <li><strong>Staff</strong>: Hanya input pembelian (Nota) dan tidak bisa melakukan pelunasan bayar tunai dasar. Dilarang mendelete dan dilarang menginspeksi Manajemen User.</li>
          </ul>
        </div>
      </div>

      {/* Users listing grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map((u) => {
          const isSelf = u.id === currentUser?.id;
          return (
            <div 
              key={u.id} 
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all space-y-4 ${
                isSelf ? 'border-indigo-200 ring-2 ring-indigo-500/5' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="space-y-1.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase ${
                    u.role === 'Admin' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                      : u.role === 'Manager' 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                      : 'bg-gray-50 text-gray-700 border border-gray-100'
                  }`}>
                    {u.role}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900">{u.name}</h3>
                </div>

                <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                  <Key className="w-4 h-4" />
                </div>
              </div>

              {/* Specs detailed block */}
              <div className="space-y-2 text-xs border-y border-gray-50 py-3 font-mono">
                <div className="flex justify-between truncate max-w-full">
                  <span className="text-gray-400 font-sans">E-mail:</span>
                  <span className="text-gray-700 font-semibold truncate max-w-[160px]" title={u.email}>{u.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-sans">Kata Sandi:</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded-md text-[10px]">{u.password || 'password'}</span>
                </div>
              </div>

              {/* Bottom footer elements */}
              <div className="flex items-center justify-between text-xs pt-1">
                {isSelf ? (
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                    Sesi Anda Aktif
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400">Terdaftar</span>
                )}

                {isAdmin && (
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-semibold bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200/50 px-2 py-1 rounded-lg"
                      title="Ubah Hak Akses / Profil"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Ubah Akses</span>
                    </button>

                    {!isSelf && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-[10px] text-gray-450 hover:text-rose-600 flex items-center gap-1 cursor-pointer border border-transparent hover:border-rose-100 hover:bg-rose-50/50 px-2 py-1 rounded-lg transition-all"
                        title="Cabut Akses Log"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* FORM: Create User Slide-over overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Penerbitan Kredensial Personil</h3>
                <p className="text-xs text-gray-500">Buat personil baru ke dalam server.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="p-1.5 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl">
                  {errorMessage}
                </div>
              )}

              {/* Nama Personil */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Nama Lengkap*</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Andi Saputra"
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                />
              </div>

              {/* Username login */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Username untuk Login*</label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Hanya huruf kecil tanpa spasi, contoh: andisaputra"
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden font-mono"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Alamat E-mail*</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contoh@bumn.com"
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden font-mono"
                />
              </div>

              {/* Role Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Tentukan Peran / Jabatan*</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs outline-hidden font-medium"
                >
                  <option value="Staff">Staff (Input sahaja, No deletions)</option>
                  <option value="Manager">Manager (Persetujuan & Laporan Audit)</option>
                  <option value="Admin">Admin (Kontrol Penuh Server)</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block block-sans">Kata Sandi (Password)*</label>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru (misal: staff123)"
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                />
              </div>

              {/* Provisian info warning */}
              <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-150 flex items-start gap-1.5 text-[10px] text-gray-500 leading-relaxed">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                <span>
                  Personil yang diterbitkan akan langsung bisa login menggunakan Alamat E-mail dan Kata Sandi yang baru Anda rancang.
                </span>
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
                  Terbitkan Akun
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* FORM: Edit User Slide-over overlay */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Ubah Hak Akses & Profil Personil</h3>
                <p className="text-xs text-gray-500">Edit perincian akun dan tingkatan peran.</p>
              </div>
              <button 
                onClick={() => setEditingUser(null)} 
                className="p-1.5 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl">
                  {errorMessage}
                </div>
              )}

              {/* Username (Read only Info) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Username Login (Tidak bisa diubah)</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.username}
                  className="w-full border border-gray-200 bg-gray-100 text-gray-550 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                />
              </div>

              {/* Nama Personil */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Nama Lengkap*</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Andi Saputra"
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Alamat E-mail*</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="contoh@bumn.com"
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden font-mono"
                />
              </div>

              {/* Role Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Tentukan Peran / Jabatan*</label>
                {editingUser.id === currentUser?.id ? (
                  <div>
                    <input
                      type="text"
                      disabled
                      value={editRole}
                      className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                    <p className="text-[10px] text-amber-600 mt-1">
                      Anda tidak diperkenankan menurunkan atau mengubah jabatan aktif Anda sendiri untuk mencegah lockout.
                    </p>
                  </div>
                ) : (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs outline-hidden font-medium"
                  >
                    <option value="Staff">Staff (Input sahaja, No deletions)</option>
                    <option value="Manager">Manager (Persetujuan & Laporan Audit)</option>
                    <option value="Admin">Admin (Kontrol Penuh Server)</option>
                  </select>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block block-sans">Kata Sandi (Password)*</label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Contoh: passwordrahasia"
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                />
              </div>

              {/* Form submit/abort buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
