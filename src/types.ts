/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin' | 'Manager' | 'Staff';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  bankName: string;
  bankAccount: string;
  bankAccountHolder: string;
}

export interface PurchaseItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string; // e.g., 'Pcs', 'Unit', 'Box', 'Kg'
  price: number;
  total: number;
}

export type PurchaseStatus = 'Belum Lunas' | 'Sebagian' | 'Lunas';

export interface Purchase {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  purchaseDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  items: PurchaseItem[];
  subTotal: number;
  tax: number; // Percentage, e.g., 11%
  taxAmount: number;
  discount: number; // Value in IDR
  total: number;
  paidAmount: number;
  remainingAmount: number;
  status: PurchaseStatus;
  notes?: string;
  createdBy: string; // User's name
  createdAt: string; // ISO string
}

export type PaymentMethod = 'Cash' | 'Transfer Bank' | 'Cek_Giro' | 'Lainnya';

export interface Payment {
  id: string;
  purchaseId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  referenceNumber?: string; // transaction hash / transfer receipt number
  notes?: string;
  receivedBy: string; // login user who recorded payment
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'due_soon' | 'overdue' | 'system';
  title: string;
  message: string;
  purchaseId?: string;
  supplierId?: string;
  targetDate?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  target: string;
  timestamp: string;
}
