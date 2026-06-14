/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Supplier, Purchase, Payment, ActivityLog, Notification } from './types';

// Predefined Users
export const PREDEFINED_USERS: User[] = [
  {
    id: 'usr-1',
    username: 'admin',
    name: 'Budi Santoso',
    role: 'Admin',
    email: 'budi.admin@supplierku.com'
  },
  {
    id: 'usr-2',
    username: 'manager',
    name: 'Siti Rahma',
    role: 'Manager',
    email: 'siti.manager@supplierku.com'
  },
  {
    id: 'usr-3',
    username: 'staff',
    name: 'Andi Wijaya',
    role: 'Staff',
    email: 'andi.staff@supplierku.com'
  }
];

// Predefined Suppliers
export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'spl-1',
    name: 'PT Maju Jaya Abadi',
    code: 'SUP-001',
    contactPerson: 'Eko Prasetyo',
    phone: '081234567890',
    email: 'sales@majujayabadi.co.id',
    address: 'Kawasan Industri Pulogadung Blok B3, Jakarta Timur',
    bankName: 'Bank Mandiri',
    bankAccount: '1220009876543',
    bankAccountHolder: 'PT Maju Jaya Abadi'
  },
  {
    id: 'spl-2',
    name: 'CV Semesta Elektronik',
    code: 'SUP-002',
    contactPerson: 'Linda Kusuma',
    phone: '085698765432',
    email: 'linda@semestaelectro.com',
    address: 'Jl. Pemuda No. 45, Semarang, Jawa Tengah',
    bankName: 'BCA',
    bankAccount: '8001223409',
    bankAccountHolder: 'Linda Kusuma'
  },
  {
    id: 'spl-3',
    name: 'PT Globalindo Suku Cadang',
    code: 'SUP-003',
    contactPerson: 'Hendra Setiawan',
    phone: '082199887766',
    email: 'info@globalindospareparts.com',
    address: 'Rukan Gading Serpong, Blok AA No. 12, Tangerang',
    bankName: 'BNI',
    bankAccount: '00987654321',
    bankAccountHolder: 'PT Globalindo Suku Cadang'
  },
  {
    id: 'spl-4',
    name: 'UD Sumber Berkah',
    code: 'SUP-004',
    contactPerson: 'Haji Slamet',
    phone: '081344556677',
    email: 'sumberberkah.ud@gmail.com',
    address: 'Pasar Turi Baru Blok C No. 8, Surabaya',
    bankName: 'BRI',
    bankAccount: '034101000999302',
    bankAccountHolder: 'Slamet Rahardjo'
  }
];

// Helper to calculate relative date strings
const getRelativeDateString = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

