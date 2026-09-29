/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useAppState } from '../context/StateContext';
import { Supplier } from '../types';
import { exportToCSV } from '../data';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  CreditCard, 
  User, 
  Landmark, 
  X, 
  FileSpreadsheet, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Download, 
  Printer, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Copy, 
  Check, 
  FileCheck,
  RefreshCw,
  FileBadge
} from 'lucide-react';

interface PreviewDocState {
  title: string;
  supplierName: string;
  supplierCode: string;
  docType: 'KTP' | 'NPWP';
  docNumber?: string;
  fileUrl: string;
  fileName?: string;
}

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, currentUser } = useAppState();
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [docFilter, setDocFilter] = useState<'all' | 'ktp' | 'npwp' | 'complete' | 'incomplete'>('all');
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  // Form Data State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    bankName: '',
    bankAccount: '',
    bankAccountHolder: '',
    ktpNumber: '',
    ktpFile: '',
    ktpFileName: '',
    npwpNumber: '',
    npwpFile: '',
    npwpFileName: ''
  });

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Document Lightbox Preview State
  const [previewDoc, setPreviewDoc] = useState<PreviewDocState | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Hidden file input refs
  const ktpInputRef = useRef<HTMLInputElement>(null);
  const npwpInputRef = useRef<HTMLInputElement>(null);

  // Access check
  const isReadOnly = false;
  const canAddSupplier = true;

  // Process uploaded files with automatic image compression to keep Firestore documents lightweight (<150KB)
  const processUploadedFile = (file: File): Promise<{ dataUrl: string; fileName: string }> => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
              resolve({ dataUrl: compressedDataUrl, fileName: file.name });
            } else {
              resolve({ dataUrl: e.target?.result as string, fileName: file.name });
            }
          };
          img.onerror = () => reject(new Error('Gagal memproses file gambar.'));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        if (file.size > 850 * 1024) {
          reject(new Error('Ukuran file PDF maksimal 850 KB agar dapat disimpan secara optimal di sistem.'));
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({ dataUrl: e.target?.result as string, fileName: file.name });
        };
        reader.onerror = () => reject(new Error('Gagal membaca file PDF.'));
        reader.readAsDataURL(file);
      } else {
        reject(new Error('Format file tidak didukung. Harap pilih gambar (JPG, PNG, WebP) atau PDF.'));
      }
    });
  };

  const handleFileChange = async (type: 'ktp' | 'npwp', file: File | null) => {
    if (!file) return;
    setIsProcessingFile(true);
    setErrorMessage('');
    try {
      const result = await processUploadedFile(file);
      if (type === 'ktp') {
        setFormData(prev => ({
          ...prev,
          ktpFile: result.dataUrl,
          ktpFileName: result.fileName
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          npwpFile: result.dataUrl,
          npwpFileName: result.fileName
        }));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses dokumen.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleRemoveFile = (type: 'ktp' | 'npwp') => {
    if (type === 'ktp') {
      setFormData(prev => ({ ...prev, ktpFile: '', ktpFileName: '' }));
      if (ktpInputRef.current) ktpInputRef.current.value = '';
    } else {
      setFormData(prev => ({ ...prev, npwpFile: '', npwpFileName: '' }));
      if (npwpInputRef.current) npwpInputRef.current.value = '';
    }
  };

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
      bankAccountHolder: '',
      ktpNumber: '',
      ktpFile: '',
      ktpFileName: '',
      npwpNumber: '',
      npwpFile: '',
      npwpFileName: ''
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
      bankAccountHolder: s.bankAccountHolder,
      ktpNumber: s.ktpNumber || '',
      ktpFile: s.ktpFile || '',
      ktpFileName: s.ktpFileName || '',
      npwpNumber: s.npwpNumber || '',
      npwpFile: s.npwpFile || '',
      npwpFileName: s.npwpFileName || ''
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier && isReadOnly) {
      setErrorMessage('Akses Ditolak: Peran Staff tidak diijinkan menyunting detail supplier.');
      return;
    }

    if (!formData.name || !formData.code || !formData.contactPerson || !formData.phone) {
      setErrorMessage('Harap isi semua kolom wajib (Nama, Kode, CP, dan Telepon)');
      return;
    }

    try {
      if (editingSupplier) {
        await updateSupplier({
          ...formData,
          id: editingSupplier.id
        });
        setSuccessMessage('Sukses memperbarui informasi supplier beserta dokumen KTP & NPWP!');
      } else {
        // Check duplicate code
        const codeExists = suppliers.some(s => s.code.toLowerCase() === formData.code.toLowerCase());
        if (codeExists) {
          setErrorMessage('Kode Supplier sudah digunakan!');
          return;
        }
        await addSupplier(formData);
        setSuccessMessage('Sukses menambahkan supplier baru beserta dokumen KTP & NPWP!');
      }

      setIsFormOpen(false);
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err: any) {
      console.error('Gagal menyimpan supplier:', err);
      setErrorMessage(`Gagal menyimpan data supplier: ${err?.message || 'Sistem mengalami kendala.'}`);
    }
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

  const handleCopy = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleOpenDocPreview = (
    s: Supplier, 
    docType: 'KTP' | 'NPWP', 
    fileUrl: string, 
    fileName?: string,
    docNumber?: string
  ) => {
    setPreviewDoc({
      title: docType === 'KTP' ? `Dokumen KTP - ${s.name}` : `Dokumen NPWP - ${s.name}`,
      supplierName: s.name,
      supplierCode: s.code,
      docType,
      docNumber,
      fileUrl,
      fileName: fileName || `${docType}_${s.code}.jpg`
    });
    setZoomLevel(1);
    setRotation(0);
  };

  const handleDownloadDocument = (fileUrl: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintDocument = (fileUrl: string, title: string, docNumber?: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; color: #1e293b; background: #fff; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 20px; font-weight: bold; margin: 0; }
            .sub { font-size: 13px; color: #64748b; margin-top: 5px; }
            .doc-info { font-family: monospace; font-size: 14px; font-weight: bold; background: #f1f5f9; padding: 6px 12px; border-radius: 6px; }
            .img-wrapper { display: flex; justify-content: center; align-items: center; margin-top: 20px; }
            img { max-width: 100%; max-height: 75vh; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 8px; }
            .footer { margin-top: 30px; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">${title}</h1>
              <div class="sub">Arsip Dokumen Legalitas Mitra Usaha & Supplier</div>
            </div>
            ${docNumber ? `<div class="doc-info">Nomor: ${docNumber}</div>` : ''}
          </div>
          <div class="img-wrapper">
            <img src="${fileUrl}" onload="window.print();" />
          </div>
          <div class="footer">
            Dicetak otomatis dari Sistem Database Supplier • Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    const headers = [
      'Kode Supplier', 
      'Nama Supplier', 
      'Contact Person', 
      'No Telepon', 
      'Email', 
      'Alamat', 
      'Nomor Rekening', 
      'Nama Bank', 
      'Atas Nama Rekening',
      'Nomor KTP/NIK',
      'Status Berkas KTP',
      'Nomor NPWP',
      'Status Berkas NPWP'
    ];
    const data = filteredSuppliers.map(s => [
      s.code,
      s.name,
      s.contactPerson,
      s.phone,
      s.email || '-',
      s.address || '-',
      s.bankAccount || '-',
      s.bankName || '-',
      s.bankAccountHolder || '-',
      s.ktpNumber || '-',
      s.ktpFile ? 'Terlampir' : 'Tidak Ada',
      s.npwpNumber || '-',
      s.npwpFile ? 'Terlampir' : 'Tidak Ada'
    ]);
    exportToCSV('Daftar_Supplier_Lengkap_KTP_NPWP', headers, data);
  };

  const filteredSuppliers = suppliers.filter(s => {
    // Text search matching
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      (s.ktpNumber && s.ktpNumber.toLowerCase().includes(q)) ||
      (s.npwpNumber && s.npwpNumber.toLowerCase().includes(q)) ||
      s.phone.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Document completeness filter
    if (docFilter === 'ktp') {
      return Boolean(s.ktpFile || s.ktpNumber);
    }
    if (docFilter === 'npwp') {
      return Boolean(s.npwpFile || s.npwpNumber);
    }
    if (docFilter === 'complete') {
      return Boolean((s.ktpFile || s.ktpNumber) && (s.npwpFile || s.npwpNumber));
    }
    if (docFilter === 'incomplete') {
      return !Boolean((s.ktpFile || s.ktpNumber) && (s.npwpFile || s.npwpNumber));
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2">
            <span>Database Supplier</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Legalitas KTP & NPWP
            </span>
          </h1>
          <p className="text-xs text-gray-500">Daftar mitra bisnis, verifikasi identitas (KTP), perpajakan (NPWP), dan rincian rekening pencairan.</p>
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
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Control Search & Document Filter */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, kode, NIK KTP, NPWP, narahubung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills for Document Status */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <span className="text-[11px] text-gray-400 font-semibold mr-1">Filter Berkas:</span>
          <button
            onClick={() => setDocFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors cursor-pointer ${
              docFilter === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua ({suppliers.length})
          </button>
          <button
            onClick={() => setDocFilter('complete')}
            className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors cursor-pointer ${
              docFilter === 'complete' 
                ? 'bg-emerald-700 text-white' 
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50'
            }`}
          >
            Lengkap KTP & NPWP
          </button>
          <button
            onClick={() => setDocFilter('ktp')}
            className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors cursor-pointer ${
              docFilter === 'ktp' 
                ? 'bg-blue-700 text-white' 
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50'
            }`}
          >
            Ada KTP
          </button>
          <button
            onClick={() => setDocFilter('npwp')}
            className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors cursor-pointer ${
              docFilter === 'npwp' 
                ? 'bg-purple-700 text-white' 
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/50'
            }`}
          >
            Ada NPWP
          </button>
          <button
            onClick={() => setDocFilter('incomplete')}
            className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors cursor-pointer ${
              docFilter === 'incomplete' 
                ? 'bg-amber-600 text-white' 
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50'
            }`}
          >
            Belum Lengkap
          </button>
        </div>
      </div>

      {/* Grid of Suppliers Cards - Bento Card Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-1 md:col-span-2 h-64 flex flex-col items-center justify-center border border-dashed border-gray-100 bg-white rounded-2xl p-6 text-center">
            <Landmark className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">Hasil tidak ditemukan</p>
            <p className="text-xs text-gray-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter dokumen Anda.</p>
          </div>
        ) : (
          filteredSuppliers.map((s) => {
            const hasKtp = Boolean(s.ktpFile || s.ktpNumber);
            const hasNpwp = Boolean(s.npwpFile || s.npwpNumber);

            return (
              <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-gray-200 hover:shadow-sm transition-all space-y-4">
                
                {/* Card Header & Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 font-mono text-[10px] font-bold text-indigo-700 tracking-wider">
                        {s.code}
                      </span>
                      {hasKtp && hasNpwp ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Berkas Lengkap
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          {!hasKtp && !hasNpwp ? 'KTP & NPWP Kosong' : !hasKtp ? 'KTP Belum Lengkap' : 'NPWP Belum Lengkap'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 leading-snug">{s.name}</h3>
                  </div>

                  {!isReadOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Ubah info supplier & dokumen"
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

                {/* Informational specs: Narahubung & Bank Account */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-gray-100/70 pt-3">
                  
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
                      <div className="bg-gray-50/70 border border-gray-100/50 p-2 rounded-xl space-y-0.5">
                        <div className="flex items-center gap-1.5 text-gray-800 font-bold text-xs">
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

                {/* Dedicated Legal Documents Section: KTP & NPWP */}
                <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <FileBadge className="w-3.5 h-3.5 text-indigo-600" />
                      Dokumen Legalitas & Pajak
                    </span>
                    <span className="text-[10px] font-normal text-slate-400 lowercase font-mono">
                      {s.ktpFile && s.npwpFile ? '2/2 berkas terunggah' : s.ktpFile || s.npwpFile ? '1/2 berkas terunggah' : '0/2 berkas terunggah'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    
                    {/* KTP Box */}
                    <div className="bg-white border border-slate-200/80 rounded-lg p-2.5 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          <CreditCard className="w-3 h-3 text-blue-600" />
                          KTP / NIK
                        </span>
                        {s.ktpFile ? (
                          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Terlampir
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-slate-400 italic">Belum Ada File</span>
                        )}
                      </div>

                      {s.ktpNumber ? (
                        <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                            {s.ktpNumber}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(s.ktpNumber!, e)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Salin Nomor NIK"
                          >
                            {copiedText === s.ktpNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Nomor NIK tidak diisi</p>
                      )}

                      {s.ktpFile && (
                        <div className="flex items-center gap-2 pt-1">
                          {s.ktpFile.startsWith('data:image/') ? (
                            <button
                              type="button"
                              onClick={() => handleOpenDocPreview(s, 'KTP', s.ktpFile!, s.ktpFileName, s.ktpNumber)}
                              className="relative group w-12 h-8 rounded border border-slate-200 overflow-hidden shrink-0 cursor-pointer"
                              title="Klik untuk memperbesar KTP"
                            >
                              <img src={s.ktpFile} alt="KTP Thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-12 h-8 bg-red-50 border border-red-200 rounded flex items-center justify-center text-red-600 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-600 truncate font-mono">{s.ktpFileName || 'Dokumen_KTP'}</p>
                            <button
                              type="button"
                              onClick={() => handleOpenDocPreview(s, 'KTP', s.ktpFile!, s.ktpFileName, s.ktpNumber)}
                              className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              Lihat Dokumen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* NPWP Box */}
                    <div className="bg-white border border-slate-200/80 rounded-lg p-2.5 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                          <FileCheck className="w-3 h-3 text-purple-600" />
                          NPWP
                        </span>
                        {s.npwpFile ? (
                          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Terlampir
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-slate-400 italic">Belum Ada File</span>
                        )}
                      </div>

                      {s.npwpNumber ? (
                        <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                            {s.npwpNumber}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(s.npwpNumber!, e)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Salin Nomor NPWP"
                          >
                            {copiedText === s.npwpNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Nomor NPWP tidak diisi</p>
                      )}

                      {s.npwpFile && (
                        <div className="flex items-center gap-2 pt-1">
                          {s.npwpFile.startsWith('data:image/') ? (
                            <button
                              type="button"
                              onClick={() => handleOpenDocPreview(s, 'NPWP', s.npwpFile!, s.npwpFileName, s.npwpNumber)}
                              className="relative group w-12 h-8 rounded border border-slate-200 overflow-hidden shrink-0 cursor-pointer"
                              title="Klik untuk memperbesar NPWP"
                            >
                              <img src={s.npwpFile} alt="NPWP Thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-12 h-8 bg-red-50 border border-red-200 rounded flex items-center justify-center text-red-600 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-600 truncate font-mono">{s.npwpFileName || 'Dokumen_NPWP'}</p>
                            <button
                              type="button"
                              onClick={() => handleOpenDocPreview(s, 'NPWP', s.npwpFile!, s.npwpFileName, s.npwpNumber)}
                              className="text-[10px] font-semibold text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              Lihat Dokumen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Address block */}
                <div className="flex items-start gap-1.5 text-xs text-gray-500 bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed truncate" title={s.address}>{s.address || 'Alamat tidak ditentukan'}</span>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Slide-over / Modal Form for Adding & Editing Supplier */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-100 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  {editingSupplier ? 'Ubah Informasi Supplier & Dokumen' : 'Daftarkan Supplier Baru'}
                </h3>
                <p className="text-xs text-gray-500">Lengkapi data mitra, rekening bank pencairan, serta lampiran KTP dan NPWP.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll-form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
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

              {/* DOKUMEN IDENTITAS & PERPAJAKAN (KTP & NPWP) */}
              <div className="bg-gradient-to-br from-indigo-50/40 via-purple-50/20 to-slate-50/60 p-4 rounded-2xl border border-indigo-100 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <FileBadge className="w-4 h-4 text-indigo-600" />
                    Dokumen Legalitas & Perpajakan (KTP & NPWP)
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Unggah berkas KTP (Kartu Tanda Penduduk) dan NPWP untuk arsip verifikasi faktur & bukti transaksi. Format yang didukung: JPG, PNG, WebP, atau PDF.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* --- KTP Upload & Nomor NIK --- */}
                  <div className="bg-white border border-indigo-100 rounded-xl p-3.5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        Identitas KTP (NIK)
                      </span>
                      {formData.ktpFile && (
                        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          File Siap Disimpan
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block">
                        Nomor KTP / NIK (16 Digit)
                      </label>
                      <input
                        type="text"
                        value={formData.ktpNumber}
                        onChange={(e) => setFormData({...formData, ktpNumber: e.target.value})}
                        placeholder="Contoh: 350612xxxxxxxxxx"
                        className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
                      />
                    </div>

                    {/* Hidden input */}
                    <input
                      type="file"
                      ref={ktpInputRef}
                      onChange={(e) => handleFileChange('ktp', e.target.files?.[0] || null)}
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                    />

                    {/* Dropzone / Upload area */}
                    {!formData.ktpFile ? (
                      <div
                        onClick={() => ktpInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleFileChange('ktp', e.dataTransfer.files?.[0] || null);
                        }}
                        className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/60 rounded-xl p-4 text-center cursor-pointer transition-colors"
                      >
                        <UploadCloud className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs font-semibold text-blue-900">Pilih / Seret Foto KTP</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WebP atau PDF (Maks. 850 KB)</p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
                        <div className="flex items-center gap-2.5">
                          {formData.ktpFile.startsWith('data:image/') ? (
                            <img 
                              src={formData.ktpFile} 
                              alt="Preview KTP" 
                              className="w-14 h-10 object-cover rounded-lg border border-slate-300 shrink-0" 
                            />
                          ) : (
                            <div className="w-14 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                              PDF
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate font-mono">
                              {formData.ktpFileName || 'Foto_KTP.jpg'}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-medium">Dokumen terlampir</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenDocPreview(
                                { name: formData.name || 'Supplier', code: formData.code || 'SUP' } as Supplier,
                                'KTP',
                                formData.ktpFile,
                                formData.ktpFileName,
                                formData.ktpNumber
                              );
                            }}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            Preview
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => ktpInputRef.current?.click()}
                            className="text-[11px] text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Ganti
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('ktp')}
                            className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            Hapus
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* --- NPWP Upload & Nomor Pajak --- */}
                  <div className="bg-white border border-purple-100 rounded-xl p-3.5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                        Perpajakan (NPWP)
                      </span>
                      {formData.npwpFile && (
                        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          File Siap Disimpan
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider block">
                        Nomor Pokok Wajib Pajak (NPWP)
                      </label>
                      <input
                        type="text"
                        value={formData.npwpNumber}
                        onChange={(e) => setFormData({...formData, npwpNumber: e.target.value})}
                        placeholder="Contoh: 01.234.567.8-901.000"
                        className="w-full border border-gray-200 bg-white rounded-xl px-3 py-1.5 text-xs font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden"
                      />
                    </div>

                    {/* Hidden input */}
                    <input
                      type="file"
                      ref={npwpInputRef}
                      onChange={(e) => handleFileChange('npwp', e.target.files?.[0] || null)}
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                    />

                    {/* Dropzone / Upload area */}
                    {!formData.npwpFile ? (
                      <div
                        onClick={() => npwpInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleFileChange('npwp', e.dataTransfer.files?.[0] || null);
                        }}
                        className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/30 hover:bg-purple-50/60 rounded-xl p-4 text-center cursor-pointer transition-colors"
                      >
                        <UploadCloud className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                        <p className="text-xs font-semibold text-purple-900">Pilih / Seret File NPWP</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WebP atau PDF (Maks. 850 KB)</p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
                        <div className="flex items-center gap-2.5">
                          {formData.npwpFile.startsWith('data:image/') ? (
                            <img 
                              src={formData.npwpFile} 
                              alt="Preview NPWP" 
                              className="w-14 h-10 object-cover rounded-lg border border-slate-300 shrink-0" 
                            />
                          ) : (
                            <div className="w-14 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                              PDF
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate font-mono">
                              {formData.npwpFileName || 'Dokumen_NPWP.jpg'}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-medium">Dokumen terlampir</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenDocPreview(
                                { name: formData.name || 'Supplier', code: formData.code || 'SUP' } as Supplier,
                                'NPWP',
                                formData.npwpFile,
                                formData.npwpFileName,
                                formData.npwpNumber
                              );
                            }}
                            className="text-[11px] text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            Preview
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => npwpInputRef.current?.click()}
                            className="text-[11px] text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Ganti
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('npwp')}
                            className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            Hapus
                          </button>
                        </div>
                      </div>
                    )}
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
                  disabled={isProcessingFile}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isProcessingFile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses Berkas...</span>
                    </>
                  ) : (
                    <span>{editingSupplier ? 'Simpan Perubahan & Berkas' : 'Daftarkan Supplier'}</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Lightbox / Modal for Document Preview (KTP & NPWP) */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-60 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
            
            {/* Lightbox Topbar */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white bg-slate-950/60">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                  previewDoc.docType === 'KTP' 
                    ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' 
                    : 'bg-purple-600/30 text-purple-400 border border-purple-500/40'
                }`}>
                  {previewDoc.docType}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{previewDoc.supplierName}</span>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {previewDoc.supplierCode}
                    </span>
                  </h3>
                  {previewDoc.docNumber && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-slate-300">
                        No. {previewDoc.docType}: <span className="text-white font-semibold">{previewDoc.docNumber}</span>
                      </span>
                      <button
                        onClick={(e) => handleCopy(previewDoc.docNumber!, e)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-800/80 hover:bg-slate-700 px-1.5 py-0.5 rounded"
                        title="Salin Nomor"
                      >
                        {copiedText === previewDoc.docNumber ? (
                          <span className="text-emerald-400 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Tersalin
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5">
                            <Copy className="w-3 h-3" /> Salin
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Perbesar (Zoom In)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Perkecil (Zoom Out)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setZoomLevel(1); setRotation(0); }}
                  className="px-2 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Putar 90 Derajat"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="h-5 w-px bg-slate-800 mx-1"></div>
                <button
                  onClick={() => handlePrintDocument(previewDoc.fileUrl, previewDoc.title, previewDoc.docNumber)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Cetak Dokumen"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownloadDocument(previewDoc.fileUrl, previewDoc.fileName || `${previewDoc.docType}_${previewDoc.supplierCode}.jpg`)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Unduh Berkas"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Canvas */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950 relative min-h-[350px]">
              {previewDoc.fileUrl.startsWith('data:image/') ? (
                <div 
                  className="transition-transform duration-200 ease-out flex items-center justify-center"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                  }}
                >
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.title}
                    className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
                  />
                </div>
              ) : (
                <div className="w-full h-[65vh] flex flex-col items-center justify-center p-6 text-center">
                  <FileText className="w-16 h-16 text-rose-500 mb-3" />
                  <p className="text-sm font-semibold text-white">Dokumen PDF Terlampir</p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    {previewDoc.fileName || 'Dokumen PDF'}
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => handleDownloadDocument(previewDoc.fileUrl, previewDoc.fileName || 'dokumen.pdf')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh File PDF</span>
                    </button>
                    <a
                      href={previewDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Buka di Tab Baru</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Lightbox Footer */}
            <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/80 flex items-center justify-between">
              <span>Arsip resmi verifikasi data supplier untuk keperluan administrasi dan pencatatan pajak.</span>
              <span className="font-mono text-[10px] text-slate-500">{previewDoc.fileName || 'dokumen'}</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
