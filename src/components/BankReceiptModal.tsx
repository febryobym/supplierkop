/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Payment, Purchase, Supplier } from '../types';
import { formatRupiah, formatDate } from '../data';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Building2, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Landmark,
  PackageCheck
} from 'lucide-react';

interface BankReceiptModalProps {
  payment: Payment;
  purchase?: Purchase;
  supplier?: Supplier;
  onClose: () => void;
}

// Bank Logo Components
export function BankLogo({ bankName, className = "h-9 w-auto" }: { bankName?: string; className?: string }) {
  const norm = (bankName || '').toLowerCase().trim();

  if (norm.includes('mandiri')) {
    return (
      <svg className={className} viewBox="0 0 160 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Mandiri curved gold ribbon above ri */}
        <path d="M96 16C108 5 128 6 142 14C136 10 120 7 110 14C102 20 98 17 96 16Z" fill="#F8B119" />
        <path d="M106 13C122 2 146 5 158 15C150 9 130 5 116 11C110 14 107 14 106 13Z" fill="#FDB913" />
        {/* "mandiri" text in lowercase dark navy bold */}
        <text x="4" y="38" fill="#002D62" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="30" letterSpacing="-0.8">
          mandirı
        </text>
      </svg>
    );
  }

  if (norm.includes('bca')) {
    return (
      <svg className={className} viewBox="0 0 130 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="130" height="46" rx="9" fill="#00529C" />
        <text x="65" y="32" fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="26" textAnchor="middle" letterSpacing="1">
          BCA
        </text>
        <circle cx="20" cy="23" r="5" fill="#FFFFFF" fillOpacity="0.3" />
        <circle cx="110" cy="23" r="5" fill="#FFFFFF" fillOpacity="0.3" />
      </svg>
    );
  }

  if (norm.includes('bri') || norm.includes('rakyat')) {
    return (
      <svg className={className} viewBox="0 0 140 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="140" height="48" rx="8" fill="#00529C" />
        <path d="M98 8C114 12 126 24 130 38C124 28 112 18 98 16Z" fill="#F37021" />
        <text x="14" y="34" fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="26" letterSpacing="0.5">
          BANK BRI
        </text>
      </svg>
    );
  }

  if (norm.includes('bni') || norm.includes('negara')) {
    return (
      <svg className={className} viewBox="0 0 130 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="6" y="33" fill="#005E6A" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="28" letterSpacing="-0.5">
          BNI
        </text>
        <rect x="74" y="8" width="48" height="30" rx="6" fill="#F15A24" />
        <text x="98" y="30" fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="18" textAnchor="middle">
          46
        </text>
      </svg>
    );
  }

  if (norm.includes('jatim')) {
    return (
      <svg className={className} viewBox="0 0 150 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="150" height="48" rx="8" fill="#D32F2F" />
        <path d="M14 12L24 24L14 36L20 36L28 26L36 36L42 36L32 24L42 12L36 12L28 22L20 12H14Z" fill="#FFD700" />
        <text x="46" y="32" fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="20" letterSpacing="-0.3">
          bankjatim
        </text>
      </svg>
    );
  }

  if (norm.includes('bsi') || norm.includes('syariah')) {
    return (
      <svg className={className} viewBox="0 0 130 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="130" height="46" rx="8" fill="#00A39D" />
        <text x="24" y="32" fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="24">
          BSI
        </text>
        <circle cx="95" cy="23" r="10" fill="#EAAA00" />
        <circle cx="92" cy="21" r="8" fill="#00A39D" />
      </svg>
    );
  }

  if (norm.includes('cimb')) {
    return (
      <svg className={className} viewBox="0 0 150 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="150" height="46" rx="8" fill="#7D0014" />
        <text x="75" y="30" fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="16" textAnchor="middle" letterSpacing="0.5">
          CIMB NIAGA
        </text>
      </svg>
    );
  }

  if (norm.includes('permata')) {
    return (
      <svg className={className} viewBox="0 0 150 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="150" height="46" rx="8" fill="#008542" />
        <text x="75" y="30" fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontWeight="bold" fontSize="17" textAnchor="middle">
          PermataBank
        </text>
      </svg>
    );
  }

  if (norm.includes('danamon')) {
    return (
      <svg className={className} viewBox="0 0 150 46" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="150" height="46" rx="8" fill="#FF8200" />
        <text x="75" y="31" fill="#003A70" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize="19" textAnchor="middle">
          Danamon
        </text>
      </svg>
    );
  }

  // Generic Bank or Cash Fallback
  return (
    <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-xl border border-slate-800">
      <Landmark className="w-5 h-5 text-amber-400" />
      <span className="font-black text-sm tracking-wide font-sans uppercase">
        {bankName || 'TRANSFER BANK'}
      </span>
    </div>
  );
}