// Initial Purchases
export const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'pur-1',
    supplierId: 'spl-1',
    invoiceNumber: 'INV/2026/05/1001',
    purchaseDate: getRelativeDateString(-45),
    dueDate: getRelativeDateString(-15), // Overdue!
    items: [
      { id: 'item-1', itemName: 'Semen Portland Konstituen 50kg', quantity: 200, unit: 'Sack', price: 65000, total: 13000000 },
      { id: 'item-2', itemName: 'Besi Beton Diameter 10mm', quantity: 150, unit: 'Batang', price: 85000, total: 12750000 }
    ],
    subTotal: 25750000,
    tax: 11,
    taxAmount: 2832500,
    discount: 500000,
    total: 28082500,
    paidAmount: 15000000,
    remainingAmount: 13082500,
    status: 'Sebagian',
    notes: 'Pembelian material proyek perumahan kluster A.',
    createdBy: 'Andi Wijaya',
    createdAt: new Date(getRelativeDateString(-45) + 'T09:30:00Z').toISOString()
  },
  {
    id: 'pur-2',
    supplierId: 'spl-2',
    invoiceNumber: 'INV/2026/06/0244',
    purchaseDate: getRelativeDateString(-10),
    dueDate: getRelativeDateString(5), // Due soon!
    items: [
      { id: 'item-3', itemName: 'Kabel Tembaga NYA 1.5mm', quantity: 30, unit: 'Roll', price: 295000, total: 8850000 },
      { id: 'item-4', itemName: 'Stop Kontak Double Ground', quantity: 120, unit: 'Pcs', price: 24000, total: 2880000 }
    ],
    subTotal: 11730000,
    tax: 11,
    taxAmount: 1290300,
    discount: 0,
    total: 13020300,
    paidAmount: 0,
    remainingAmount: 13020300,
    status: 'Belum Lunas',
    notes: 'Stok aksesoris listrik toko utama.',
    createdBy: 'Andi Wijaya',
    createdAt: new Date(getRelativeDateString(-10) + 'T14:15:00Z').toISOString()
  },
  {
    id: 'pur-3',
    supplierId: 'spl-3',
    invoiceNumber: 'INV/2026/04/0912',
    purchaseDate: getRelativeDateString(-60),
    dueDate: getRelativeDateString(-30),
    items: [
      { id: 'item-5', itemName: 'Piston Ring Kit Supra X 125', quantity: 50, unit: 'Set', price: 115000, total: 5750000 },
      { id: 'item-6', itemName: 'Kampas Rem Depan Vario ISS', quantity: 100, unit: 'Set', price: 45000, total: 4500000 }
    ],
    subTotal: 10250000,
    tax: 11,
    taxAmount: 1127500,
    discount: 1000000, // Diskon loyalti
    total: 10377500,
    paidAmount: 10377500,
    remainingAmount: 0,
    status: 'Lunas',
    notes: 'Kebutuhan bengkel servis periode Mei.',
    createdBy: 'Siti Rahma',
    createdAt: new Date(getRelativeDateString(-60) + 'T10:00:00Z').toISOString()
  },
  {
    id: 'pur-4',
    supplierId: 'spl-4',
    invoiceNumber: 'INV/2026/06/0002',
    purchaseDate: getRelativeDateString(-3),
    dueDate: getRelativeDateString(12), // Aman
    items: [
      { id: 'item-7', itemName: 'Paku Seng Ulir 3 Inch', quantity: 40, unit: 'Kotak', price: 92000, total: 3680000 },
      { id: 'item-8', itemName: 'Kawat Las 2.6mm Steel', quantity: 15, unit: 'Dus', price: 185000, total: 2775000 }
    ],
    subTotal: 6455000,
    tax: 0, // Eksklusif Bebas Pajak
    taxAmount: 0,
    discount: 155000,
    total: 6300000,
    paidAmount: 0,
    remainingAmount: 6300000,
    status: 'Belum Lunas',
    notes: 'Suplai gudang cabang Sidoarjo.',
    createdBy: 'Andi Wijaya',
    createdAt: new Date(getRelativeDateString(-3) + 'T11:45:00Z').toISOString()
  }
];

// Initial Payments
export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    purchaseId: 'pur-1',
    amount: 15000000,
    paymentDate: getRelativeDateString(-43),
    paymentMethod: 'Transfer Bank',
    referenceNumber: 'TRF-MND-9901A',
    notes: 'DP pembelian awal semen dan besi beton.',
    receivedBy: 'Andi Wijaya',
    createdAt: new Date(getRelativeDateString(-43) + 'T11:00:00Z').toISOString()
  },
  {
    id: 'pay-2',
    purchaseId: 'pur-3',
    amount: 10377500,
    paymentDate: getRelativeDateString(-58),
    paymentMethod: 'Transfer Bank',
    referenceNumber: 'TRF-BNI-1229E',
    notes: 'Pelunasan faktur sperpart motor - Langsung Lunas.',
    receivedBy: 'Siti Rahma',
    createdAt: new Date(getRelativeDateString(-58) + 'T11:30:00Z').toISOString()
  }
];

// Initial Activity Logs
export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    userId: 'usr-1',
    userName: 'Budi Santoso',
    userRole: 'Admin',
    action: 'LOGIN',
    target: 'Sistem',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'log-2',
    userId: 'usr-3',
    userName: 'Andi Wijaya',
    userRole: 'Staff',
    action: 'TAMBAH_PEMBELIAN',
    target: 'INV/2026/06/0244 kepada CV Semesta Elektronik',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'log-3',
    userId: 'usr-2',
    userName: 'Siti Rahma',
    userRole: 'Manager',
    action: 'PROSES_BAYAR',
    target: 'INV/2026/04/0912 kepada PT Globalindo Suku Cadang',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

// Helper formats
export const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// Simple export CSV helper
export const exportToCSV = (filename: string, headers: string[], data: string[][]) => {
  const content = [
    headers.join(','),
    ...data.map(row => row.map(cell => {
      // Escape commas and double quotes
      const cleanCell = cell.replace(/"/g, '""');
      return cleanCell.includes(',') || cleanCell.includes('"') || cleanCell.includes('\n')
        ? `"${cleanCell}"`
        : cleanCell;
    }).join(','))
  ].join('\n');

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
