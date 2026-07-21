/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Supplier, Purchase, Payment, ActivityLog, Notification } from './types';

// Predefined Users
export const PREDEFINED_USERS: User[] = [
  {
    id: 'usr-febry',
    username: 'febrymal',
    name: 'Febrymal Rifdillah',
    role: 'Admin',
    email: 'febrymal.rifdillah@gmail.com',
    password: 'admin123'
  }
];

// Predefined Suppliers
export const INITIAL_SUPPLIERS: Supplier[] = [];

// Helper to calculate relative date strings
const getRelativeDateString = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

// Initial Purchases
export const INITIAL_PURCHASES: Purchase[] = [];

// Initial Payments
export const INITIAL_PAYMENTS: Payment[] = [];

// Initial Activity Logs
export const INITIAL_LOGS: ActivityLog[] = [];

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
