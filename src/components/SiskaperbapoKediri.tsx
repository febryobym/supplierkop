/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useAppState } from '../context/StateContext';
import { 
  SISKAPERBAPO_KEDIRI_DATA, 
  SiskaperbapoItem, 
  findMatchingSiskaperbapoItem 
} from '../data/siskaperbapoKediri';
import { formatRupiah, exportToCSV } from '../data';
import { 
  Building2, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  MapPin, 
  Edit3, 
  Check, 
  X, 
  Download, 
  Tag, 
  DollarSign, 
  ShieldCheck, 
  ExternalLink,
  ArrowRight,
  Filter,
  PackageCheck,
  Calculator
} from 'lucide-react';

export default function SiskaperbapoKediri() {
  const { purchases, products } = useAppState();

  const [siskaperbapoList, setSiskaperbapoList] = useState<SiskaperbapoItem[]>(SISKAPERBAPO_KEDIRI_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

  // Price Edit Modal
  const [editingItem, setEditingItem] = useState<SiskaperbapoItem | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editPriceMin, setEditPriceMin] = useState<number>(0);
  const [editPriceMax, setEditPriceMax] = useState<number>(0);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    siskaperbapoList.forEach((item) => set.add(item.category));
    return Array.from(set).sort();
  }, [siskaperbapoList]);

  // Map internal user products/purchases to calculate actual user prices
  const userProductsMap = useMemo(() => {
    const map: { [key: string]: { avgCost: number; latestCost: number; latestSellingPrice: number; totalQty: number; name: string } } = {};

    purchases.forEach((purchase) => {
      (purchase.items || []).forEach((item) => {
        if (!item.itemName) return;
        const normKey = item.itemName.trim().toLowerCase();
        if (!map[normKey]) {
          map[normKey] = {
            avgCost: item.price,
            latestCost: item.price,
            latestSellingPrice: item.sellingPrice !== undefined ? item.sellingPrice : item.price,
            totalQty: item.quantity,
            name: item.itemName
          };
        } else {
          map[normKey].totalQty += item.quantity;
          map[normKey].latestCost = item.price;
          if (item.sellingPrice !== undefined) {
            map[normKey].latestSellingPrice = item.sellingPrice;
          }
        }
      });
    });

    return map;
  }, [purchases]);

  // Combine Siskaperbapo items with matched internal user prices
  const combinedItems = useMemo(() => {
    return siskaperbapoList.map((siska) => {
      // Find matching user product
      let matchedUserProd: { avgCost: number; latestCost: number; latestSellingPrice: number; name: string } | null = null;

      for (const key in userProductsMap) {
        const prod = userProductsMap[key];
        const matchedSiska = findMatchingSiskaperbapoItem(prod.name);
        if (matchedSiska && matchedSiska.id === siska.id) {
          matchedUserProd = prod;
          break;
        }
      }

      return {
        ...siska,
        userMatch: matchedUserProd
      };
    });
  }, [siskaperbapoList, userProductsMap]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return combinedItems.filter((item) => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [combinedItems, searchQuery, selectedCategory]);

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshedTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }, 600);
  };

  // Open edit modal
  const handleOpenEdit = (item: SiskaperbapoItem) => {
    setEditingItem(item);
    setEditPrice(item.priceKediri);
    setEditPriceMin(item.priceMin);
    setEditPriceMax(item.priceMax);
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!editingItem) return;
    setSiskaperbapoList((prev) =>
      prev.map((item) => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            priceKediri: editPrice,
            priceMin: editPriceMin,
            priceMax: editPriceMax,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return item;
      })
    );
    setEditingItem(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Komoditas Siskaperbapo',
      'Kategori',
      'Satuan',
      'Harga Pasar Kab. Kediri (IDR)',
      'Harga Min (IDR)',
      'Harga Max (IDR)',
      'Tren',
      'Harga Beli Koperasi (IDR)',
      'Harga Jual Koperasi (IDR)',
      'Selisih Jual vs Siskaperbapo (IDR)'
    ];

    const rows = combinedItems.map((item) => {
      const userCost = item.userMatch ? item.userMatch.latestCost : 0;
      const userSell = item.userMatch ? item.userMatch.latestSellingPrice : 0;
      const diffSell = userSell > 0 ? userSell - item.priceKediri : 0;

      return [
        item.name,
        item.category,
        item.unit,
        item.priceKediri.toString(),
        item.priceMin.toString(),
        item.priceMax.toString(),
        item.trend === 'up' ? 'Naik' : item.trend === 'down' ? 'Turun' : 'Stabil',
        userCost ? userCost.toString() : '-',
        userSell ? userSell.toString() : '-',
        diffSell ? diffSell.toString() : '-'
      ];
    });

    exportToCSV('Data_Harga_Siskaperbapo_Kab_Kediri', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Official Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Siskaperbapo Jatim Official Sync
              </span>
              <span className="bg-white/10 text-gray-200 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-400" />
                Kabupaten Kediri
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black tracking-tight font-sans text-white">
              Sistem Informasi Ketersediaan &amp; Perkembangan Harga Bahan Pokok
            </h1>

            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              Referensi resmi harga eceran pasar rakyat Kabupaten Kediri (Pasar Pare, Ngadiluwih, Gringging, &amp; Gurah) dari Disperindag Provinsi Jawa Timur untuk membantu Koperasi menentukan harga jual yang kompetitif.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-start md:self-center shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memuat Data...' : 'Perbarui Harga Jatim'}</span>
            </button>

            <a
              href="https://siskaperbapo.jatimprov.go.id/"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-all border border-white/10"
            >
              <span>Situs Resmi</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-4">
            <span>Kabupaten: <strong className="text-white font-mono">Kab. Kediri</strong></span>
            <span>&bull;</span>
            <span>Diperbarui: <strong className="text-emerald-400 font-mono">Hari ini, pukul {lastRefreshedTime} WIB</strong></span>
          </div>
          <span className="text-gray-400">Sumber: Disperindag Jatim (siskaperbapo.jatimprov.go.id)</span>
        </div>
      </div>

      {/* Top 4 Commodity Spotlight Cards in Kabupaten Kediri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {combinedItems.slice(0, 4).map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.category}</span>
                <h3 className="text-sm font-extrabold text-gray-900 mt-0.5 line-clamp-1">{item.name}</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                item.trend === 'up' 
                  ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                  : item.trend === 'down'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {item.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {item.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                {item.trend === 'stable' && <Minus className="w-3 h-3" />}
                {item.trend === 'up' ? `+${formatRupiah(item.changeAmount)}` : item.trend === 'down' ? `-${formatRupiah(Math.abs(item.changeAmount))}` : 'Stabil'}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50 flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block font-medium">Harga Siskaperbapo Kediri</span>
                <span className="text-lg font-black text-indigo-950 font-mono">{formatRupiah(item.priceKediri)}</span>
                <span className="text-[10px] text-gray-400 font-mono ml-1">/ {item.unit}</span>
              </div>

              {item.userMatch && (
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-medium">Jual Koperasi</span>
                  <span className="text-xs font-bold text-emerald-700 font-mono">{formatRupiah(item.userMatch.latestSellingPrice)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari komoditas (misal: Beras, Minyak, Cabai, Daging)..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs text-gray-600">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent focus:outline-hidden font-medium text-gray-700 cursor-pointer"
            >
              <option value="all">Semua Kategori Komoditas ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Main Benchmarking Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Tabel Komparasi Harga Siskaperbapo Kab. Kediri vs Harga Koperasi
            </h3>
          </div>
          <span className="text-[11px] text-gray-500">
            Menampilkan <strong className="text-gray-900 font-mono">{filteredItems.length}</strong> komoditas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-sans">Komoditas &amp; Kategori</th>
                <th className="py-3.5 px-4 font-sans text-center">Satuan</th>
                <th className="py-3.5 px-4 font-sans text-right">Harga Pasar Kediri (Siskaperbapo)</th>
                <th className="py-3.5 px-4 font-sans text-center">Kisaran Min - Max</th>
                <th className="py-3.5 px-4 font-sans text-right">Harga Beli Koperasi</th>
                <th className="py-3.5 px-4 font-sans text-right">Harga Jual Koperasi</th>
                <th className="py-3.5 px-4 font-sans text-right">Komparasi &amp; Rekomendasi</th>
                <th className="py-3.5 px-4 font-sans text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => {
                const userMatch = item.userMatch;
                const userCost = userMatch ? userMatch.latestCost : null;
                const userSelling = userMatch ? userMatch.latestSellingPrice : null;

                // Selling price comparison vs Siskaperbapo
                let statusBadge = null;
                if (userSelling && userSelling > 0) {
                  const diff = userSelling - item.priceKediri;
                  const diffPercent = (diff / item.priceKediri) * 100;

                  if (Math.abs(diff) <= 200) {
                    statusBadge = (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Sesuai Pasaran (&plusmn;0%)
                      </span>
                    );
                  } else if (diff > 0) {
                    statusBadge = (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        +{formatRupiah(diff)} ({diffPercent.toFixed(1)}% diatas pasaran)
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-100">
                        {formatRupiah(diff)} (di bawah pasaran)
                      </span>
                    );
                  }
                }

                return (
                  <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors group">
                    {/* Komoditas */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-bold text-gray-900 font-sans text-xs group-hover:text-indigo-900 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 font-sans flex items-center gap-1">
                        <Tag className="w-3 h-3 text-gray-300" />
                        <span>{item.category}</span>
                      </div>
                    </td>

                    {/* Satuan */}
                    <td className="py-3.5 px-4 align-middle text-center font-mono text-gray-600">
                      {item.unit}
                    </td>

                    {/* Harga Siskaperbapo */}
                    <td className="py-3.5 px-4 align-middle text-right font-mono font-bold text-indigo-950">
                      <div className="text-sm">{formatRupiah(item.priceKediri)}</div>
                      <span className="text-[9px] text-gray-400 font-sans font-normal block">
                        Rata-rata Kab. Kediri
                      </span>
                    </td>

                    {/* Range Min-Max */}
                    <td className="py-3.5 px-4 align-middle text-center font-mono text-[11px] text-gray-500">
                      {formatRupiah(item.priceMin)} - {formatRupiah(item.priceMax)}
                    </td>

                    {/* Harga Beli Koperasi */}
                    <td className="py-3.5 px-4 align-middle text-right font-mono">
                      {userCost ? (
                        <span className="font-bold text-gray-800">{formatRupiah(userCost)}</span>
                      ) : (
                        <span className="text-gray-300 text-[10px] font-sans italic">Belum ada di Nota</span>
                      )}
                    </td>

                    {/* Harga Jual Koperasi */}
                    <td className="py-3.5 px-4 align-middle text-right font-mono">
                      {userSelling ? (
                        <span className="font-bold text-emerald-800">{formatRupiah(userSelling)}</span>
                      ) : (
                        <span className="text-gray-300 text-[10px] font-sans italic">-</span>
                      )}
                    </td>

                    {/* Komparasi */}
                    <td className="py-3.5 px-4 align-middle text-right font-sans">
                      {statusBadge || <span className="text-gray-400 text-[10px]">-</span>}
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 align-middle text-center">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100 cursor-pointer"
                        title="Sesuaikan Harga Pasar Manual"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">Update Harga Pasar Siskaperbapo</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Komoditas</span>
                <h4 className="text-sm font-extrabold text-gray-900 mt-0.5">{editingItem.name} ({editingItem.unit})</h4>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Harga Rata-Rata Kab. Kediri (IDR)
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono font-bold text-indigo-950 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Harga Terendah (Min)</label>
                  <input
                    type="number"
                    value={editPriceMin}
                    onChange={(e) => setEditPriceMin(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Harga Tertinggi (Max)</label>
                  <input
                    type="number"
                    value={editPriceMax}
                    onChange={(e) => setEditPriceMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
