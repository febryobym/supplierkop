/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { PurchaseItem, SaleTransaction } from '../types';
import { formatRupiah, formatDate, exportToCSV } from '../data';
import { 
  Search, 
  Edit3, 
  FileSpreadsheet, 
  X, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  User, 
  Boxes, 
  Check, 
  AlertCircle,
  PackageCheck,
  RefreshCw,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  ShoppingBag
} from 'lucide-react';

interface FlatSalesItem {
  purchaseId: string;
  invoiceNumber: string;
  purchaseDate: string;
  supplierId: string;
  supplierName: string;
  item: PurchaseItem;
}

interface ManagingSalesModalState {
  purchaseId: string;
  invoiceNumber: string;
  purchaseDate: string;
  supplierName: string;
  item: PurchaseItem;
  salesRecords: SaleTransaction[];
}

export default function Sales() {
  const { purchases, suppliers, updatePurchaseItems } = useAppState();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [salesStatusFilter, setSalesStatusFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Expanded Row State in Table
  const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);

  // Modal State for Managing Transactions for a Lot
  const [managingModal, setManagingModal] = useState<ManagingSalesModalState | null>(null);
  
  // Single Transaction Form State inside Modal
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [txQty, setTxQty] = useState<number>(0);
  const [txUnit, setTxUnit] = useState<string>('Pcs');
  const [txSellingPrice, setTxSellingPrice] = useState<number>(0);
  const [txTotalNominal, setTxTotalNominal] = useState<number>(0);
  const [txSoldTo, setTxSoldTo] = useState<string>('');
  const [txNotes, setTxNotes] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);

  // Notification Banners
  const [successMessage, setSuccessMessage] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');

  const monthsList = [
    { value: 'all', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  const availableYears = Array.from(
    new Set(purchases.map(p => p.purchaseDate.split('-')[0]))
  ).sort((a: string, b: string) => b.localeCompare(a)) as string[];

  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear().toString());
  }

  // Flatten all purchase items from all purchases
  const allSalesItems: FlatSalesItem[] = [];
  purchases.forEach((p) => {
    const sName = suppliers.find(s => s.id === p.supplierId)?.name || 'Supplier N/A';
    p.items.forEach((item) => {
      allSalesItems.push({
        purchaseId: p.id,
        invoiceNumber: p.invoiceNumber,
        purchaseDate: p.purchaseDate,
        supplierId: p.supplierId,
        supplierName: sName,
        item
      });
    });
  });

  // Helper to extract transactions array or legacy data
  const getItemSalesRecords = (item: PurchaseItem): SaleTransaction[] => {
    if (item.salesRecords && item.salesRecords.length > 0) {
      return item.salesRecords;
    }
    if (item.soldQuantity && item.soldQuantity > 0) {
      return [{
        id: 'legacy-1',
        transactionDate: new Date().toISOString().split('T')[0],
        quantity: item.soldQuantity,
        unit: item.soldUnit || item.unit || 'Pcs',
        sellingPrice: item.sellingPrice || item.price,
        totalNominal: item.soldQuantity * (item.sellingPrice || item.price),
        soldTo: item.soldTo || 'Pembeli'
      }];
    }
    return [];
  };

  // Helper to calculate totals for an item
  const getItemSummary = (item: PurchaseItem) => {
    const records = getItemSalesRecords(item);
    const totalSoldQty = records.reduce((sum, r) => sum + r.quantity, 0);
    const totalOmset = records.reduce((sum, r) => sum + r.totalNominal, 0);
    const totalCostOfSold = totalSoldQty * item.price;
    const estimatedProfit = totalOmset - totalCostOfSold;
    const remainingStock = Math.max(0, item.quantity - totalSoldQty);
    
    return {
      records,
      totalSoldQty,
      totalOmset,
      totalCostOfSold,
      estimatedProfit,
      remainingStock,
      txCount: records.length
    };
  };

  // Filter items
  const filteredSalesItems = allSalesItems.filter(({ item, invoiceNumber, purchaseDate, supplierId, supplierName }) => {
    const summary = getItemSummary(item);
    const q = searchQuery.toLowerCase();
    
    const matchesSearch = 
      item.itemName.toLowerCase().includes(q) ||
      invoiceNumber.toLowerCase().includes(q) ||
      supplierName.toLowerCase().includes(q) ||
      summary.records.some(r => r.soldTo.toLowerCase().includes(q) || (r.notes && r.notes.toLowerCase().includes(q)));

    const matchesSupplier = supplierFilter === '' || supplierId === supplierFilter;

    const [year, month] = purchaseDate.split('-');
    const matchesMonth = selectedMonth === 'all' || month === selectedMonth;
    const matchesYear = selectedYear === 'all' || year === selectedYear;

    let matchesStatus = true;
    if (salesStatusFilter === 'unsold') {
      matchesStatus = summary.totalSoldQty === 0;
    } else if (salesStatusFilter === 'partial') {
      matchesStatus = summary.totalSoldQty > 0 && summary.totalSoldQty < item.quantity;
    } else if (salesStatusFilter === 'soldout') {
      matchesStatus = summary.totalSoldQty >= item.quantity;
    }

    return matchesSearch && matchesSupplier && matchesMonth && matchesYear && matchesStatus;
  });

  // Global Dashboard KPI Calculations
  const totalSalesNominal = filteredSalesItems.reduce((sum, { item }) => {
    return sum + getItemSummary(item).totalOmset;
  }, 0);

  const totalSoldVolume = filteredSalesItems.reduce((sum, { item }) => {
    return sum + getItemSummary(item).totalSoldQty;
  }, 0);

  const totalRemainingStock = filteredSalesItems.reduce((sum, { item }) => {
    return sum + getItemSummary(item).remainingStock;
  }, 0);

  const totalEstimatedProfit = filteredSalesItems.reduce((sum, { item }) => {
    return sum + getItemSummary(item).estimatedProfit;
  }, 0);

  // Open Modal to Manage Multi-Transactions for a Lot
  const handleOpenItemSalesModal = (flat: FlatSalesItem) => {
    const { purchaseId, invoiceNumber, purchaseDate, supplierName, item } = flat;
    const currentRecords = getItemSalesRecords(item);

    setManagingModal({
      purchaseId,
      invoiceNumber,
      purchaseDate,
      supplierName,
      item,
      salesRecords: currentRecords.map(r => ({ ...r })) // Deep copy
    });

    // Reset single transaction form inputs
    const existingSold = currentRecords.reduce((sum, r) => sum + r.quantity, 0);
    const remainingToSell = Math.max(0, item.quantity - existingSold);

    setEditingTxId(null);
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxQty(remainingToSell);
    setTxUnit(item.unit || 'Pcs');
    setTxSellingPrice(item.sellingPrice || item.price);
    setTxTotalNominal(remainingToSell * (item.sellingPrice || item.price));
    setTxSoldTo('');
    setTxNotes('');
    setModalErrorMessage('');
  };

  // Form input sync inside Modal
  const handleTxQtyChange = (val: number) => {
    const qty = isNaN(val) ? 0 : val;
    setTxQty(qty);
    setTxTotalNominal(qty * txSellingPrice);
  };

  const handleTxSellingPriceChange = (val: number) => {
    const price = isNaN(val) ? 0 : val;
    setTxSellingPrice(price);
    setTxTotalNominal(txQty * price);
  };

  const handleTxTotalNominalChange = (val: number) => {
    const totalNom = isNaN(val) ? 0 : val;
    setTxTotalNominal(totalNom);
    const calculatedPrice = txQty > 0 ? totalNom / txQty : txSellingPrice;
    setTxSellingPrice(Math.round(calculatedPrice * 100) / 100);
  };

  // Quick margin preset inside modal form
  const applyMarginPreset = (percentage: number) => {
    if (!managingModal) return;
    const costPrice = managingModal.item.price;
    const targetPrice = Math.round(costPrice * (1 + percentage / 100));
    setTxSellingPrice(targetPrice);
    setTxTotalNominal(txQty * targetPrice);
  };

  // Add transaction record to modal list
  const handleAddOrUpdateTxRecord = () => {
    if (!managingModal) return;
    setModalErrorMessage('');

    if (txQty <= 0) {
      setModalErrorMessage('Jumlah barang terjual (Qty) harus lebih dari 0.');
      return;
    }

    if (!txSoldTo.trim()) {
      setModalErrorMessage('Nama pembeli / konsumen (Dijual Kepada) wajib diisi.');
      return;
    }

    // Check total sold vs bought quantity limit
    const existingSumExceptEditing = managingModal.salesRecords
      .filter(r => r.id !== editingTxId)
      .reduce((sum, r) => sum + r.quantity, 0);

    const newTotalSold = existingSumExceptEditing + txQty;
    if (newTotalSold > managingModal.item.quantity) {
      const confirmExceed = window.confirm(
        `Perhatian: Total Qty terjual (${newTotalSold} ${txUnit}) melebihi Qty yang dibeli (${managingModal.item.quantity} ${txUnit}). Apakah Anda yakin ingin melanjutkan?`
      );
      if (!confirmExceed) return;
    }

    if (editingTxId) {
      // Update existing
      setManagingModal(prev => {
        if (!prev) return null;
        return {
          ...prev,
          salesRecords: prev.salesRecords.map(r => {
            if (r.id === editingTxId) {
              return {
                id: editingTxId,
                transactionDate: txDate,
                quantity: txQty,
                unit: txUnit,
                sellingPrice: txSellingPrice,
                totalNominal: txTotalNominal,
                soldTo: txSoldTo.trim(),
                notes: txNotes.trim()
              };
            }
            return r;
          })
        };
      });
      setEditingTxId(null);
    } else {
      // Add new
      const newRecord: SaleTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        transactionDate: txDate,
        quantity: txQty,
        unit: txUnit,
        sellingPrice: txSellingPrice,
        totalNominal: txTotalNominal,
        soldTo: txSoldTo.trim(),
        notes: txNotes.trim()
      };

      setManagingModal(prev => prev ? ({
        ...prev,
        salesRecords: [...prev.salesRecords, newRecord]
      }) : null);
    }

    // Calculate remaining for next entry form
    const currentSumAfterAction = editingTxId 
      ? existingSumExceptEditing + txQty 
      : (managingModal.salesRecords.reduce((sum, r) => sum + r.quantity, 0) + txQty);
    const remainingAfterAction = Math.max(0, managingModal.item.quantity - currentSumAfterAction);

    // Reset form inputs for next transaction
    setEditingTxId(null);
    setTxQty(remainingAfterAction);
    setTxTotalNominal(remainingAfterAction * txSellingPrice);
    setTxSoldTo('');
    setTxNotes('');
  };

  // Edit a transaction inside modal list
  const handleEditTxRecord = (record: SaleTransaction) => {
    setEditingTxId(record.id);
    setTxDate(record.transactionDate || new Date().toISOString().split('T')[0]);
    setTxQty(record.quantity);
    setTxUnit(record.unit || 'Pcs');
    setTxSellingPrice(record.sellingPrice);
    setTxTotalNominal(record.totalNominal);
    setTxSoldTo(record.soldTo);
    setTxNotes(record.notes || '');
    setModalErrorMessage('');
  };

  // Cancel editing transaction inside modal
  const handleCancelEditTx = () => {
    setEditingTxId(null);
    if (!managingModal) return;
    const totalSoldSoFar = managingModal.salesRecords.reduce((sum, r) => sum + r.quantity, 0);
    const rem = Math.max(0, managingModal.item.quantity - totalSoldSoFar);
    setTxQty(rem);
    setTxTotalNominal(rem * txSellingPrice);
    setTxSoldTo('');
    setTxNotes('');
  };

  // Delete transaction record inside modal list
  const handleDeleteTxRecord = (id: string) => {
    if (!managingModal) return;
    setManagingModal(prev => prev ? ({
      ...prev,
      salesRecords: prev.salesRecords.filter(r => r.id !== id)
    }) : null);

    if (editingTxId === id) {
      handleCancelEditTx();
    }
  };

  // Save all multi-transactions back to StateContext
  const handleSaveAllModalSales = async () => {
    if (!managingModal) return;
    setIsSaving(true);
    setModalErrorMessage('');

    try {
      const { purchaseId, item, salesRecords } = managingModal;
      const targetPurchase = purchases.find(p => p.id === purchaseId);

      if (!targetPurchase) {
        throw new Error('Data pembelian tidak ditemukan.');
      }

      // Aggregates for backward compatibility
      const totalSoldQty = salesRecords.reduce((sum, r) => sum + r.quantity, 0);
      const totalOmset = salesRecords.reduce((sum, r) => sum + r.totalNominal, 0);
      const avgSellingPrice = totalSoldQty > 0 ? totalOmset / totalSoldQty : (item.sellingPrice || item.price);
      
      const buyersList = salesRecords.map(r => `${r.soldTo} (${r.quantity} ${r.unit})`).join(', ');

      const updatedItems = targetPurchase.items.map(it => {
        if (it.id === item.id) {
          return {
            ...it,
            salesRecords: salesRecords,
            soldQuantity: totalSoldQty,
            soldUnit: salesRecords.length > 0 ? salesRecords[0].unit : (it.unit || 'Pcs'),
            sellingPrice: Math.round(avgSellingPrice * 100) / 100,
            soldTo: buyersList
          };
        }
        return it;
      });

      await updatePurchaseItems(purchaseId, updatedItems);

      setSuccessMessage(`Berhasil memperbarui data ${salesRecords.length} transaksi penjualan untuk "${item.itemName}". Stok saat ini di List Produk telah diperbarui.`);
      setManagingModal(null);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setModalErrorMessage(err?.message || 'Gagal menyimpan data penjualan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Export CSV with full multi-transaction detail
  const handleExportCSV = () => {
    const headers = [
      'Nama Barang',
      'No. Invoice Pembelian',
      'Tanggal Pembelian',
      'Supplier',
      'Total Qty Dibeli',
      'Satuan Beli',
      'Harga Modal / Unit (IDR)',
      'Total Modal Pembelian (IDR)',
      'No. Transaksi Jual',
      'Tanggal Transaksi Jual',
      'Qty Terjual',
      'Satuan Jual',
      'Harga Jual / Unit (IDR)',
      'Total Omset Transaksi (IDR)',
      'Dijual Kepada (Pembeli)',
      'Catatan Penjualan',
      'Sisa Stok Barang Saat Ini',
      'Laba Kotor Transaksi (IDR)'
    ];

    const data: string[][] = [];

    filteredSalesItems.forEach(({ invoiceNumber, purchaseDate, supplierName, item }) => {
      const summary = getItemSummary(item);

      if (summary.records.length === 0) {
        // Unsold row
        data.push([
          item.itemName,
          invoiceNumber,
          purchaseDate,
          supplierName,
          item.quantity.toString(),
          item.unit,
          item.price.toString(),
          item.total.toString(),
          '-',
          '-',
          '0',
          item.unit,
          '0',
          '0',
          'Belum Terjual',
          '-',
          item.quantity.toString(),
          '0'
        ]);
      } else {
        // Add row for each sales transaction
        summary.records.forEach((tx, idx) => {
          const costForTx = tx.quantity * item.price;
          const profitTx = tx.totalNominal - costForTx;

          data.push([
            item.itemName,
            invoiceNumber,
            purchaseDate,
            supplierName,
            item.quantity.toString(),
            item.unit,
            item.price.toString(),
            item.total.toString(),
            `Tx #${idx + 1}`,
            tx.transactionDate || purchaseDate,
            tx.quantity.toString(),
            tx.unit || item.unit,
            tx.sellingPrice.toString(),
            tx.totalNominal.toString(),
            tx.soldTo || '-',
            tx.notes || '-',
            summary.remainingStock.toString(),
            profitTx.toString()
          ]);
        });
      }
    });

    exportToCSV('Buku_Penjualan_Multi_Transaksi_Rinci', headers, data);
  };

  return (
    <div className="space-y-6">
      {/* Upper Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-sans flex items-center gap-2">
            <span>Buku Penjualan Barang</span>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-150 font-semibold">
              Mendukung Multi-Transaksi & Link Stok
            </span>
          </h1>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            Catat penjualan ke banyak konsumen (multi-transaksi) dari tiap barang pembelian. Stok otomatis terselaraskan dengan List Produk.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 border border-gray-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer shadow-2xs"
            title="Ekspor rincian seluruh transaksi penjualan ke CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Rinci CSV (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Sync Info Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-emerald-50 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 flex items-start gap-3 shadow-2xs">
        <div className="p-2 bg-white rounded-xl shadow-2xs text-indigo-600 shrink-0 mt-0.5">
          <RefreshCw className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-indigo-950">
            Pencatatan Multi-Transaksi & Selaras Stok:
          </p>
          <p className="text-gray-600 leading-relaxed text-[11.5px]">
            Misal Anda membeli <strong className="text-indigo-900 font-semibold">100 Pcs Produk A</strong>, Anda dapat mencatat <strong className="text-indigo-900 font-semibold">Transaksi 1 ke Konsumen B (50 Pcs)</strong> dan <strong className="text-indigo-900 font-semibold">Transaksi 2 ke Konsumen C (50 Pcs)</strong>. Stok tersisa pada tab <strong className="text-indigo-900 font-semibold">List Produk</strong> akan langsung terupdate secara presisi.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 shadow-2xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Omset Penjualan */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-sans">Total Omset Penjualan</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-extrabold text-indigo-950 font-mono">{formatRupiah(totalSalesNominal)}</h3>
            <p className="text-[10px] text-gray-400 mt-1">Akumulasi penerimaan penjualan</p>
          </div>
        </div>

        {/* Card 2: Total Qty Terjual */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-sans">Total Qty Terjual</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-extrabold text-gray-900 font-sans">{totalSoldVolume.toLocaleString('id-ID')} Unit</h3>
            <p className="text-[10px] text-gray-400 mt-1">Jumlah barang yang telah laku</p>
          </div>
        </div>

        {/* Card 3: Total Stok Tersisa Saat Ini */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-sans">Sisa Stok Tersedia</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-extrabold text-emerald-700 font-sans">{totalRemainingStock.toLocaleString('id-ID')} Unit</h3>
            <p className="text-[10px] text-gray-400 mt-1">Stok aktif di List Produk</p>
          </div>
        </div>

        {/* Card 4: Keuntungan Penjualan */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-sans">Estimasi Keuntungan</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-xl font-extrabold font-mono ${totalEstimatedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatRupiah(totalEstimatedProfit)}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">Laba kotor penjualan barang</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari barang, invoice, supplier, atau nama pembeli..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50/60 border border-gray-100 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 shrink-0 flex-wrap items-center">
          {/* Status Penjualan */}
          <select
            value={salesStatusFilter}
            onChange={(e) => setSalesStatusFilter(e.target.value)}
            className="border border-gray-150 rounded-xl px-3 py-2 text-xs bg-white text-gray-700 outline-hidden cursor-pointer"
          >
            <option value="all">Semua Status Penjualan</option>
            <option value="unsold">Belum Terjual (Utuh)</option>
            <option value="partial">Terjual Sebagian</option>
            <option value="soldout">Habis Terjual (0 Stok)</option>
          </select>

          {/* Supplier */}
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="border border-gray-150 rounded-xl px-3 py-2 text-xs bg-white text-gray-700 outline-hidden cursor-pointer"
          >
            <option value="">Semua Supplier</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Month */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-150 rounded-xl px-3 py-2 text-xs bg-white text-gray-700 outline-hidden cursor-pointer"
          >
            {monthsList.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Year */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-150 rounded-xl px-3 py-2 text-xs bg-white text-gray-700 outline-hidden cursor-pointer"
          >
            <option value="all">Semua Tahun</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          {(selectedMonth !== 'all' || selectedYear !== 'all' || supplierFilter !== '' || salesStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setSelectedMonth('all');
                setSelectedYear('all');
                setSupplierFilter('');
                setSalesStatusFilter('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline cursor-pointer pl-1 self-center"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 border-b border-gray-100 font-sans font-semibold">
                <th className="py-3.5 px-4">Barang & Invoice Pembelian</th>
                <th className="py-3.5 px-4 text-right">Qty & Modal Beli</th>
                <th className="py-3.5 px-4 text-center">Status & Rincian Transaksi Jual</th>
                <th className="py-3.5 px-4 text-right">Total Omset Penjualan</th>
                <th className="py-3.5 px-4 text-center">Stok Saat Ini (Sisa)</th>
                <th className="py-3.5 px-4 text-right">Est. Profit</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSalesItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 italic font-sans">
                    Tidak ada data barang yang sesuai dengan filter pencarian ini.
                  </td>
                </tr>
              ) : (
                filteredSalesItems.map((flatItem, index) => {
                  const { purchaseId, invoiceNumber, purchaseDate, supplierName, item } = flatItem;
                  const summary = getItemSummary(item);
                  const itemKey = `${purchaseId}-${item.id}`;
                  const isExpanded = expandedItemKey === itemKey;

                  return (
                    <React.Fragment key={itemKey}>
                      <tr className="hover:bg-gray-50/50 transition-colors">
                        {/* Barang & Invoice */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-gray-900 font-sans text-[13px]">{item.itemName}</div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                            <span className="font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-medium">
                              {invoiceNumber}
                            </span>
                            <span>•</span>
                            <span>{formatDate(purchaseDate)}</span>
                            <span>•</span>
                            <span className="text-gray-600 font-medium">{supplierName}</span>
                          </div>
                        </td>

                        {/* Qty & Modal Beli */}
                        <td className="py-3.5 px-4 align-top text-right font-mono">
                          <div className="font-semibold text-gray-800 text-[11px]">
                            {item.quantity.toLocaleString('id-ID')} {item.unit}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            @ {formatRupiah(item.price)}
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                            Modal: {formatRupiah(item.total)}
                          </div>
                        </td>

                        {/* Status & Rincian Transaksi */}
                        <td className="py-3.5 px-4 align-top text-center">
                          {summary.txCount > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-150">
                                <Layers className="w-3 h-3 text-indigo-600" />
                                {summary.txCount} Transaksi Penjualan
                              </span>
                              
                              <button
                                onClick={() => setExpandedItemKey(isExpanded ? null : itemKey)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 mt-0.5 cursor-pointer"
                              >
                                {isExpanded ? (
                                  <><span>Sembunyikan Rincian</span><ChevronUp className="w-3 h-3" /></>
                                ) : (
                                  <><span>Lihat Rincian ({summary.records.reduce((sum, r) => sum + r.quantity, 0)} {item.unit})</span><ChevronDown className="w-3 h-3" /></>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] text-gray-400 italic">
                              Belum ada transaksi
                            </div>
                          )}
                        </td>

                        {/* Total Omset */}
                        <td className="py-3.5 px-4 align-top text-right font-mono">
                          {summary.totalOmset > 0 ? (
                            <div>
                              <div className="font-extrabold text-emerald-700 text-[12px]">
                                {formatRupiah(summary.totalOmset)}
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                Terjual: {summary.totalSoldQty.toLocaleString('id-ID')} {item.unit}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-300 italic text-[11px]">-</span>
                          )}
                        </td>

                        {/* Stok Saat Ini (Sisa Stok) */}
                        <td className="py-3.5 px-4 align-top text-center">
                          {summary.remainingStock <= 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 text-[11px]">
                              Habis (0 {item.unit})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-[11px]">
                              {summary.remainingStock.toLocaleString('id-ID')} {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Est. Profit */}
                        <td className="py-3.5 px-4 align-top text-right font-mono">
                          {summary.totalSoldQty > 0 ? (
                            <div>
                              <div className={`font-bold text-[11px] ${summary.estimatedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatRupiah(summary.estimatedProfit)}
                              </div>
                              {summary.totalCostOfSold > 0 && (
                                <div className="text-[9px] text-gray-400 mt-0.5">
                                  Margin: {((summary.estimatedProfit / summary.totalCostOfSold) * 100).toFixed(1)}%
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 italic text-[11px]">-</span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 align-top text-center">
                          <button
                            onClick={() => handleOpenItemSalesModal(flatItem)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-md cursor-pointer"
                            title="Kelola / Tambah Transaksi Penjualan Barang Ini"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Kelola Penjualan</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Multi-Transaction Details Row */}
                      {isExpanded && summary.records.length > 0 && (
                        <tr className="bg-slate-50/90 border-b border-gray-150">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                                  <span className="font-bold text-gray-900 text-xs">
                                    Rincian {summary.records.length} Transaksi Penjualan untuk "{item.itemName}"
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono">
                                  Total Terjual: {summary.totalSoldQty} {item.unit} | Omset: {formatRupiah(summary.totalOmset)}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {summary.records.map((tx, txIdx) => (
                                  <div key={tx.id || txIdx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start justify-between text-xs">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-indigo-900 text-[11px]">
                                          Tx #{txIdx + 1}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                          ({tx.transactionDate ? formatDate(tx.transactionDate) : 'Tanggal N/A'})
                                        </span>
                                      </div>
                                      <div className="font-extrabold text-gray-900 text-xs font-mono">
                                        {tx.quantity} {tx.unit || item.unit} @ {formatRupiah(tx.sellingPrice)}
                                      </div>
                                      <div className="flex items-center gap-1 text-[11px] text-gray-700">
                                        <User className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <span>Dijual ke: <strong className="font-semibold text-gray-900">{tx.soldTo || 'Pembeli N/A'}</strong></span>
                                      </div>
                                      {tx.notes && (
                                        <div className="text-[10px] text-gray-500 italic">
                                          Ket: {tx.notes}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right font-mono">
                                      <span className="text-[10px] text-gray-400 block font-sans">Total Omset</span>
                                      <span className="font-extrabold text-emerald-700 text-[12px]">
                                        {formatRupiah(tx.totalNominal)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MULTI-TRANSAKSI PENJUALAN */}
      {managingModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-indigo-950 text-white shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-800 rounded-lg">
                    <Layers className="w-4 h-4 text-indigo-200" />
                  </span>
                  <h3 className="text-md font-bold">Kelola Transaksi Penjualan Barang</h3>
                </div>
                <p className="text-[11px] text-indigo-200 mt-0.5">
                  Invoice: <span className="font-mono">{managingModal.invoiceNumber}</span> ({managingModal.supplierName}) • Tgl Beli: <span className="font-mono">{formatDate(managingModal.purchaseDate)}</span>
                </p>
              </div>
              <button 
                onClick={() => setManagingModal(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Product Lot Overview Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-gray-900">
                    {managingModal.item.itemName}
                  </div>
                  <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                    Modal: {formatRupiah(managingModal.item.price)} / {managingModal.item.unit}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-2 border-t border-slate-200/80 font-mono">
                  <div>
                    <span className="text-[10px] text-gray-400 font-sans block">Total Dibeli:</span>
                    <span className="font-bold text-gray-900">
                      {managingModal.item.quantity} {managingModal.item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-sans block">Total Terjual:</span>
                    <span className="font-bold text-amber-600">
                      {managingModal.salesRecords.reduce((sum, r) => sum + r.quantity, 0)} {managingModal.item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-sans block">Sisa Stok Tersebut:</span>
                    <span className={`font-bold ${
                      (managingModal.item.quantity - managingModal.salesRecords.reduce((sum, r) => sum + r.quantity, 0)) <= 0 
                        ? 'text-rose-600' 
                        : 'text-emerald-700'
                    }`}>
                      {Math.max(0, managingModal.item.quantity - managingModal.salesRecords.reduce((sum, r) => sum + r.quantity, 0))} {managingModal.item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-sans block">Total Omset:</span>
                    <span className="font-extrabold text-emerald-700">
                      {formatRupiah(managingModal.salesRecords.reduce((sum, r) => sum + r.totalNominal, 0))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-sans block">Tgl Pembelian:</span>
                    <span className="font-bold text-gray-800">
                      {formatDate(managingModal.purchaseDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Notification in Modal */}
              {modalErrorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalErrorMessage}</span>
                </div>
              )}

              {/* SECTION A: FORM INPUT FOR ADDING / EDITING A TRANSACTION */}
              <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    <span>{editingTxId ? 'Edit Rincian Transaksi Penjualan' : 'Tambah Transaksi Penjualan Baru'}</span>
                  </h4>
                  {editingTxId && (
                    <button
                      type="button"
                      onClick={handleCancelEditTx}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Tanggal Transaksi */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Tanggal Penjualan
                    </label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  {/* Dijual Kepada Siapa */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Dijual Kepada (Pembeli / Konsumen) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="misal: Konsumen B / Pak Joko / Toko Subur"
                        value={txSoldTo}
                        onChange={(e) => setTxSoldTo(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Qty Terjual & Satuan */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-700">
                        Jumlah Terjual (Qty) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-gray-400">
                        Satuan: {managingModal.item.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={txQty || ''}
                        onChange={(e) => handleTxQtyChange(parseFloat(e.target.value))}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        value={txUnit}
                        onChange={(e) => setTxUnit(e.target.value)}
                        placeholder="Satuan"
                        className="w-24 px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Harga Jual per Unit & Margin Presets */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-gray-700">
                        Harga Jual / Unit (IDR) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-gray-400">
                        Modal: {formatRupiah(managingModal.item.price)}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={txSellingPrice || ''}
                      onChange={(e) => handleTxSellingPriceChange(parseFloat(e.target.value))}
                      placeholder="Harga Jual"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />

                    {/* Quick Margin Buttons */}
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-[9px] text-gray-400">Margin:</span>
                      <button
                        type="button"
                        onClick={() => applyMarginPreset(5)}
                        className="px-1.5 py-0.5 bg-white border border-gray-200 hover:bg-amber-50 text-amber-800 text-[9px] font-medium rounded cursor-pointer"
                      >
                        +5%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyMarginPreset(10)}
                        className="px-1.5 py-0.5 bg-white border border-gray-200 hover:bg-indigo-50 text-indigo-700 text-[9px] font-medium rounded cursor-pointer"
                      >
                        +10%
                      </button>
                      <button
                        type="button"
                        onClick={() => applyMarginPreset(15)}
                        className="px-1.5 py-0.5 bg-white border border-gray-200 hover:bg-emerald-50 text-emerald-700 text-[9px] font-medium rounded cursor-pointer"
                      >
                        +15%
                      </button>
                    </div>
                  </div>

                  {/* Total Omset Transaksi Ini */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Total Omset Transaksi Ini (IDR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={txTotalNominal || ''}
                      onChange={(e) => handleTxTotalNominalChange(parseFloat(e.target.value))}
                      placeholder="Total nominal omset"
                      className="w-full px-3 py-2 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-mono font-extrabold text-emerald-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Add to List Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddOrUpdateTxRecord}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingTxId ? 'Update Transaksi Ini' : 'Tambah Ke Daftar Penjualan'}</span>
                  </button>
                </div>
              </div>

              {/* SECTION B: LIST OF RECORDED TRANSACTIONS FOR THIS LOT */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-800 flex items-center justify-between">
                  <span>Daftar Transaksi Penjualan Terdaftar ({managingModal.salesRecords.length})</span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    Klik Edit / Hapus jika perlu penyesuaian
                  </span>
                </h4>

                {managingModal.salesRecords.length === 0 ? (
                  <div className="p-6 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400 italic text-xs">
                    Belum ada transaksi penjualan yang dimasukkan. Gunakan formulir di atas untuk mencatat transaksi penjualan.
                  </div>
                ) : (
                  <div className="border border-gray-150 rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 border-b border-gray-150 font-semibold">
                          <th className="py-2.5 px-3">Tanggal & Pembeli</th>
                          <th className="py-2.5 px-3 text-right">Qty Terjual</th>
                          <th className="py-2.5 px-3 text-right">Harga Jual / Unit</th>
                          <th className="py-2.5 px-3 text-right">Total Omset</th>
                          <th className="py-2.5 px-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {managingModal.salesRecords.map((rec, idx) => (
                          <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                            {/* Tanggal & Pembeli */}
                            <td className="py-2.5 px-3 align-top">
                              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                                <User className="w-3 h-3 text-indigo-500 shrink-0" />
                                <span>{rec.soldTo || 'Pembeli N/A'}</span>
                              </div>
                              <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                {rec.transactionDate ? formatDate(rec.transactionDate) : 'Tanggal N/A'}
                              </div>
                            </td>

                            {/* Qty Terjual */}
                            <td className="py-2.5 px-3 align-top text-right font-mono font-bold text-gray-800">
                              {rec.quantity} {rec.unit || managingModal.item.unit}
                            </td>

                            {/* Harga Jual / Unit */}
                            <td className="py-2.5 px-3 align-top text-right font-mono text-gray-700">
                              {formatRupiah(rec.sellingPrice)}
                            </td>

                            {/* Total Omset */}
                            <td className="py-2.5 px-3 align-top text-right font-mono font-extrabold text-emerald-700">
                              {formatRupiah(rec.totalNominal)}
                            </td>

                            {/* Aksi */}
                            <td className="py-2.5 px-3 align-top text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleEditTxRecord(rec)}
                                  className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                                  title="Edit Transaksi Ini"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTxRecord(rec.id)}
                                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Hapus Transaksi Ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
              <div className="text-xs text-gray-500">
                Total {managingModal.salesRecords.length} transaksi penjualan
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setManagingModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveAllModalSales}
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Seluruh Data Penjualan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