// Helper to format legal bank institution name
function getBankLegalInfo(bankName?: string) {
  const norm = (bankName || '').toLowerCase().trim();
  if (norm.includes('mandiri')) return 'PT. Bank Mandiri (Persero) Tbk';
  if (norm.includes('bca')) return 'PT. Bank Central Asia Tbk';
  if (norm.includes('bri')) return 'PT. Bank Rakyat Indonesia (Persero) Tbk';
  if (norm.includes('bni')) return 'PT. Bank Negara Indonesia (Persero) Tbk';
  if (norm.includes('jatim')) return 'PT. Bank Pembangunan Daerah Jawa Timur Tbk';
  if (norm.includes('bsi')) return 'PT. Bank Syariah Indonesia Tbk';
  if (norm.includes('cimb')) return 'PT. Bank CIMB Niaga Tbk';
  if (norm.includes('permata')) return 'PT. Bank Permata Tbk';
  if (norm.includes('danamon')) return 'PT. Bank Danamon Indonesia Tbk';
  if (!bankName || bankName === 'Cash' || bankName === 'Tunai') return 'Kas Operasional Koperasi GMP';
  return `PT. ${bankName} Tbk`;
}

// Helper to format English date for slip (e.g. Aug 25, 2026 21:49:31 (GMT+7))
function formatSlipDateTime(dateStr?: string, createdAtStr?: string) {
  const baseDate = createdAtStr ? new Date(createdAtStr) : (dateStr ? new Date(dateStr) : new Date());
  
  // Format Month in English: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[baseDate.getMonth()];
  const day = baseDate.getDate();
  const year = baseDate.getFullYear();
  
  // Format time (e.g. 21:49:31)
  const hours = String(baseDate.getHours()).padStart(2, '0');
  const minutes = String(baseDate.getMinutes()).padStart(2, '0');
  const seconds = String(baseDate.getSeconds()).padStart(2, '0');

  return {
    headerTimestamp: `${month} ${day}, ${year} ${hours}:${minutes}:${seconds} (GMT+7)`,
    creationDate: `${month} ${day}, ${year} ${hours}:${minutes}:${seconds} (GMT +7)`,
    instructionDate: `${month} ${day}, ${year}`
  };
}

// Generate numerical transaction ID like 202608252147817675
function generateBankTransactionId(payment: Payment) {
  const cleanDate = (payment.paymentDate || '2026-08-25').replace(/-/g, '');
  const digitsFromId = payment.id.replace(/\D/g, '');
  const tail = (digitsFromId + '2147817675').slice(0, 10);
  return `${cleanDate}${tail}`;
}

