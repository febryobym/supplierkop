/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { Supplier } from '../types';
import { exportToCSV } from '../data';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, Building, CreditCard, User, Landmark, X, FileSpreadsheet } from 'lucide-react';

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, currentUser } = useAppState();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // New Supplier Data State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    bankName: '',
    bankAccount: '',
    bankAccountHolder: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Access check
  const isReadOnly = false; // Staff now has full edit and delete access to suppliers
  const canAddSupplier = true; // Staff is allowed to add supplier

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      code: `SUP-00${suppliers.length + 1}`,
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      bankName: 'Bank Mandiri',
      bankAccount: '',
      bankAccountHolder: ''
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    if (isReadOnly) return;
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      code: s.code,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      address: s.address,
      bankName: s.bankName,
      bankAccount: s.bankAccount,
      bankAccountHolder: s.bankAccountHolder
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier && isReadOnly) {
      setErrorMessage('Akses Ditolak: Peran Staff tidak diijinkan menyunting detail supplier.');
      return;
    }

    if (!formData.name || !formData.code || !formData.contactPerson || !formData.phone) {
      setErrorMessage('Harap isi semua kolom wajib (Nama, Kode, CP, dan Telepon)');
      return;
    }

    if (editingSupplier) {
      updateSupplier({
        ...formData,
        id: editingSupplier.id
      });
      setSuccessMessage('Sukses memperbarui informasi supplier!');
    } else {
      // Check duplicate code
      const codeExists = suppliers.some(s => s.code.toLowerCase() === formData.code.toLowerCase());
      if (codeExists) {
        setErrorMessage('Kode Supplier sudah digunakan!');
        return;
      }
      addSupplier(formData);
      setSuccessMessage('Sukses menambahkan supplier baru!');
    }

    setIsFormOpen(false);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (isReadOnly) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus supplier ini? Tindakan ini tidak dapat dibatalkan.')) {
      const success = deleteSupplier(id);
      if (success) {
        setSuccessMessage('Supplier berhasil dihapus!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Gagal menghapus! Supplier ini memiliki riwayat transaksi pembelian (faktur aktif) yang belum diselesaikan.');
      }
    }
  };

  const handleExportExcel = () => {
    const headers = ['Kode Supplier', 'Nama Supplier', 'Contact Person', 'No Telepon', 'Email', 'Alamat', 'Nomor Rekening', 'Nama Bank', 'Atas Nama Rekening'];
    const data = filteredSuppliers.map(s => [
      s.code,
      s.name,
      s.contactPerson,
      s.phone,
      s.email || '-',
      s.address || '-',
      s.bankAccount || '-',
      s.bankName || '-',
      s.bankAccountHolder || '-'
    ]);
    exportToCSV('Daftar_Supplier_Vendor', headers, data);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans">Database Supplier</h1>
          <p className="text-xs text-gray-500">Daftar mitra bisnis, kreditor, dan rincian bank pencairan.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.CSV)</span>
          </button>
          {canAddSupplier && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs hover:shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Supplier</span>
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl">
          {successMessage}
        </div>
      )}

      {/* Control Search & Count info */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kode, nama, narahubung, atau alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1.5 font-mono">
          <span>Menampilkan</span>
          <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{filteredSuppliers.length}</span>
          <span>dari {suppliers.length} supplier terdaftar</span>
        </div>
      </div>

      {/* Grid of Suppliers Cards - Bento Card Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-1 md:col-span-2 h-64 flex flex-col items-center justify-center border border-dashed border-gray-100 bg-white rounded-2xl p-6 text-center">
            <Landmark className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">Hasil tidak ditemukan</p>
            <p className="text-xs text-gray-500 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
          </div>
        ) : (
          filteredSuppliers.map((s) => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-gray-200/80 transition-all space-y-4">
              
              {/* Card Header & Actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 font-mono text-[10px] font-bold text-indigo-700 tracking-wider">
                    {s.code}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 leading-snug">{s.name}</h3>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Ubah info supplier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Informational specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-y border-gray-100/70 py-4">
                
                {/* Contact detail block */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-gray-400 text-[10px] uppercase tracking-wider block font-sans">Narahubung</span>
                  <div className="space-y-1 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-800">{s.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{s.phone}</span>
                    </div>
                    {s.email && (
                      <div className="flex items-center gap-1.5 truncate max-w-[180px] font-mono">
                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{s.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank / Disbursement block */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-gray-400 text-[10px] uppercase tracking-wider block font-sans">Rekening Bank</span>
                  {s.bankAccount ? (
                    <div className="bg-gray-50/70 border border-gray-100/50 p-2.5 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-800 font-bold">
                        <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{s.bankName}</span>
                      </div>
                      <div className="font-mono text-gray-700 font-semibold tracking-wide text-[11px] select-all">
                        {s.bankAccount}
                      </div>
                      <div className="text-[10px] text-gray-500 italic truncate max-w-[150px]">
                        a.n. {s.bankAccountHolder}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">Data bank tidak diisi</p>
                  )}
                </div>

              </div>

              {/* Address block */}
              <div className="flex items-start gap-1.5 text-xs text-gray-500 bg-gray-50/30 p-2 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed truncate" title={s.address}>{s.address || 'Alamat tidak ditentukan'}</span>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Slide-over / Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  {editingSupplier ? 'Ubah Informasi Supplier' : 'Daftarkan Supplier Baru'}
                </h3>
                <p className="text-xs text-gray-500">Lengkapi data untuk penagihan hutang yang valid.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll-form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3 rounded-xl">
                  {errorMessage}
                </div>
              )}

              {/* Master Code & Name Inline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Kode Supplier*</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="SUP-XXX"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Nama Perusahaan / Supplier*</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Contoh: PT Semen Sentosa Tbk"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-sans font-medium"
                  />
                </div>
              </div>

              {/* Contact Person Details */}
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 space-y-3">
                <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  Narahubung & Kontak Tim
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Nama CP*</label>
                    <input
                      type="text"
                      required
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                      placeholder="Nama sales / PIC"
                      className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                    />
                  </div>
                  <div className="space-y-1.5 block">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">No HP / Telepon*</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="0812xxxxxx"
                      className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
                    />
                  </div>
                  <div className="space-y-1.5 block">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">E-mail</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="sales@vendor.com"
                      className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Transfer Details */}
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 space-y-3">
                <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-emerald-500" />
                  Rincian Akun Bank Pencairan Dana
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Pilih Bank</label>
                    <select
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                    >
                      <option value="Bank Mandiri">Bank Mandiri</option>
                      <option value="BCA">BCA</option>
                      <option value="BNI">BNI</option>
                      <option value="BRI">BRI</option>
                      <option value="BSI">BSI (Syariah)</option>
                      <option value="Bank Danamon">Bank Danamon</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">No Rekening</label>
                    <input
                      type="text"
                      value={formData.bankAccount}
                      onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                      placeholder="No Rekening Pembayaran"
                      className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-mono"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-3">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Atas Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={formData.bankAccountHolder}
                      onChange={(e) => setFormData({...formData, bankAccountHolder: e.target.value})}
                      placeholder="Contoh: PT Semen Sentosa Tbk"
                      className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block font-sans">Alamat Lengkap Perusahaan</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={2}
                  placeholder="Kawasan/Jalan, Nomor Gedung/Ruko, Kota, Provinsi..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden block leading-relaxed"
                ></textarea>
              </div>

              {/* Footer submission CTA */}
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingSupplier ? 'Simpan Perubahan' : 'Daftarkan Supplier'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
