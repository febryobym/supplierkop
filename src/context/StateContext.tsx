/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Supplier, Purchase, Payment, ActivityLog, Notification, UserRole, PurchaseStatus } from '../types';
import { INITIAL_SUPPLIERS, INITIAL_PURCHASES, INITIAL_PAYMENTS, INITIAL_LOGS, PREDEFINED_USERS } from '../data';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

interface StateContextType {
  currentUser: User | null;
  users: User[];
  suppliers: Supplier[];
  purchases: Purchase[];
  payments: Payment[];
  logs: ActivityLog[];
  notifications: Notification[];
  authError: string | null;
  isOfflineFallback: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => boolean;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdBy' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>) => void;
  deletePurchase: (id: string) => boolean;
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'receivedBy'>) => void;
  deletePayment: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => boolean;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => boolean;
  clearAllData: () => void;
  addSystemLog: (action: string, target: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sh_current_user');
    return saved ? JSON.parse(saved) : PREDEFINED_USERS[0]; // Default Admin
  });

  // Master lists preloaded from localStorage or defaults to eliminate visual flashing and empty layouts
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sh_users');
    return saved ? JSON.parse(saved) : PREDEFINED_USERS;
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('sh_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem('sh_purchases');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
  });
  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('sh_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('sh_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Connectivity and Authentications
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isConnectionChecked, setIsConnectionChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  // Initialize Firebase Auth + Connection Validation
  useEffect(() => {
    const checkFirestoreConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'system_config', 'genesis'));
        setIsOfflineFallback(false);
        setAuthError(null);
      } catch (error: any) {
        console.warn("Firestore connection check failed, falling back to local mode:", error);
        const errMsg = error instanceof Error ? error.message : String(error);
        setAuthError(`firestore-error: ${errMsg}`);
        setIsOfflineFallback(true);
      } finally {
        setIsConnectionChecked(true);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthReady(true);
        await checkFirestoreConnection();
      } else {
        signInAnonymously(auth)
          .then(async () => {
            setIsAuthReady(true);
            await checkFirestoreConnection();
          })
          .catch((err: any) => {
            console.warn("Firebase Anonymous Auth not available:", err?.message || err);
            const errMsg = err instanceof Error ? err.message : String(err);
            setAuthError(`auth-error: ${errMsg}`);
            setIsOfflineFallback(true);
            setIsAuthReady(true);
            setIsConnectionChecked(true);
          });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Sync session authentication
  useEffect(() => {
    localStorage.setItem('sh_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Keep currentUser state in sync with master users list updates (e.g. password or role changes)
  useEffect(() => {
    if (!currentUser) return;
    const freshUser = users.find((u) => u.id === currentUser.id);
    if (freshUser) {
      if (
        freshUser.name !== currentUser.name ||
        freshUser.email !== currentUser.email ||
        freshUser.role !== currentUser.role ||
        freshUser.password !== currentUser.password ||
        freshUser.username !== currentUser.username
      ) {
        setCurrentUser(freshUser);
      }
    }
  }, [users, currentUser]);

  // OFFLINE MODE: Load list states from LocalStorage or seed defaults
  useEffect(() => {
    if (!isOfflineFallback) return;

    const savedUsers = localStorage.getItem('sh_users');
    setUsers(savedUsers ? JSON.parse(savedUsers) : PREDEFINED_USERS);

    const savedSuppliers = localStorage.getItem('sh_suppliers');
    setSuppliers(savedSuppliers ? JSON.parse(savedSuppliers) : INITIAL_SUPPLIERS);

    const savedPurchases = localStorage.getItem('sh_purchases');
    setPurchases(savedPurchases ? JSON.parse(savedPurchases) : INITIAL_PURCHASES);

    const savedPayments = localStorage.getItem('sh_payments');
    setPayments(savedPayments ? JSON.parse(savedPayments) : INITIAL_PAYMENTS);

    const savedLogs = localStorage.getItem('sh_logs');
    setLogs(savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS);
  }, [isOfflineFallback]);

  // Write state changes back to LocalStorage to guarantee robust offline caching and session durability
  useEffect(() => {
    localStorage.setItem('sh_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('sh_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('sh_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('sh_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('sh_logs', JSON.stringify(logs));
  }, [logs]);

  // Database Initializer (Genesis Seeding)
  useEffect(() => {
    if (!isAuthReady || !isConnectionChecked || isOfflineFallback) return;

    const seedDatabaseIfNeeded = async () => {
      try {
        const genesisRef = doc(db, 'system_config', 'genesis');
        const genesisSnap = await getDocFromServer(genesisRef);
        if (!genesisSnap.exists()) {
          console.log("No seed signature found. Initializing master demo collections...");
          
          // Seed Users
          for (const u of PREDEFINED_USERS) {
            await setDoc(doc(db, 'users', u.id), u);
          }
          // Seed Suppliers
          for (const s of INITIAL_SUPPLIERS) {
            await setDoc(doc(db, 'suppliers', s.id), s);
          }
          // Seed Purchases
          for (const p of INITIAL_PURCHASES) {
            await setDoc(doc(db, 'purchases', p.id), p);
          }
          // Seed Payments
          for (const pay of INITIAL_PAYMENTS) {
            await setDoc(doc(db, 'payments', pay.id), pay);
          }
          // Seed Logs
          for (const log of INITIAL_LOGS) {
            await setDoc(doc(db, 'logs', log.id), log);
          }
          
          // Seed Signature
          await setDoc(genesisRef, {
            initialized: true,
            createdAt: new Date().toISOString()
          });
          console.log("Database seeded successfully.");
        }
      } catch (error) {
        console.warn("Database initialization check paused/skipped (offline or initial connection buffering):", error);
      }
    };

    seedDatabaseIfNeeded();
  }, [isAuthReady, isConnectionChecked, isOfflineFallback]);

  // ONLINE MODE: Real-time Firebase listeners
  useEffect(() => {
    if (!isAuthReady || !isConnectionChecked || isOfflineFallback) return;

    // 1. Sync Persons
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: User[] = [];
      snapshot.forEach((doc) => list.push(doc.data() as User));
      if (list.length === 0) {
        // Safe lock: ensure at least default users exist so login is always accessible
        PREDEFINED_USERS.forEach(async (u) => {
          try {
            await setDoc(doc(db, 'users', u.id), u);
          } catch (e) {
            console.error("Failed to seed User safeguard:", e);
          }
        });
      } else {
        setUsers(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // 2. Sync Suppliers
    const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      const list: Supplier[] = [];
      snapshot.forEach((doc) => list.push(doc.data() as Supplier));
      setSuppliers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'suppliers');
    });

    // 3. Sync Purchases
    const unsubPurchases = onSnapshot(collection(db, 'purchases'), (snapshot) => {
      const list: Purchase[] = [];
      snapshot.forEach((doc) => list.push(doc.data() as Purchase));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPurchases(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'purchases');
    });

    // 4. Sync Payments
    const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      const list: Payment[] = [];
      snapshot.forEach((doc) => list.push(doc.data() as Payment));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPayments(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
    });

    // 5. Sync Logs
    const unsubLogs = onSnapshot(collection(db, 'logs'), (snapshot) => {
      const list: ActivityLog[] = [];
      snapshot.forEach((doc) => list.push(doc.data() as ActivityLog));
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'logs');
    });

    return () => {
      unsubUsers();
      unsubSuppliers();
      unsubPurchases();
      unsubPayments();
      unsubLogs();
    };
  }, [isAuthReady, isConnectionChecked, isOfflineFallback]);

  // Compute Warnings Notification
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newNotifications: Notification[] = [];

    purchases.forEach((p) => {
      if (p.status !== 'Lunas') {
        const diffTime = new Date(p.dueDate).getTime() - new Date(todayStr).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const supplierName = suppliers.find((s) => s.id === p.supplierId)?.name || 'Supplier';

        if (diffDays < 0) {
          newNotifications.push({
            id: `notif-overdue-${p.id}`,
            type: 'overdue',
            title: 'Tagihan Melewati Jatuh Tempo!',
            message: `Invoice ${p.invoiceNumber} milik ${supplierName} terlambat ${Math.abs(diffDays)} hari. Sisa hutang: Rp ${p.remainingAmount.toLocaleString('id-ID')}`,
            purchaseId: p.id,
            supplierId: p.supplierId,
            targetDate: p.dueDate,
            isRead: false,
            createdAt: new Date().toISOString()
          });
        } else if (diffDays <= 7) {
          newNotifications.push({
            id: `notif-duesoon-${p.id}`,
            type: 'due_soon',
            title: 'Jatuh Tempo Mendekat',
            message: `Invoice ${p.invoiceNumber} (${supplierName}) akan jatuh tempo dalam ${diffDays} hari pada ${p.dueDate}. Sisa: Rp ${p.remainingAmount.toLocaleString('id-ID')}`,
            purchaseId: p.id,
            supplierId: p.supplierId,
            targetDate: p.dueDate,
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    });

    setNotifications(newNotifications);
  }, [purchases, suppliers]);

  // Log action
  const addSystemLog = async (action: string, target: string) => {
    if (!currentUser) return;
    const id = `log-${Date.now()}`;
    const newLog: ActivityLog = {
      id,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      target,
      timestamp: new Date().toISOString()
    };

    if (isOfflineFallback) {
      setLogs((prev) => [newLog, ...prev]);
    } else {
      try {
        await setDoc(doc(db, 'logs', id), newLog);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `logs/${id}`);
      }
    }
  };

  // Auth Operations
  const login = (email: string, password: string): boolean => {
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && (u.password || 'password') === password);
    if (found) {
      setCurrentUser(found);
      const id = `log-${Date.now()}`;
      const newLog: ActivityLog = {
        id,
        userId: found.id,
        userName: found.name,
        userRole: found.role,
        action: 'LOGIN',
        target: 'Sistem',
        timestamp: new Date().toISOString()
      };

      if (isOfflineFallback) {
        setLogs((prev) => [newLog, ...prev]);
      } else {
        setDoc(doc(db, 'logs', id), newLog).catch((er) => {
          console.error("Failed to write login log:", er);
        });
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      const id = `log-${Date.now()}`;
      const newLog: ActivityLog = {
        id,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'LOGOUT',
        target: 'Sistem',
        timestamp: new Date().toISOString()
      };

      if (isOfflineFallback) {
        setLogs((prev) => [newLog, ...prev]);
      } else {
        setDoc(doc(db, 'logs', id), newLog).catch((er) => {
          console.error("Failed to write logout log:", er);
        });
      }
    }
    setCurrentUser(null);
  };

  // Suppliers CRUD
  const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    const id = `spl-${Date.now()}`;
    const newSupplier: Supplier = { ...supplierData, id };

    if (isOfflineFallback) {
      setSuppliers((prev) => [...prev, newSupplier]);
      await addSystemLog('TAMBAH_SUPPLIER', `Supplier ${newSupplier.name} (${newSupplier.code})`);
    } else {
      try {
        await setDoc(doc(db, 'suppliers', id), newSupplier);
        await addSystemLog('TAMBAH_SUPPLIER', `Supplier ${newSupplier.name} (${newSupplier.code})`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `suppliers/${id}`);
      }
    }
  };

  const updateSupplier = async (updated: Supplier) => {
    if (isOfflineFallback) {
      setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      await addSystemLog('UBAH_SUPPLIER', `Supplier ${updated.name} (${updated.code})`);
    } else {
      try {
        await setDoc(doc(db, 'suppliers', updated.id), updated);
        await addSystemLog('UBAH_SUPPLIER', `Supplier ${updated.name} (${updated.code})`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `suppliers/${updated.id}`);
      }
    }
  };

  const deleteSupplier = (id: string): boolean => {
    const isLinked = purchases.some((p) => p.supplierId === id);
    if (isLinked) return false;

    const supplier = suppliers.find((s) => s.id === id);
    if (supplier) {
      if (isOfflineFallback) {
        setSuppliers((prev) => prev.filter((s) => s.id !== id));
        addSystemLog('HAPUS_SUPPLIER', `Supplier ${supplier.name} (${supplier.code})`);
      } else {
        deleteDoc(doc(db, 'suppliers', id))
          .then(() => {
            addSystemLog('HAPUS_SUPPLIER', `Supplier ${supplier!.name} (${supplier!.code})`);
          })
          .catch((error) => {
            handleFirestoreError(error, OperationType.DELETE, `suppliers/${id}`);
          });
      }
    }
    return true;
  };

  // Purchases CRUD
  const addPurchase = async (purchaseData: Omit<Purchase, 'id' | 'createdBy' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>) => {
    const id = `pur-${Date.now()}`;
    const newPurchase: Purchase = {
      ...purchaseData,
      id,
      paidAmount: 0,
      remainingAmount: purchaseData.total,
      status: 'Belum Lunas',
      createdBy: currentUser?.name || 'Sistem',
      createdAt: new Date().toISOString()
    };

    if (isOfflineFallback) {
      setPurchases((prev) => [newPurchase, ...prev]);
      await addSystemLog('TAMBAH_PEMBELIAN', `Invoice ${newPurchase.invoiceNumber}`);
    } else {
      try {
        await setDoc(doc(db, 'purchases', id), newPurchase);
        await addSystemLog('TAMBAH_PEMBELIAN', `Invoice ${newPurchase.invoiceNumber}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `purchases/${id}`);
      }
    }
  };

  const deletePurchase = (id: string): boolean => {
    const hasPayments = payments.some((pay) => pay.purchaseId === id);
    if (hasPayments) return false;

    const target = purchases.find((p) => p.id === id);
    if (target) {
      if (isOfflineFallback) {
        setPurchases((prev) => prev.filter((p) => p.id !== id));
        addSystemLog('HAPUS_PEMBELIAN', `Invoice ${target.invoiceNumber}`);
      } else {
        deleteDoc(doc(db, 'purchases', id))
          .then(() => {
            addSystemLog('HAPUS_PEMBELIAN', `Invoice ${target!.invoiceNumber}`);
          })
          .catch((error) => {
            handleFirestoreError(error, OperationType.DELETE, `purchases/${id}`);
          });
      }
    }
    return true;
  };

  // Payments CRUD
  const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'receivedBy'>) => {
    const paymentId = `pay-${Date.now()}`;
    const newPayment: Payment = {
      ...paymentData,
      id: paymentId,
      receivedBy: currentUser?.name || 'Sistem',
      createdAt: new Date().toISOString()
    };

    const purchase = purchases.find((p) => p.id === paymentData.purchaseId);
    if (!purchase) return;

    const newPaid = purchase.paidAmount + paymentData.amount;
    const newRemaining = Math.max(0, purchase.total - newPaid);
    let newStatus: PurchaseStatus = 'Belum Lunas';
    if (newPaid >= purchase.total) {
      newStatus = 'Lunas';
    } else if (newPaid > 0) {
      newStatus = 'Sebagian';
    }

    if (isOfflineFallback) {
      setPayments((prev) => [newPayment, ...prev]);
      setPurchases((prev) =>
        prev.map((p) =>
          p.id === purchase.id
            ? { ...p, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus }
            : p
        )
      );
      await addSystemLog('PROSES_BAYAR', `Pelunasan Rp ${paymentData.amount.toLocaleString('id-ID')} untuk ${purchase.invoiceNumber}`);
    } else {
      const batch = writeBatch(db);
      batch.set(doc(db, 'payments', paymentId), newPayment);
      batch.update(doc(db, 'purchases', purchase.id), {
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus
      });

      try {
        await batch.commit();
        await addSystemLog('PROSES_BAYAR', `Pelunasan Rp ${paymentData.amount.toLocaleString('id-ID')} untuk ${purchase.invoiceNumber}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `payments_and_purchases_batch`);
      }
    }
  };

  const deletePayment = async (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;

    const purchase = purchases.find((p) => p.id === payment.purchaseId);
    if (!purchase) return;

    const newPaid = Math.max(0, purchase.paidAmount - payment.amount);
    const newRemaining = purchase.total - newPaid;
    let newStatus: PurchaseStatus = 'Belum Lunas';
    if (newPaid >= purchase.total) {
      newStatus = 'Lunas';
    } else if (newPaid > 0) {
      newStatus = 'Sebagian';
    }

    if (isOfflineFallback) {
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      setPurchases((prev) =>
        prev.map((p) =>
          p.id === purchase.id
            ? { ...p, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus }
            : p
        )
      );
      await addSystemLog('BATAL_BAYAR', `Pembayaran Rp ${payment.amount.toLocaleString('id-ID')} pada ref ${payment.referenceNumber || 'N/A'}`);
    } else {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'payments', paymentId));
      batch.update(doc(db, 'purchases', purchase.id), {
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus
      });

      try {
        await batch.commit();
        await addSystemLog('BATAL_BAYAR', `Pembayaran Rp ${payment.amount.toLocaleString('id-ID')} pada ref ${payment.referenceNumber || 'N/A'}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `payments_and_purchases_delete_batch`);
      }
    }
  };

  // User Management
  const addUser = (userData: Omit<User, 'id'>): boolean => {
    const exists = users.some((u) => u.username.toLowerCase() === userData.username.toLowerCase());
    if (exists) return false;

    const userId = `usr-${Date.now()}`;
    const newUser: User = { ...userData, id: userId };

    if (isOfflineFallback) {
      setUsers((prev) => [...prev, newUser]);
      addSystemLog('TAMBAH_USER', `User ${newUser.username} (${newUser.role})`);
    } else {
      setDoc(doc(db, 'users', userId), newUser)
        .then(() => {
          addSystemLog('TAMBAH_USER', `User ${newUser.username} (${newUser.role})`);
        })
        .catch((error) => {
          handleFirestoreError(error, OperationType.CREATE, `users/${userId}`);
        });
    }
    return true;
  };

  const updateUser = async (updated: User) => {
    if (isOfflineFallback) {
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      await addSystemLog('UBAH_USER', `User ${updated.username} (${updated.role})`);
    } else {
      try {
        await setDoc(doc(db, 'users', updated.id), updated);
        await addSystemLog('UBAH_USER', `User ${updated.username} (${updated.role})`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${updated.id}`);
      }
    }

    if (currentUser && updated.id === currentUser.id) {
      setCurrentUser(updated);
    }
  };

  const deleteUser = (id: string): boolean => {
    if (currentUser?.id === id) return false;
    const target = users.find((u) => u.id === id);

    if (target) {
      if (isOfflineFallback) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        addSystemLog('HAPUS_USER', `User ${target.username} (${target.role})`);
      } else {
        deleteDoc(doc(db, 'users', id))
          .then(() => {
            addSystemLog('HAPUS_USER', `User ${target.username} (${target.role})`);
          })
          .catch((error) => {
            handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
          });
      }
    }
    return true;
  };

  // Reset system sandbox data
  const clearAllData = async () => {
    if (isOfflineFallback) {
      localStorage.removeItem('sh_users');
      localStorage.removeItem('sh_suppliers');
      localStorage.removeItem('sh_purchases');
      localStorage.removeItem('sh_payments');
      localStorage.removeItem('sh_logs');
      setUsers(PREDEFINED_USERS);
      setSuppliers(INITIAL_SUPPLIERS);
      setPurchases(INITIAL_PURCHASES);
      setPayments(INITIAL_PAYMENTS);
      setLogs(INITIAL_LOGS);
      setCurrentUser(PREDEFINED_USERS[0]);
      await addSystemLog('RESET_SISTEM', 'Restore default sandbox databases');
    } else {
      const batch = writeBatch(db);

      users.forEach((u) => batch.delete(doc(db, 'users', u.id)));
      suppliers.forEach((s) => batch.delete(doc(db, 'suppliers', s.id)));
      purchases.forEach((p) => batch.delete(doc(db, 'purchases', p.id)));
      payments.forEach((pay) => batch.delete(doc(db, 'payments', pay.id)));
      logs.forEach((log) => batch.delete(doc(db, 'logs', log.id)));

      PREDEFINED_USERS.forEach((u) => batch.set(doc(db, 'users', u.id), u));
      INITIAL_SUPPLIERS.forEach((s) => batch.set(doc(db, 'suppliers', s.id), s));
      INITIAL_PURCHASES.forEach((p) => batch.set(doc(db, 'purchases', p.id), p));
      INITIAL_PAYMENTS.forEach((pay) => batch.set(doc(db, 'payments', pay.id), pay));
      INITIAL_LOGS.forEach((log) => batch.set(doc(db, 'logs', log.id), log));

      try {
        await batch.commit();
        setCurrentUser(PREDEFINED_USERS[0]);
      } catch (error) {
        console.error("Failed to restore default sample database:", error);
      }
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <StateContext.Provider
      value={{
        currentUser,
        users,
        suppliers,
        purchases,
        payments,
        logs,
        notifications,
        authError,
        isOfflineFallback,
        login,
        logout,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addPurchase,
        deletePurchase,
        addPayment,
        deletePayment,
        addUser,
        updateUser,
        deleteUser,
        clearAllData,
        addSystemLog,
        markNotificationRead,
        markAllNotificationsRead
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useAppState must be used within StateProvider');
  }
  return context;
};