export default function BankReceiptModal({ payment, purchase, supplier, onClose }: BankReceiptModalProps) {
  const [copied, setCopied] = useState(false);
  const [statusView, setStatusView] = useState<'Successful' | 'Pending Approval'>('Successful');
  const receiptRef = useRef<HTMLDivElement>(null);

  const dates = formatSlipDateTime(payment.paymentDate, payment.createdAt);
  const transactionId = generateBankTransactionId(payment);
  const documentNumber = payment.referenceNumber && payment.referenceNumber !== '-' 
    ? payment.referenceNumber 
    : transactionId;

  const bankName = supplier?.bankName || (payment.paymentMethod === 'Transfer Bank' ? 'Mandiri' : payment.paymentMethod);
  const isMandiri = bankName.toLowerCase().includes('mandiri');
  const bankLegalTitle = getBankLegalInfo(bankName);

  // Transfer Subtitle (In-House vs Interbank)
  const transferTypeHeader = isMandiri
    ? 'Single Transfer To Mandiri - In-House Transfer to Third Party'
    : `Single Transfer To ${bankName.toUpperCase()} - Interbank Transfer (BI-FAST / Online)`;

  // Remark string: items summary from purchase + cashier notes
  const itemNamesSummary = purchase?.items && purchase.items.length > 0
    ? purchase.items.map(i => i.itemName).join(', ')
    : '';
  
  const remarkText = payment.notes || itemNamesSummary || 'Pelunasan Faktur Pembelian';

  // Format currency in bank format: IDR 1,050,000.00
  const formattedBankAmount = `IDR ${Number(payment.amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const textToCopy = `
========================================
BUKTI TRANSFER / TRANSACTION STATUS
========================================
Transaction Id       : ${transactionId}
Document Number      : ${documentNumber}
Creation Date        : ${dates.creationDate}
Total Debit Amount   : ${formattedBankAmount}
Transaction Status   : ${statusView}

----------------------------------------
TRANSFER DETAILS
----------------------------------------
Source Of Fund       : 1710019862187 IDR KONSUMEN GARUDA MERA
Destination Account  : ${supplier?.bankAccount || '-'} ${supplier?.bankAccountHolder || supplier?.name || '-'}
Beneficiary Bank     : ${bankLegalTitle}
Amount               : ${formattedBankAmount}
Transaction Ref      : ${payment.referenceNumber || '-'}
Remark               : ${remarkText}
Invoice Rujukan      : ${purchase?.invoiceNumber || '-'}

----------------------------------------
RINCIAN PRODUK / ITEM NOTA
----------------------------------------
${purchase?.items?.map((item, idx) => `${idx + 1}. ${item.itemName} (${item.quantity} ${item.unit}) @ ${formatRupiah(item.price)} = ${formatRupiah(item.total)}`).join('\n') || '-'}

Total Nota           : ${formatRupiah(purchase?.total || 0)}
Total Terbayar       : ${formatRupiah(purchase?.paidAmount || 0)}
Sisa Hutang          : ${formatRupiah(purchase?.remainingAmount || 0)}
========================================
    `.trim();

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto animate-fade-in text-gray-900">
      
      {/* Modal Box */}
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-150 max-h-[94vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:rounded-none print:w-full">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 print:hidden select-none">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/30 text-indigo-300 rounded-xl border border-indigo-500/20">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Bukti Transfer / E-Banking Slip
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Rujukan Invoice: <span className="text-indigo-300 font-bold">{purchase?.invoiceNumber || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Quick status view toggle & buttons */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-[10px]">
              <button
                onClick={() => setStatusView('Successful')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusView === 'Successful' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                ● Success
              </button>
              <button
                onClick={() => setStatusView('Pending Approval')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusView === 'Pending Approval' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                ● Pending
              </button>
            </div>

            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Salin Rincian Bukti ke Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              title="Cetak Bukti Transfer Resmi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Slip Container */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white font-sans text-gray-900 space-y-7 print:p-0 print:overflow-visible" id="printable-bank-slip" ref={receiptRef}>
          
          {/* Header Row: Bank Logo & English Timestamp */}
          <div className="flex items-start justify-between border-b border-gray-100 pb-5">
            <div className="flex flex-col">
              <BankLogo bankName={bankName} className="h-10 w-auto" />
            </div>
            <div className="text-right">
              <span className="text-xs sm:text-sm font-medium text-gray-700 font-sans tracking-tight">
                {dates.headerTimestamp}
              </span>
            </div>
          </div>

          {/* Main Title Banner */}
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight font-sans">
              Transaction Status
            </h1>
            <p className="text-xs sm:text-sm text-gray-700 font-normal">
              Keep track of your transaction
            </p>
          </div>

          {/* Section 1: Transaction Status Overview */}
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Transaction Status
            </h2>

            <div className="space-y-2 text-xs sm:text-sm font-sans">
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Transaction Id</div>
                <div className="sm:col-span-8 font-medium text-gray-900 font-mono tracking-tight">{transactionId}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Document Number</div>
                <div className="sm:col-span-8 font-medium text-gray-900 font-mono tracking-tight">{documentNumber}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Creation Date</div>
                <div className="sm:col-span-8 font-normal text-gray-900">{dates.creationDate}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Total Debit Amount</div>
                <div className="sm:col-span-8 font-medium text-gray-900 font-mono">{formattedBankAmount}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Instruction Mode</div>
                <div className="sm:col-span-8 font-normal text-gray-900">Immediate</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 items-center">
                <div className="sm:col-span-4 text-gray-700 font-normal">Transaction Status</div>
                <div className="sm:col-span-8 font-semibold flex items-center gap-1.5">
                  {statusView === 'Successful' ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="text-emerald-700">Successful</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span className="text-amber-700">Pending Approval</span>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Section 2: Single Transfer Detail Section */}
          <div className="space-y-3 pt-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-snug">
              {transferTypeHeader}
            </h2>

            <div className="space-y-2 text-xs sm:text-sm font-sans">
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Source Of Fund</div>
                <div className="sm:col-span-8 font-medium text-gray-900 font-mono">
                  1710019862187 IDR KONSUMEN GARUDA MERA
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Destination Account</div>
                <div className="sm:col-span-8 font-medium text-gray-900 font-mono">
                  {supplier?.bankAccount || '1710017077929'} {supplier?.bankAccountHolder || supplier?.name || 'SITI AROMAH'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Beneficiary Bank Information</div>
                <div className="sm:col-span-8 font-normal text-gray-900">{bankLegalTitle}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Amount</div>
                <div className="sm:col-span-8 font-medium text-gray-900 font-mono">{formattedBankAmount}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Total Debit Amount</div>
                <div className="sm:col-span-8 font-medium text-gray-900 font-mono">{formattedBankAmount}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Transaction Reference</div>
                <div className="sm:col-span-8 font-normal text-gray-900 font-mono">
                  {payment.referenceNumber || '-'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Remark</div>
                <div className="sm:col-span-8 font-medium text-gray-900 font-sans">
                  {remarkText}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Instruction Mode</div>
                <div className="sm:col-span-8 font-normal text-gray-900">Immediate</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Instruction Date</div>
                <div className="sm:col-span-8 font-normal text-gray-900">{dates.instructionDate}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2">
                <div className="sm:col-span-4 text-gray-700 font-normal">Additional Notification</div>
                <div className="sm:col-span-8 space-y-1 text-gray-900">
                  <div className="flex gap-4">
                    <span className="w-12 text-gray-600">Email</span>
                    <span>{supplier?.email || '-'}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="w-12 text-gray-600">SMS</span>
                    <span>{supplier?.phone ? `${supplier.phone}` : '-'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Produk yang Sesuai Nota (Itemized Products Table) */}
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Rincian Produk Sesuai Nota ({purchase?.invoiceNumber || 'Faktur Terkait'})</span>
              </h2>
              {purchase?.status && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono ${
                  purchase.status === 'Lunas'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : purchase.status === 'Sebagian'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  Status Nota: {purchase.status}
                </span>
              )}
            </div>

            {purchase?.items && purchase.items.length > 0 ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 border-b border-gray-200 font-semibold">
                    <tr>
                      <th className="p-2.5 w-8 text-center">No</th>
                      <th className="p-2.5">Nama Barang / Deskripsi</th>
                      <th className="p-2.5 text-center w-28">Kuantitas</th>
                      <th className="p-2.5 text-right w-28">Harga Satuan</th>
                      <th className="p-2.5 text-right w-32">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {purchase.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50/50">
                        <td className="p-2.5 text-center text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-gray-900 uppercase">{item.itemName}</td>
                        <td className="p-2.5 text-center font-mono text-gray-700 font-medium">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-2.5 text-right font-mono text-gray-600">
                          {formatRupiah(item.price)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                          {formatRupiah(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-xs text-gray-500 italic">
                Data rincian produk nota tidak tersedia atau telah diarsipkan.
              </div>
            )}

            {/* Billing Summary Box */}
            {purchase && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Total Tagihan Nota ({purchase.invoiceNumber}):</span>
                  <span className="font-mono font-bold text-gray-900">{formatRupiah(purchase.total)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Nominal Pelunasan Transfer Ini:</span>
                  <span className="font-mono font-bold">{formatRupiah(payment.amount)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Akumulasi Total Dibayar:</span>
                  <span className="font-mono">{formatRupiah(purchase.paidAmount)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-gray-200 font-bold">
                  <span className={purchase.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                    Sisa Hutang Tertunggak:
                  </span>
                  <span className={`font-mono text-sm ${purchase.remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {formatRupiah(purchase.remainingAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Operator info footer */}
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pt-2 border-t border-dashed border-gray-200">
              <span>Dicatat oleh: <strong className="text-gray-700">{payment.receivedBy || 'Staff Kasir'}</strong></span>
              <span>Waktu Pembukuan: {formatDate(payment.createdAt || payment.paymentDate)}</span>
            </div>

          </div>

        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between print:hidden shrink-0">
          <div className="text-[11px] text-gray-500 font-mono">
            ID: <span className="font-bold text-gray-700">{payment.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Slip Transfer</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
