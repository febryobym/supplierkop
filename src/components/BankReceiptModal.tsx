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

// Bank Logo Components matching official brand identities
export function BankLogo({ bankName, className = "h-11 w-auto" }: { bankName?: string; className?: string }) {
  const norm = (bankName || '').toLowerCase().trim();

  // Bank Mandiri (Official Wave Ribbon & lowercase mandiri)
  if (norm.includes('mandiri')) {
    return (
      <svg className={className} viewBox="0 0 240 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Golden Wave Ribbon */}
        <path
          d="M98 32C112 18 132 18 148 31C164 44 186 44 202 30C210 23 218 24 226 31L236 21C222 9 202 9 186 22C170 35 148 35 132 21C122 13 110 13 98 22L98 32Z"
          fill="#F5A800"
        />
        <path
          d="M98 26C112 14 130 14 146 25C162 36 182 36 198 25C208 17 218 18 226 24L230 18C218 8 200 8 186 18C172 28 152 28 138 17C124 7 108 8 98 18V26Z"
          fill="#FFC72C"
          fillOpacity="0.8"
        />
        {/* "mandiri" text */}
        <text
          x="4"
          y="56"
          fill="#13294B"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="44"
          letterSpacing="-1.5"
        >
          mandırı
        </text>
      </svg>
    );
  }

  // Bank BCA (Official Shield with 3-petal emblem + "GRUP BCA" + bold italic "BCA")
  if (norm.includes('bca')) {
    return (
      <svg className={className} viewBox="0 0 220 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left Shield Badge */}
        <rect x="2" y="5" width="60" height="60" rx="14" fill="#005CA9" />
        {/* Center Main Petal */}
        <ellipse cx="32" cy="28" rx="7.5" ry="11" fill="#FFFFFF" />
        {/* Left Wing Petal */}
        <path d="M17 38C15 31 22 25 30 31C24 35 22 41 17 38Z" fill="#FFFFFF" />
        <path d="M16 43C13 36 21 34 29 37C24 41 21 46 16 43Z" fill="#FFFFFF" />
        {/* Right Wing Petal */}
        <path d="M47 38C49 31 42 25 34 31C40 35 42 41 47 38Z" fill="#FFFFFF" />
        <path d="M48 43C51 36 43 34 35 37C40 41 43 46 48 43Z" fill="#FFFFFF" />
        {/* Shield Subtext */}
        <text
          x="32"
          y="57"
          fill="#FFFFFF"
          fontFamily="system-ui, sans-serif"
          fontWeight="800"
          fontSize="6.5"
          textAnchor="middle"
          letterSpacing="0.8"
        >
          GRUP BCA
        </text>

        {/* Right Bold Italic "BCA" */}
        <text
          x="74"
          y="52"
          fill="#005CA9"
          fontFamily="Arial Black, Impact, system-ui, sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="46"
          letterSpacing="-0.5"
        >
          BCA
        </text>
      </svg>
    );
  }

  // Bank BRI (Official Interlocking 'B' Mark + "BANK BRI" + Slogan)
  if (norm.includes('bri') || norm.includes('rakyat')) {
    return (
      <svg className={className} viewBox="0 0 250 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Interlocking geometric B icon */}
        <g fill="#00529C">
          {/* Outer Rounded Container / Stylized Loops */}
          <rect x="2" y="6" width="58" height="58" rx="14" fill="#00529C" />
          <path
            d="M16 18H28C34 18 38 21 38 26C38 29 36 32 32 33C37 34 40 37 40 43C40 49 35 52 28 52H16V18ZM23 31H27C30 31 32 29 32 26C32 23 30 22 27 22H23V31ZM23 48H28C31 48 34 46 34 43C34 39 31 37 28 37H23V48Z"
            fill="#FFFFFF"
          />
          <path
            d="M32 25C37 25 43 28 43 34C43 38 40 41 36 42C41 43 45 47 45 53C45 59 40 62 34 62H26L30 57H34C37 57 39 55 39 52C39 49 37 47 34 47H29L33 42C36 42 38 40 38 37C38 34 36 32 33 32H27L31 25H32Z"
            fill="#FFFFFF"
            fillOpacity="0.4"
          />
        </g>

        {/* Text: BANK BRI */}
        <text
          x="68"
          y="43"
          fill="#00529C"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          fontSize="38"
          letterSpacing="0.5"
        >
          BANK BRI
        </text>

        {/* Subtext: Melayani Dengan Setulus Hati */}
        <text
          x="69"
          y="61"
          fill="#00529C"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          fontSize="11.5"
          letterSpacing="-0.2"
        >
          Melayani Dengan Setulus Hati
        </text>
      </svg>
    );
  }

  // Bank BNI (Official Orange Square with stylized '46' + teal "BNI" serif font)
  if (norm.includes('bni') || norm.includes('negara')) {
    return (
      <svg className={className} viewBox="0 0 220 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Orange Square with white abstract ribbons */}
        <rect x="2" y="8" width="54" height="54" rx="3" fill="#F15A24" />
        {/* Stylized '46' curve loops in white */}
        <path
          d="M14 62L44 8"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M20 32C24 22 36 18 44 24C52 30 50 44 38 48C28 52 18 42 22 32"
          stroke="#FFFFFF"
          strokeWidth="5"
          fill="none"
        />

        {/* "BNI" in refined dark teal serif */}
        <text
          x="68"
          y="52"
          fill="#005F6A"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="900"
          fontSize="48"
          letterSpacing="1"
        >
          BNI
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

// Helper to format English date for slip (e.g. Aug 25, 2026 21:47:24 (GMT+7)) strictly using Tanggal Bayar (paymentDate)
function formatSlipDateTime(paymentDate?: string, createdAtStr?: string) {
  let year = 2026;
  let monthIndex = 7; // Aug (0-indexed)
  let day = 25;

  if (paymentDate && paymentDate.includes('-')) {
    const parts = paymentDate.split('-');
    if (parts.length >= 3) {
      year = parseInt(parts[0], 10) || 2026;
      monthIndex = Math.max(0, Math.min(11, (parseInt(parts[1], 10) || 8) - 1));
      day = parseInt(parts[2], 10) || 25;
    }
  } else if (paymentDate) {
    const d = new Date(paymentDate);
    if (!isNaN(d.getTime())) {
      year = d.getFullYear();
      monthIndex = d.getMonth();
      day = d.getDate();
    }
  }

  // Preserve time component from createdAt if available, otherwise default to standard time
  let hours = '21';
  let minutes = '47';
  let seconds = '24';

  if (createdAtStr) {
    const createdDate = new Date(createdAtStr);
    if (!isNaN(createdDate.getTime())) {
      hours = String(createdDate.getHours()).padStart(2, '0');
      minutes = String(createdDate.getMinutes()).padStart(2, '0');
      seconds = String(createdDate.getSeconds()).padStart(2, '0');
    }
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[monthIndex] || 'Aug';

  return {
    headerTimestamp: `${month} ${day}, ${year} (GMT+7)`,
    creationDate: `${month} ${day}, ${year}`,
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
