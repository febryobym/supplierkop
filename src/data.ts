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

/**
 * Utility to match search queries against a set of text fields.
 * Performs word-prefix matching so searching "gas" or "ga" matches words starting with "gas" or "ga"
 * (e.g., "GAS ELPIJI", "GALON"), but won't false-positive match middle substrings (e.g., "Ngasem" or "Unggas").
 */
export const matchSearchFields = (fields: (string | undefined | null)[], query: string): boolean => {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return true;

  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const validFields = fields.filter((f): f is string => Boolean(f && typeof f === 'string'));
  if (validFields.length === 0) return false;

  const fullCombined = validFields.map(f => f.toLowerCase()).join(' ');

  return tokens.every(token => {
    // If token contains punctuation/symbols (like 'inv/2026' or '08-01'), fallback to direct substring match
    if (/[^a-zA-Z0-9]/.test(token)) {
      return fullCombined.includes(token);
    }

    // Otherwise check if ANY word in any field starts with the token
    return validFields.some(field => {
      const str = field.toLowerCase();
      const words = str.split(/[\s/.,_\-()]+/).filter(Boolean);
      return words.some(w => w.startsWith(token));
    });
  });
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
