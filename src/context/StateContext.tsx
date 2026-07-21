/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Supplier, Purchase, Payment, ActivityLog, Notification, UserRole, PurchaseStatus, PaymentMethod } from '../types';
import { INITIAL_SUPPLIERS, INITIAL_PURCHASES, INITIAL_PAYMENTS, INITIAL_LOGS, PREDEFINED_USERS } from '../data';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocFromServer,
  getDocsFromServer
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
  isSyncing: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => boolean;
  addPurchase: (
    purchase: Omit<Purchase, 'id' | 'createdBy' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>,
    options?: {
      applyOverpaymentAmount?: number;
      settleInvoices?: { purchaseId: string; amountToPay: number; paymentMethod: PaymentMethod }[];
    }
  ) => void;
  updatePurchase: (
    id: string,
    purchase: Omit<Purchase, 'id' | 'createdBy' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>,
    options?: {
      applyOverpaymentAmount?: number;
      settleInvoices?: { purchaseId: string; amountToPay: number; paymentMethod: PaymentMethod }[];
    }
  ) => void;
  deletePurchase: (id: string) => boolean;
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt' | 'receivedBy'>) => void;
  updatePayment: (id: string, payment: Omit<Payment, 'id' | 'createdAt' | 'receivedBy'>) => void;
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
  // Sync state tracking
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncCompleted, setIsSyncCompleted] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sh_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null; // Don't auto login as admin on a new web/tab
  });

  // Master lists preloaded from localStorage or defaults to eliminate visual flashing and empty layouts
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sh_users');
    const parsed = saved ? JSON.parse(saved) : PREDEFINED_USERS;
    const list = Array.isArray(parsed) ? parsed.filter((u: User) => !['usr-1', 'usr-2', 'usr-3'].includes(u.id)) : PREDEFINED_USERS;
    PREDEFINED_USERS.forEach((u) => {
      if (!list.some((existing) => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())) {
        list.push(u);
      }
    });
    return list;
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('sh_suppliers');
    const parsed = saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
    return Array.isArray(parsed) ? parsed.filter((s: Supplier) => !['spl-1', 'spl-2', 'spl-3', 'spl-4'].includes(s.id)) : INITIAL_SUPPLIERS;
  });
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem('sh_purchases');
    const parsed = saved ? JSON.parse(saved) : INITIAL_PURCHASES;
    return Array.isArray(parsed) ? parsed.filter((p: Purchase) => !['pur-1', 'pur-2', 'pur-3', 'pur-4'].includes(p.id)) : INITIAL_PURCHASES;
  });
  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('sh_payments');
    const parsed = saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
    return Array.isArray(parsed) ? parsed.filter((pay: Payment) => !['pay-1', 'pay-2'].includes(pay.id)) : INITIAL_PAYMENTS;
  });
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('sh_logs');
    const parsed = saved ? JSON.parse(saved) : INITIAL_LOGS;
    return Array.isArray(parsed) ? parsed.filter((l: ActivityLog) => !['log-1', 'log-2', 'log-3'].includes(l.id)) : INITIAL_LOGS;
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Connectivity and Authentications
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isConnectionChecked, setIsConnectionChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  const checkFirestoreConnection = async () => {
    try {
      await getDocFromServer(doc(db, 'system_config', 'genesis'));
      setIsOfflineFallback(false);
      setAuthError(null);
      return true;
    } catch (error: any) {
      console.warn("Firestore connection check failed, falling back to local mode:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      setAuthError(`firestore-error: ${errMsg}`);
      setIsOfflineFallback(true);
      return false;
    } finally {
      setIsConnectionChecked(true);
    }
  };

  // Initialize Firebase Auth + Connection Validation
  useEffect(() => {
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

  // Listen to window online/offline events for instantaneous reaction
  useEffect(() => {
    const handleOnline = async () => {
      console.log("Network online event detected. Verifying Firestore connection...");
      await checkFirestoreConnection();
    };

    const handleOffline = () => {
      console.log("Network offline event detected. Switching to offline mode.");
      setIsOfflineFallback(true);
      setIsSyncCompleted(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic Connection Re-check when offline as a robust fallback
  useEffect(() => {
    if (!isOfflineFallback) return;

    const interval = setInterval(async () => {
      console.log("Periodic background check: Checking if Firestore connection is restored...");
      try {
        await getDocFromServer(doc(db, 'system_config', 'genesis'));
        console.log("Firestore connection restored in background!");
        setIsOfflineFallback(false);
        setAuthError(null);
      } catch (error) {
        // Still offline, silent ignore
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [isOfflineFallback]);

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

    // Reset sync markers so that a subsequent reconnect can trigger sync again
    setIsSyncCompleted(false);

    const savedUsers = localStorage.getItem('sh_users');
    const uList = savedUsers ? JSON.parse(savedUsers) : PREDEFINED_USERS;
    const filteredUsers = Array.isArray(uList) ? uList.filter((u: User) => !['usr-1', 'usr-2', 'usr-3'].includes(u.id)) : PREDEFINED_USERS;
    PREDEFINED_USERS.forEach((u) => {
      if (!filteredUsers.some((existing) => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())) {
        filteredUsers.push(u);
      }
    });
    setUsers(filteredUsers);

    const savedSuppliers = localStorage.getItem('sh_suppliers');
    const sList = savedSuppliers ? JSON.parse(savedSuppliers) : INITIAL_SUPPLIERS;
    setSuppliers(Array.isArray(sList) ? sList.filter((s: Supplier) => !['spl-1', 'spl-2', 'spl-3', 'spl-4'].includes(s.id)) : INITIAL_SUPPLIERS);

    const savedPurchases = localStorage.getItem('sh_purchases');
    const pList = savedPurchases ? JSON.parse(savedPurchases) : INITIAL_PURCHASES;
    setPurchases(Array.isArray(pList) ? pList.filter((p: Purchase) => !['pur-1', 'pur-2', 'pur-3', 'pur-4'].includes(p.id)) : INITIAL_PURCHASES);

    const savedPayments = localStorage.getItem('sh_payments');
    const payList = savedPayments ? JSON.parse(savedPayments) : INITIAL_PAYMENTS;
    setPayments(Array.isArray(payList) ? payList.filter((pay: Payment) => !['pay-1', 'pay-2'].includes(pay.id)) : INITIAL_PAYMENTS);

    const savedLogs = localStorage.getItem('sh_logs');
    const logList = savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS;
    setLogs(Array.isArray(logList) ? logList.filter((l: ActivityLog) => !['log-1', 'log-2', 'log-3'].includes(l.id)) : INITIAL_LOGS);
  }, [isOfflineFallback]);

  // Deep auto-purge of demo records from localstorage and Firestore
  useEffect(() => {
    const purgeDemoRecords = async () => {
      // 1. Check & reset local storage demo markers
      const cachedUsers = localStorage.getItem('sh_users');
      let needsLocalStorageWipe = false;
      if (cachedUsers) {
        try {
          const parsed = JSON.parse(cachedUsers) as User[];
          if (parsed.some(u => ['usr-1', 'usr-2', 'usr-3'].includes(u.id) || u.email.includes('supplierku.com') || u.name === 'Budi Santoso')) {
            needsLocalStorageWipe = true;
          }
        } catch (e) {
          needsLocalStorageWipe = true;
        }
      }

      if (needsLocalStorageWipe) {
        console.log("Demo user detected in localStorage cache. Cleaning all demo entries...");
        localStorage.removeItem('sh_users');
        localStorage.removeItem('sh_suppliers');
        localStorage.removeItem('sh_purchases');
        localStorage.removeItem('sh_payments');
        localStorage.removeItem('sh_logs');
        localStorage.removeItem('sh_current_user');

        setUsers(PREDEFINED_USERS);
        setSuppliers([]);
        setPurchases([]);
        setPayments([]);
        setLogs([]);
        setCurrentUser(null);
      }

      // 2. Direct online purging of pre-seeded collections in Firestore
      if (isAuthReady && isConnectionChecked && !isOfflineFallback) {
        try {
          const batch = writeBatch(db);
          
          // Old demo keys
          const demoUserIds = ['usr-1', 'usr-2', 'usr-3'];
          const demoSupplierIds = ['spl-1', 'spl-2', 'spl-3', 'spl-4'];
          const demoPurchaseIds = ['pur-1', 'pur-2', 'pur-3', 'pur-4'];
          const demoPaymentIds = ['pay-1', 'pay-2'];
          const demoLogIds = ['log-1', 'log-2', 'log-3'];

          demoUserIds.forEach(id => batch.delete(doc(db, 'users', id)));
          demoSupplierIds.forEach(id => batch.delete(doc(db, 'suppliers', id)));
          demoPurchaseIds.forEach(id => batch.delete(doc(db, 'purchases', id)));
          demoPaymentIds.forEach(id => batch.delete(doc(db, 'payments', id)));
          demoLogIds.forEach(id => batch.delete(doc(db, 'logs', id)));

          // Ensure the actual user always exists as Admin
          batch.set(doc(db, 'users', 'usr-febry'), PREDEFINED_USERS[0]);

          // Update genesis to mark clean slate
          batch.set(doc(db, 'system_config', 'genesis'), {
            initialized: true,
            createdAt: new Date().toISOString(),
            demoPurged: true
          });

          await batch.commit();
          console.log("Firestore database successfully cleared of all demo/sample records.");
        } catch (err) {
          console.warn("Firestore database demo cleanup check skipped or completed previously:", err);
        }
      }
    };

    purgeDemoRecords();
  }, [isAuthReady, isConnectionChecked, isOfflineFallback]);

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

  // ONLINE SYNC: Robust, atomic, single-run offline-to-online sync
  useEffect(() => {
    if (!isAuthReady || !isConnectionChecked || isOfflineFallback) {
      setIsSyncCompleted(false);
      return;
    }

    const runOfflineSync = async () => {
      setIsSyncing(true);
      console.log("Starting offline-to-online data sync...");

      try {
        // 1. Sync Users
        const savedUsersRaw = localStorage.getItem('sh_users');
        if (savedUsersRaw) {
          const savedUsers = JSON.parse(savedUsersRaw) as User[];
          const dbUsersSnap = await getDocsFromServer(collection(db, 'users'));
          const dbUsers: User[] = [];
          dbUsersSnap.forEach(doc => dbUsers.push(doc.data() as User));

          const missingUsers = savedUsers.filter(localItem => 
            !dbUsers.some(dbItem => dbItem.id === localItem.id) &&
            !PREDEFINED_USERS.some(demoItem => demoItem.id === localItem.id)
          );

          if (missingUsers.length > 0) {
            console.log(`Syncing ${missingUsers.length} offline-created users to Firestore...`);
            for (const u of missingUsers) {
              await setDoc(doc(db, 'users', u.id), u);
            }
          }

          const updatedUsers = savedUsers.filter(localItem => {
            const dbItem = dbUsers.find(dbItem => dbItem.id === localItem.id);
            if (!dbItem) return false;
            return (
              localItem.name !== dbItem.name ||
              localItem.email !== dbItem.email ||
              localItem.role !== dbItem.role ||
              localItem.password !== dbItem.password ||
              localItem.username !== dbItem.username
            );
          });

          if (updatedUsers.length > 0) {
            console.log(`Syncing ${updatedUsers.length} offline-modified users to Firestore...`);
            for (const u of updatedUsers) {
              await setDoc(doc(db, 'users', u.id), u);
            }
          }
        }

        // 2. Sync Suppliers
        const savedSuppliersRaw = localStorage.getItem('sh_suppliers');
        if (savedSuppliersRaw) {
          const savedSuppliers = JSON.parse(savedSuppliersRaw) as Supplier[];
          const dbSuppliersSnap = await getDocsFromServer(collection(db, 'suppliers'));
          const dbSuppliers: Supplier[] = [];
          dbSuppliersSnap.forEach(doc => dbSuppliers.push(doc.data() as Supplier));

          const missingSuppliers = savedSuppliers.filter(localItem => 
            !dbSuppliers.some(dbItem => dbItem.id === localItem.id) &&
            !INITIAL_SUPPLIERS.some(demoItem => demoItem.id === localItem.id)
          );

          if (missingSuppliers.length > 0) {
            console.log(`Syncing ${missingSuppliers.length} offline-created suppliers to Firestore...`);
            for (const s of missingSuppliers) {
              await setDoc(doc(db, 'suppliers', s.id), s);
            }
          }

          const updatedSuppliers = savedSuppliers.filter(localItem => {
            const dbItem = dbSuppliers.find(dbItem => dbItem.id === localItem.id);
            if (!dbItem) return false;
            return (
              localItem.name !== dbItem.name ||
              localItem.code !== dbItem.code ||
              localItem.address !== dbItem.address ||
              localItem.phone !== dbItem.phone ||
              localItem.contactPerson !== dbItem.contactPerson ||
              localItem.email !== dbItem.email ||
              localItem.bankName !== dbItem.bankName ||
              localItem.bankAccount !== dbItem.bankAccount ||
              localItem.bankAccountHolder !== dbItem.bankAccountHolder
            );
          });

          if (updatedSuppliers.length > 0) {
            console.log(`Syncing ${updatedSuppliers.length} offline-modified suppliers to Firestore...`);
            for (const s of updatedSuppliers) {
              await setDoc(doc(db, 'suppliers', s.id), s);
            }
          }
        }

        // 3. Sync Purchases
        const savedPurchasesRaw = localStorage.getItem('sh_purchases');
        if (savedPurchasesRaw) {
          const savedPurchases = JSON.parse(savedPurchasesRaw) as Purchase[];
          const dbPurchasesSnap = await getDocsFromServer(collection(db, 'purchases'));
          const dbPurchases: Purchase[] = [];
          dbPurchasesSnap.forEach(doc => dbPurchases.push(doc.data() as Purchase));

          const missingPurchases = savedPurchases.filter(localItem => 
            !dbPurchases.some(dbItem => dbItem.id === localItem.id) &&
            !INITIAL_PURCHASES.some(demoItem => demoItem.id === localItem.id)
          );

          if (missingPurchases.length > 0) {
            console.log(`Syncing ${missingPurchases.length} offline-created purchases to Firestore...`);
            for (const p of missingPurchases) {
              await setDoc(doc(db, 'purchases', p.id), p);
            }
          }

          const updatedPurchases = savedPurchases.filter(localItem => {
            const dbItem = dbPurchases.find(dbItem => dbItem.id === localItem.id);
            if (!dbItem) return false;
            return (
              localItem.paidAmount !== dbItem.paidAmount ||
              localItem.remainingAmount !== dbItem.remainingAmount ||
              localItem.status !== dbItem.status ||
              localItem.invoiceNumber !== dbItem.invoiceNumber ||
              localItem.supplierId !== dbItem.supplierId ||
              localItem.total !== dbItem.total
            );
          });

          if (updatedPurchases.length > 0) {
            console.log(`Syncing ${updatedPurchases.length} offline-modified purchases to Firestore...`);
            for (const p of updatedPurchases) {
              await setDoc(doc(db, 'purchases', p.id), p);
            }
          }
        }

        // 4. Sync Payments
        const savedPaymentsRaw = localStorage.getItem('sh_payments');
        if (savedPaymentsRaw) {
          const savedPayments = JSON.parse(savedPaymentsRaw) as Payment[];
          const dbPaymentsSnap = await getDocsFromServer(collection(db, 'payments'));
          const dbPayments: Payment[] = [];
          dbPaymentsSnap.forEach(doc => dbPayments.push(doc.data() as Payment));

          const missingPayments = savedPayments.filter(localItem => 
            !dbPayments.some(dbItem => dbItem.id === localItem.id) &&
            !INITIAL_PAYMENTS.some(demoItem => demoItem.id === localItem.id)
          );

          if (missingPayments.length > 0) {
            console.log(`Syncing ${missingPayments.length} offline-created payments to Firestore...`);
            for (const pay of missingPayments) {
              await setDoc(doc(db, 'payments', pay.id), pay);
            }
          }

          const updatedPayments = savedPayments.filter(localItem => {
            const dbItem = dbPayments.find(dbItem => dbItem.id === localItem.id);
            if (!dbItem) return false;
            return (
              localItem.amount !== dbItem.amount ||
              localItem.paymentMethod !== dbItem.paymentMethod ||
              localItem.referenceNumber !== dbItem.referenceNumber ||
              localItem.paymentDate !== dbItem.paymentDate ||
              localItem.purchaseId !== dbItem.purchaseId
            );
          });

          if (updatedPayments.length > 0) {
            console.log(`Syncing ${updatedPayments.length} offline-modified payments to Firestore...`);
            for (const pay of updatedPayments) {
              await setDoc(doc(db, 'payments', pay.id), pay);
            }
          }
        }

        // 5. Sync Logs
        const savedLogsRaw = localStorage.getItem('sh_logs');
        if (savedLogsRaw) {
          const savedLogs = JSON.parse(savedLogsRaw) as ActivityLog[];
          const dbLogsSnap = await getDocsFromServer(collection(db, 'logs'));
          const dbLogs: ActivityLog[] = [];
          dbLogsSnap.forEach(doc => dbLogs.push(doc.data() as ActivityLog));

          const missingLogs = savedLogs.filter(localItem => 
            !dbLogs.some(dbItem => dbItem.id === localItem.id) &&
            !INITIAL_LOGS.some(demoItem => demoItem.id === localItem.id)
          );

          if (missingLogs.length > 0) {
            console.log(`Syncing ${missingLogs.length} offline-created logs to Firestore...`);
            for (const log of missingLogs) {
              await setDoc(doc(db, 'logs', log.id), log);
            }
          }
        }

        console.log("Offline-to-online sync completed successfully.");
      } catch (err) {
        console.error("Error during offline sync:", err);
      } finally {
        setIsSyncing(false);
        setIsSyncCompleted(true);
      }
    };

    runOfflineSync();
  }, [isAuthReady, isConnectionChecked, isOfflineFallback]);

  // ONLINE MODE: Real-time Firebase listeners
  useEffect(() => {
    if (!isAuthReady || !isConnectionChecked || isOfflineFallback || !isSyncCompleted) return;

    // 1. Sync Persons
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: User[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as User;
        if (['usr-1', 'usr-2', 'usr-3'].includes(data.id)) {
          // Trigger delete reactively so they can never persist
          deleteDoc(doc(db, 'users', data.id)).catch(() => {});
        } else {
          list.push(data);
        }
      });

      // Ensure all predefined users are seeded to Firestore if they do not exist
      PREDEFINED_USERS.forEach(async (u) => {
        if (!list.some((existing) => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())) {
          try {
            await setDoc(doc(db, 'users', u.id), u);
          } catch (e) {
            console.error("Failed to seed predefined user:", e);
          }
        }
      });

      // Merge predefined users into list state to guarantee they are immediately available
      const mergedUsers = [...list];
      PREDEFINED_USERS.forEach((u) => {
        if (!mergedUsers.some((existing) => existing.id === u.id || existing.email.toLowerCase() === u.email.toLowerCase())) {
          mergedUsers.push(u);
        }
      });

      setUsers(mergedUsers);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // 2. Sync Suppliers
    const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      const list: Supplier[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Supplier;
        if (['spl-1', 'spl-2', 'spl-3', 'spl-4'].includes(data.id)) {
          deleteDoc(doc(db, 'suppliers', data.id)).catch(() => {});
        } else {
          list.push(data);
        }
      });
      setSuppliers(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'suppliers');
    });

    // 3. Sync Purchases
    const unsubPurchases = onSnapshot(collection(db, 'purchases'), (snapshot) => {
      const list: Purchase[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Purchase;
        if (['pur-1', 'pur-2', 'pur-3', 'pur-4'].includes(data.id)) {
          deleteDoc(doc(db, 'purchases', data.id)).catch(() => {});
        } else {
          list.push(data);
        }
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPurchases(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'purchases');
    });

    // 4. Sync Payments
    const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      const list: Payment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Payment;
        if (['pay-1', 'pay-2'].includes(data.id)) {
          deleteDoc(doc(db, 'payments', data.id)).catch(() => {});
        } else {
          list.push(data);
        }
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPayments(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
    });

    // 5. Sync Logs
    const unsubLogs = onSnapshot(collection(db, 'logs'), (snapshot) => {
      const list: ActivityLog[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ActivityLog;
        if (['log-1', 'log-2', 'log-3'].includes(data.id)) {
          deleteDoc(doc(db, 'logs', data.id)).catch(() => {});
        } else {
          list.push(data);
        }
      });
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
  }, [isAuthReady, isConnectionChecked, isOfflineFallback, isSyncCompleted]);

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
  const addPurchase = async (
    purchaseData: Omit<Purchase, 'id' | 'createdBy' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>,
    options?: {
      applyOverpaymentAmount?: number;
      settleInvoices?: { purchaseId: string; amountToPay: number; paymentMethod: PaymentMethod }[];
    }
  ) => {
    const id = `pur-${Date.now()}`;
    const applyOverpaymentAmount = options?.applyOverpaymentAmount || 0;

    const newPurchasePaid = applyOverpaymentAmount;
    const newPurchaseRemaining = purchaseData.total - applyOverpaymentAmount;
    let newPurchaseStatus: PurchaseStatus = 'Belum Lunas';
    if (newPurchasePaid >= purchaseData.total) {
      newPurchaseStatus = 'Lunas';
    } else if (newPurchasePaid > 0) {
      newPurchaseStatus = 'Sebagian';
    }

    const newPurchase: Purchase = {
      ...purchaseData,
      id,
      paidAmount: newPurchasePaid,
      remainingAmount: newPurchaseRemaining,
      status: newPurchaseStatus,
      createdBy: currentUser?.name || 'Sistem',
      createdAt: new Date().toISOString()
    };

    // Prepare lists of updates
    const paymentsToCreate: Payment[] = [];
    const purchasesToUpdate: { id: string; paidAmount: number; remainingAmount: number; status: PurchaseStatus }[] = [];

    // Create payment for the new purchase if there is overpayment applied
    if (applyOverpaymentAmount > 0) {
      paymentsToCreate.push({
        id: `pay-ov-${Date.now()}`,
        purchaseId: id,
        amount: applyOverpaymentAmount,
        paymentDate: purchaseData.purchaseDate,
        paymentMethod: 'Lainnya',
        notes: `Potongan otomatis menggunakan kelebihan dana pembayaran sebelumnya`,
        receivedBy: currentUser?.name || 'Sistem',
        createdAt: new Date().toISOString()
      });

      // Deduct from old overpaid purchases
      let remainingOverpaymentToDeduct = applyOverpaymentAmount;
      const overpaidPurchases = purchases
        .filter(p => p.supplierId === purchaseData.supplierId && p.remainingAmount < 0)
        .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

      overpaidPurchases.forEach((opPurchase, idx) => {
        if (remainingOverpaymentToDeduct <= 0) return;
        const availableOverpayment = -opPurchase.remainingAmount;
        const deductOnThis = Math.min(availableOverpayment, remainingOverpaymentToDeduct);
        if (deductOnThis > 0) {
          const newPaid = opPurchase.paidAmount - deductOnThis;
          const newRemaining = opPurchase.total - newPaid;
          let newStatus: PurchaseStatus = 'Belum Lunas';
          if (newPaid >= opPurchase.total) {
            newStatus = 'Lunas';
          } else if (newPaid > 0) {
            newStatus = 'Sebagian';
          }

          purchasesToUpdate.push({
            id: opPurchase.id,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status: newStatus
          });

          paymentsToCreate.push({
            id: `pay-adj-${Date.now()}-${idx}-${opPurchase.id}`,
            purchaseId: opPurchase.id,
            amount: -deductOnThis,
            paymentDate: purchaseData.purchaseDate,
            paymentMethod: 'Lainnya',
            notes: `Kelebihan dana dipindahkan ke ${newPurchase.invoiceNumber}`,
            receivedBy: currentUser?.name || 'Sistem',
            createdAt: new Date().toISOString()
          });

          remainingOverpaymentToDeduct -= deductOnThis;
        }
      });
    }

    // Process previous invoice settlements
    if (options?.settleInvoices && options.settleInvoices.length > 0) {
      options.settleInvoices.forEach((settle, idx) => {
        const unpaidPurchase = purchases.find(p => p.id === settle.purchaseId);
        if (unpaidPurchase) {
          const newPaid = unpaidPurchase.paidAmount + settle.amountToPay;
          const newRemaining = unpaidPurchase.total - newPaid;
          let newStatus: PurchaseStatus = 'Belum Lunas';
          if (newPaid >= unpaidPurchase.total) {
            newStatus = 'Lunas';
          } else if (newPaid > 0) {
            newStatus = 'Sebagian';
          }

          purchasesToUpdate.push({
            id: unpaidPurchase.id,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status: newStatus
          });

          paymentsToCreate.push({
            id: `pay-settle-${Date.now()}-${idx}-${unpaidPurchase.id}`,
            purchaseId: unpaidPurchase.id,
            amount: settle.amountToPay,
            paymentDate: purchaseData.purchaseDate,
            paymentMethod: settle.paymentMethod,
            notes: `Pelunasan sisa bayar (Input gabungan saat transaksi ${newPurchase.invoiceNumber})`,
            receivedBy: currentUser?.name || 'Sistem',
            createdAt: new Date().toISOString()
          });
        }
      });
    }

    if (isOfflineFallback) {
      setPurchases((prev) => {
        let updated = [newPurchase, ...prev];
        purchasesToUpdate.forEach(up => {
          updated = updated.map(p => p.id === up.id ? { ...p, paidAmount: up.paidAmount, remainingAmount: up.remainingAmount, status: up.status } : p);
        });
        return updated;
      });
      if (paymentsToCreate.length > 0) {
        setPayments((prev) => [...paymentsToCreate, ...prev]);
      }
      await addSystemLog('TAMBAH_PEMBELIAN', `Invoice ${newPurchase.invoiceNumber}`);
    } else {
      const batch = writeBatch(db);
      
      // Add new purchase doc
      batch.set(doc(db, 'purchases', id), newPurchase);

      // Write updates for other purchases
      purchasesToUpdate.forEach(up => {
        batch.update(doc(db, 'purchases', up.id), {
          paidAmount: up.paidAmount,
          remainingAmount: up.remainingAmount,
          status: up.status
        });
      });

      // Write new payments
      paymentsToCreate.forEach(p => {
        batch.set(doc(db, 'payments', p.id), p);
      });

      try {
        await batch.commit();
        await addSystemLog('TAMBAH_PEMBELIAN', `Invoice ${newPurchase.invoiceNumber}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `purchases/${id}_and_batch_payments`);
      }
    }
  };

  const updatePurchase = async (
    id: string,
    purchaseData: Omit<Purchase, 'id' | 'createdBy' | 'createdAt' | 'paidAmount' | 'remainingAmount' | 'status'>,
    options?: {
      applyOverpaymentAmount?: number;
      settleInvoices?: { purchaseId: string; amountToPay: number; paymentMethod: PaymentMethod }[];
    }
  ) => {
    const existing = purchases.find((p) => p.id === id);
    if (!existing) return;

    // Check if it already has payments (for extra security)
    const hasPayments = payments.some((pay) => pay.purchaseId === id) || existing.paidAmount > 0;
    if (hasPayments) {
      alert("Pembelian ini tidak dapat diubah karena sudah ada pembayaran yang tercatat!");
      return;
    }

    const applyOverpaymentAmount = options?.applyOverpaymentAmount || 0;
    const newPurchasePaid = applyOverpaymentAmount;
    const newPurchaseRemaining = purchaseData.total - applyOverpaymentAmount;
    let newPurchaseStatus: PurchaseStatus = 'Belum Lunas';
    if (newPurchasePaid >= purchaseData.total) {
      newPurchaseStatus = 'Lunas';
    } else if (newPurchasePaid > 0) {
      newPurchaseStatus = 'Sebagian';
    }

    const updatedPurchase: Purchase = {
      ...existing,
      ...purchaseData,
      paidAmount: newPurchasePaid,
      remainingAmount: newPurchaseRemaining,
      status: newPurchaseStatus
    };

    // Prepare lists of updates
    const paymentsToCreate: Payment[] = [];
    const purchasesToUpdate: { id: string; paidAmount: number; remainingAmount: number; status: PurchaseStatus }[] = [];

    // Create payment for the updated purchase if there is overpayment applied
    if (applyOverpaymentAmount > 0) {
      paymentsToCreate.push({
        id: `pay-ov-${Date.now()}`,
        purchaseId: id,
        amount: applyOverpaymentAmount,
        paymentDate: purchaseData.purchaseDate,
        paymentMethod: 'Lainnya',
        notes: `Potongan otomatis menggunakan kelebihan dana pembayaran sebelumnya`,
        receivedBy: currentUser?.name || 'Sistem',
        createdAt: new Date().toISOString()
      });

      // Deduct from old overpaid purchases
      let remainingOverpaymentToDeduct = applyOverpaymentAmount;
      const overpaidPurchases = purchases
        .filter(p => p.supplierId === purchaseData.supplierId && p.remainingAmount < 0 && p.id !== id)
        .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

      overpaidPurchases.forEach((opPurchase, idx) => {
        if (remainingOverpaymentToDeduct <= 0) return;
        const availableOverpayment = -opPurchase.remainingAmount;
        const deductOnThis = Math.min(availableOverpayment, remainingOverpaymentToDeduct);
        if (deductOnThis > 0) {
          const newPaid = opPurchase.paidAmount - deductOnThis;
          const newRemaining = opPurchase.total - newPaid;
          let newStatus: PurchaseStatus = 'Belum Lunas';
          if (newPaid >= opPurchase.total) {
            newStatus = 'Lunas';
          } else if (newPaid > 0) {
            newStatus = 'Sebagian';
          }

          purchasesToUpdate.push({
            id: opPurchase.id,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status: newStatus
          });

          paymentsToCreate.push({
            id: `pay-adj-${Date.now()}-${idx}-${opPurchase.id}`,
            purchaseId: opPurchase.id,
            amount: -deductOnThis,
            paymentDate: purchaseData.purchaseDate,
            paymentMethod: 'Lainnya',
            notes: `Kelebihan dana dipindahkan ke ${updatedPurchase.invoiceNumber}`,
            receivedBy: currentUser?.name || 'Sistem',
            createdAt: new Date().toISOString()
          });

          remainingOverpaymentToDeduct -= deductOnThis;
        }
      });
    }

    // Process previous invoice settlements
    if (options?.settleInvoices && options.settleInvoices.length > 0) {
      options.settleInvoices.forEach((settle, idx) => {
        const unpaidPurchase = purchases.find(p => p.id === settle.purchaseId);
        if (unpaidPurchase) {
          const newPaid = unpaidPurchase.paidAmount + settle.amountToPay;
          const newRemaining = unpaidPurchase.total - newPaid;
          let newStatus: PurchaseStatus = 'Belum Lunas';
          if (newPaid >= unpaidPurchase.total) {
            newStatus = 'Lunas';
          } else if (newPaid > 0) {
            newStatus = 'Sebagian';
          }

          purchasesToUpdate.push({
            id: unpaidPurchase.id,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status: newStatus
          });

          paymentsToCreate.push({
            id: `pay-settle-${Date.now()}-${idx}-${unpaidPurchase.id}`,
            purchaseId: unpaidPurchase.id,
            amount: settle.amountToPay,
            paymentDate: purchaseData.purchaseDate,
            paymentMethod: settle.paymentMethod,
            notes: `Pelunasan sisa bayar (Input gabungan saat transaksi ${updatedPurchase.invoiceNumber})`,
            receivedBy: currentUser?.name || 'Sistem',
            createdAt: new Date().toISOString()
          });
        }
      });
    }

    if (isOfflineFallback) {
      setPurchases((prev) => {
        let updated = prev.map((p) => (p.id === id ? updatedPurchase : p));
        purchasesToUpdate.forEach(up => {
          updated = updated.map(p => p.id === up.id ? { ...p, paidAmount: up.paidAmount, remainingAmount: up.remainingAmount, status: up.status } : p);
        });
        return updated;
      });
      if (paymentsToCreate.length > 0) {
        setPayments((prev) => [...paymentsToCreate, ...prev]);
      }
      await addSystemLog('EDIT_PEMBELIAN', `Invoice ${updatedPurchase.invoiceNumber}`);
    } else {
      const batch = writeBatch(db);
      
      // Update existing purchase doc
      batch.set(doc(db, 'purchases', id), updatedPurchase);

      // Write updates for other purchases
      purchasesToUpdate.forEach(up => {
        batch.update(doc(db, 'purchases', up.id), {
          paidAmount: up.paidAmount,
          remainingAmount: up.remainingAmount,
          status: up.status
        });
      });

      // Write new payments
      paymentsToCreate.forEach(p => {
        batch.set(doc(db, 'payments', p.id), p);
      });

      try {
        await batch.commit();
        await addSystemLog('EDIT_PEMBELIAN', `Invoice ${updatedPurchase.invoiceNumber}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `purchases/${id}_and_batch_payments`);
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
    const newRemaining = purchase.total - newPaid;
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

  const updatePayment = async (paymentId: string, updatedData: Omit<Payment, 'id' | 'createdAt' | 'receivedBy'>) => {
    const oldPayment = payments.find((p) => p.id === paymentId);
    if (!oldPayment) return;

    const oldPurchase = purchases.find((p) => p.id === oldPayment.purchaseId);
    const newPurchase = purchases.find((p) => p.id === updatedData.purchaseId);

    if (!oldPurchase || !newPurchase) return;

    const isSamePurchase = oldPayment.purchaseId === updatedData.purchaseId;

    const updatedPayment: Payment = {
      ...oldPayment,
      ...updatedData,
    };

    if (isOfflineFallback) {
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? updatedPayment : p)));

      if (isSamePurchase) {
        setPurchases((prev) =>
          prev.map((p) => {
            if (p.id === oldPurchase.id) {
              const newPaid = Math.max(0, p.paidAmount - oldPayment.amount + updatedData.amount);
              const newRemaining = p.total - newPaid;
              let newStatus: PurchaseStatus = 'Belum Lunas';
              if (newPaid >= p.total) {
                newStatus = 'Lunas';
              } else if (newPaid > 0) {
                newStatus = 'Sebagian';
              }
              return { ...p, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus };
            }
            return p;
          })
        );
      } else {
        setPurchases((prev) =>
          prev.map((p) => {
            if (p.id === oldPurchase.id) {
              const newPaid = Math.max(0, p.paidAmount - oldPayment.amount);
              const newRemaining = p.total - newPaid;
              let newStatus: PurchaseStatus = 'Belum Lunas';
              if (newPaid >= p.total) {
                newStatus = 'Lunas';
              } else if (newPaid > 0) {
                newStatus = 'Sebagian';
              }
              return { ...p, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus };
            }
            if (p.id === newPurchase.id) {
              const newPaid = p.paidAmount + updatedData.amount;
              const newRemaining = p.total - newPaid;
              let newStatus: PurchaseStatus = 'Belum Lunas';
              if (newPaid >= p.total) {
                newStatus = 'Lunas';
              } else if (newPaid > 0) {
                newStatus = 'Sebagian';
              }
              return { ...p, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus };
            }
            return p;
          })
        );
      }

      await addSystemLog('EDIT_BAYAR', `Edit pembayaran Rp ${updatedData.amount.toLocaleString('id-ID')} pada ref ${updatedData.referenceNumber || 'N/A'}`);
    } else {
      const batch = writeBatch(db);
      batch.set(doc(db, 'payments', paymentId), updatedPayment);

      if (isSamePurchase) {
        const newPaid = Math.max(0, oldPurchase.paidAmount - oldPayment.amount + updatedData.amount);
        const newRemaining = oldPurchase.total - newPaid;
        let newStatus: PurchaseStatus = 'Belum Lunas';
        if (newPaid >= oldPurchase.total) {
          newStatus = 'Lunas';
        } else if (newPaid > 0) {
          newStatus = 'Sebagian';
        }
        batch.update(doc(db, 'purchases', oldPurchase.id), {
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          status: newStatus
        });
      } else {
        const newPaidOld = Math.max(0, oldPurchase.paidAmount - oldPayment.amount);
        const newRemainingOld = oldPurchase.total - newPaidOld;
        let newStatusOld: PurchaseStatus = 'Belum Lunas';
        if (newPaidOld >= oldPurchase.total) {
          newStatusOld = 'Lunas';
        } else if (newPaidOld > 0) {
          newStatusOld = 'Sebagian';
        }
        batch.update(doc(db, 'purchases', oldPurchase.id), {
          paidAmount: newPaidOld,
          remainingAmount: newRemainingOld,
          status: newStatusOld
        });

        const newPaidNew = newPurchase.paidAmount + updatedData.amount;
        const newRemainingNew = newPurchase.total - newPaidNew;
        let newStatusNew: PurchaseStatus = 'Belum Lunas';
        if (newPaidNew >= newPurchase.total) {
          newStatusNew = 'Lunas';
        } else if (newPaidNew > 0) {
          newStatusNew = 'Sebagian';
        }
        batch.update(doc(db, 'purchases', newPurchase.id), {
          paidAmount: newPaidNew,
          remainingAmount: newRemainingNew,
          status: newStatusNew
        });
      }

      try {
        await batch.commit();
        await addSystemLog('EDIT_BAYAR', `Edit pembayaran Rp ${updatedData.amount.toLocaleString('id-ID')} pada ref ${updatedData.referenceNumber || 'N/A'}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `payments_and_purchases_edit_batch`);
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
        isSyncing,
        login,
        logout,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addPurchase,
        updatePurchase,
        deletePurchase,
        addPayment,
        updatePayment,
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
