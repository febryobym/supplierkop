/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SiskaperbapoItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  priceKediri: number; // Harga rata-rata Kabupaten Kediri
  priceMin: number;
  priceMax: number;
  trend: 'up' | 'down' | 'stable';
  changeAmount: number;
  marketLocation: string; // e.g., 'Pasar Pare, Pasar Ngadiluwih, Pasar Gringging (Kab. Kediri)'
  lastUpdated: string;
  keywords: string[];
}

export const SISKAPERBAPO_KEDIRI_DATA: SiskaperbapoItem[] = [
  // 1-4: Bahan Pokok - Beras & Gula
  {
    id: 'siska-01',
    name: 'Bawang Merah',
    category: 'Bumbu Dapur',
    unit: 'kg',
    priceKediri: 25000,
    priceMin: 23000,
    priceMax: 27000,
    trend: 'down',
    changeAmount: -1000,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['bawang', 'merah', 'brambang']
  },
  {
    id: 'siska-02',
    name: 'Bawang Putih',
    category: 'Bumbu Dapur',
    unit: 'kg',
    priceKediri: 36000,
    priceMin: 34000,
    priceMax: 38000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Gringging (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['bawang', 'putih', 'honan', 'kating']
  },
  {
    id: 'siska-03',
    name: 'Beras Medium',
    category: 'Bahan Pokok',
    unit: 'kg',
    priceKediri: 12500,
    priceMin: 12000,
    priceMax: 12800,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['beras', 'medium', 'ir64', 'bulog']
  },
  {
    id: 'siska-04',
    name: 'Beras Premium',
    category: 'Bahan Pokok',
    unit: 'kg',
    priceKediri: 14800,
    priceMin: 14500,
    priceMax: 15200,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih, Pasar Gringging (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['beras', 'premium', 'panen', 'ciherang', 'rojo lemo']
  },
  // 5-8: Besi Beton (Bahan Bangunan)
  {
    id: 'siska-05',
    name: 'Besi Beton 10 mm (12/9m)',
    category: 'Bahan Bangunan',
    unit: 'Btg',
    priceKediri: 76000,
    priceMin: 74000,
    priceMax: 78000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare & Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['besi', 'beton', '10', '10mm']
  },
  {
    id: 'siska-06',
    name: 'Besi Beton 12 mm (12/9m)',
    category: 'Bahan Bangunan',
    unit: 'Btg',
    priceKediri: 108000,
    priceMin: 105000,
    priceMax: 112000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare & Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['besi', 'beton', '12', '12mm']
  },
  {
    id: 'siska-07',
    name: 'Besi Beton 6 mm (12/9m)',
    category: 'Bahan Bangunan',
    unit: 'Btg',
    priceKediri: 32000,
    priceMin: 30000,
    priceMax: 34000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare & Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['besi', 'beton', '6', '6mm']
  },
  {
    id: 'siska-08',
    name: 'Besi Beton 8 mm (12/9m)',
    category: 'Bahan Bangunan',
    unit: 'Btg',
    priceKediri: 52000,
    priceMin: 50000,
    priceMax: 54000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare & Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['besi', 'beton', '8', '8mm']
  },
  // Sayur & Cabai
  {
    id: 'siska-09',
    name: 'Buncis',
    category: 'Sayur & Buah',
    unit: 'kg',
    priceKediri: 10000,
    priceMin: 9000,
    priceMax: 11000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Induk Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['buncis', 'sayur']
  },
  {
    id: 'siska-10',
    name: 'Cabe Merah Besar',
    category: 'Bumbu Dapur',
    unit: 'kg',
    priceKediri: 28000,
    priceMin: 25000,
    priceMax: 30000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['cabe', 'cabai', 'merah', 'besar']
  },
  {
    id: 'siska-11',
    name: 'Cabe Merah Keriting',
    category: 'Bumbu Dapur',
    unit: 'kg',
    priceKediri: 32000,
    priceMin: 29000,
    priceMax: 35000,
    trend: 'up',
    changeAmount: 1000,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['cabe', 'cabai', 'keriting']
  },
  {
    id: 'siska-12',
    name: 'Cabe Rawit Merah',
    category: 'Bumbu Dapur',
    unit: 'kg',
    priceKediri: 38000,
    priceMin: 35000,
    priceMax: 42000,
    trend: 'up',
    changeAmount: 1500,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['cabe', 'cabai', 'rawit', 'sret']
  },
  // Daging & Unggas
  {
    id: 'siska-13',
    name: 'Daging Ayam Kampung',
    category: 'Daging & Unggas',
    unit: 'ekor',
    priceKediri: 65000,
    priceMin: 60000,
    priceMax: 70000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Gringging (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['ayam', 'kampung']
  },
  {
    id: 'siska-14',
    name: 'Daging Ayam Ras',
    category: 'Daging & Unggas',
    unit: 'kg',
    priceKediri: 33500,
    priceMin: 32000,
    priceMax: 35000,
    trend: 'down',
    changeAmount: -500,
    marketLocation: 'Pasar Pare, Pasar Gringging (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['daging', 'ayam', 'broiler', 'ras', 'potong', 'fillet']
  },
  {
    id: 'siska-15',
    name: 'Daging Sapi Paha Belakang',
    category: 'Daging & Unggas',
    unit: 'kg',
    priceKediri: 118000,
    priceMin: 115000,
    priceMax: 120000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['daging', 'sapi', 'paha', 'belakang', 'murni', 'has']
  },
  // Garam & Energi
  {
    id: 'siska-16',
    name: 'Garam Beryodium Bata',
    category: 'Bumbu Dapur',
    unit: 'buah',
    priceKediri: 3000,
    priceMin: 2500,
    priceMax: 3500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['garam', 'bata', 'balok']
  },
  {
    id: 'siska-17',
    name: 'Garam Beryodium Halus',
    category: 'Bumbu Dapur',
    unit: 'kg',
    priceKediri: 10000,
    priceMin: 9000,
    priceMax: 11000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['garam', 'halus', 'yodium']
  },
  {
    id: 'siska-18',
    name: 'GAS ELPIGI 3 Kg',
    category: 'Energi & Bahan Bakar',
    unit: '3 Kg',
    priceKediri: 18000,
    priceMin: 18000,
    priceMax: 20000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pangkalan & Agen LPG Kab. Kediri',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['gas', 'elpigi', 'lpg', 'melon', '3kg']
  },
  {
    id: 'siska-19',
    name: 'Gula Kristal Putih',
    category: 'Bahan Pokok',
    unit: 'kg',
    priceKediri: 16500,
    priceMin: 16000,
    priceMax: 17000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Gurah, Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['gula', 'pasir', 'kristal', 'gulaku']
  },
  // Ikan & Perikanan
  {
    id: 'siska-20',
    name: 'Ikan Asin Teri',
    category: 'Ikan & Perikanan',
    unit: 'kg',
    priceKediri: 80000,
    priceMin: 75000,
    priceMax: 85000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['ikan', 'asin', 'teri', 'nasi']
  },
  {
    id: 'siska-21',
    name: 'Ikan Bandeng',
    category: 'Ikan & Perikanan',
    unit: 'kg',
    priceKediri: 32000,
    priceMin: 30000,
    priceMax: 35000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['ikan', 'bandeng']
  },
  {
    id: 'siska-22',
    name: 'Ikan Cakalang',
    category: 'Ikan & Perikanan',
    unit: 'kg',
    priceKediri: 38000,
    priceMin: 35000,
    priceMax: 40000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['ikan', 'cakalang']
  },
  {
    id: 'siska-23',
    name: 'Ikan Kembung',
    category: 'Ikan & Perikanan',
    unit: 'kg',
    priceKediri: 35000,
    priceMin: 32000,
    priceMax: 38000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['ikan', 'kembung']
  },
  {
    id: 'siska-24',
    name: 'Ikan Tongkol',
    category: 'Ikan & Perikanan',
    unit: 'kg',
    priceKediri: 34000,
    priceMin: 32000,
    priceMax: 36000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['ikan', 'tongkol']
  },
  {
    id: 'siska-25',
    name: 'Ikan Tuna',
    category: 'Ikan & Perikanan',
    unit: 'kg',
    priceKediri: 42000,
    priceMin: 40000,
    priceMax: 45000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['ikan', 'tuna']
  },
  // Indomie & Jagung & Kacang
  {
    id: 'siska-26',
    name: 'Indomie Rasa Kari Ayam',
    category: 'Bahan Pokok',
    unit: 'bungkus',
    priceKediri: 3100,
    priceMin: 3000,
    priceMax: 3300,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko & Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['indomie', 'kari', 'ayam', 'mie', 'instan']
  },
  {
    id: 'siska-27',
    name: 'Jagung Pipilan Kering',
    category: 'Bahan Pokok',
    unit: 'kg',
    priceKediri: 7500,
    priceMin: 7000,
    priceMax: 8000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['jagung', 'pipilan', 'kering']
  },
  {
    id: 'siska-28',
    name: 'Kacang Hijau',
    category: 'Kacang-Kacangan',
    unit: 'kg',
    priceKediri: 22000,
    priceMin: 20000,
    priceMax: 24000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['kacang', 'hijau']
  },
  {
    id: 'siska-29',
    name: 'Kacang Kedelai Impor',
    category: 'Kacang-Kacangan',
    unit: 'kg',
    priceKediri: 12500,
    priceMin: 12000,
    priceMax: 13000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['kacang', 'kedelai', 'impor', 'tahu', 'tempe']
  },
  {
    id: 'siska-30',
    name: 'Kacang Kedelai Lokal',
    category: 'Kacang-Kacangan',
    unit: 'kg',
    priceKediri: 13500,
    priceMin: 13000,
    priceMax: 14000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['kacang', 'kedelai', 'lokal']
  },
  {
    id: 'siska-31',
    name: 'Kacang Tanah',
    category: 'Kacang-Kacangan',
    unit: 'kg',
    priceKediri: 28000,
    priceMin: 26000,
    priceMax: 30000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['kacang', 'tanah']
  },
  {
    id: 'siska-32',
    name: 'KAYU BALOK MERANTI (4 X 10)',
    category: 'Bahan Bangunan',
    unit: 'Batang',
    priceKediri: 95000,
    priceMin: 90000,
    priceMax: 100000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Depo Bangunan & Galangan Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['kayu', 'balok', 'meranti', '4x10']
  },
  {
    id: 'siska-33',
    name: 'Kentang',
    category: 'Sayur & Buah',
    unit: 'kg',
    priceKediri: 17000,
    priceMin: 15000,
    priceMax: 18500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['kentang', 'dieng']
  },
  {
    id: 'siska-34',
    name: 'Ketela Pohon',
    category: 'Sayur & Buah',
    unit: 'kg',
    priceKediri: 5000,
    priceMin: 4500,
    priceMax: 5500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['ketela', 'pohon', 'singkong']
  },
  {
    id: 'siska-35',
    name: 'Kol/kubis',
    category: 'Sayur & Buah',
    unit: 'kg',
    priceKediri: 9000,
    priceMin: 8000,
    priceMax: 10000,
    trend: 'down',
    changeAmount: -500,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['kol', 'kubis', 'sayur']
  },
  {
    id: 'siska-36',
    name: 'Minyak Goreng Curah',
    category: 'Minyak & Lemak',
    unit: 'kg',
    priceKediri: 16200,
    priceMin: 15800,
    priceMax: 16500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['minyak', 'curah']
  },
  // Minyak & Paku
  {
    id: 'siska-37',
    name: 'Minyak Goreng Kemasan Premium',
    category: 'Minyak & Lemak',
    unit: 'liter',
    priceKediri: 19500,
    priceMin: 18500,
    priceMax: 20500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Gringging, Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['minyak', 'kemasan', 'premium', 'bimoli', 'sania', 'tropical', 'sunco', 'fortune']
  },
  {
    id: 'siska-38',
    name: 'Minyak Goreng Kemasan Sederhana',
    category: 'Minyak & Lemak',
    unit: 'liter',
    priceKediri: 17000,
    priceMin: 16500,
    priceMax: 17500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['minyak', 'kemasan', 'sederhana', 'hemart', 'siip']
  },
  {
    id: 'siska-39',
    name: 'Minyak Goreng MINYAKITA',
    category: 'Minyak & Lemak',
    unit: 'liter',
    priceKediri: 15700,
    priceMin: 15500,
    priceMax: 16000,
    trend: 'up',
    changeAmount: 200,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['minyakita', 'minyak', 'kita']
  },
  {
    id: 'siska-40',
    name: 'Paku Ukuran 10Cm',
    category: 'Bahan Bangunan',
    unit: 'Kg',
    priceKediri: 20000,
    priceMin: 19000,
    priceMax: 21000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['paku', '10cm', '10']
  },
  {
    id: 'siska-41',
    name: 'Paku Ukuran 2 Cm',
    category: 'Bahan Bangunan',
    unit: 'Kg',
    priceKediri: 22000,
    priceMin: 21000,
    priceMax: 23000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['paku', '2cm', '2']
  },
  {
    id: 'siska-42',
    name: 'Paku Ukuran 3Cm',
    category: 'Bahan Bangunan',
    unit: 'Kg',
    priceKediri: 21000,
    priceMin: 20000,
    priceMax: 22000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['paku', '3cm', '3']
  },
  {
    id: 'siska-43',
    name: 'Paku Ukuran 4Cm',
    category: 'Bahan Bangunan',
    unit: 'Kg',
    priceKediri: 20000,
    priceMin: 19000,
    priceMax: 21000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['paku', '4cm', '4']
  },
  {
    id: 'siska-44',
    name: 'Paku Ukuran 5Cm',
    category: 'Bahan Bangunan',
    unit: 'Kg',
    priceKediri: 20000,
    priceMin: 19000,
    priceMax: 21000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['paku', '5cm', '5']
  },
  {
    id: 'siska-45',
    name: 'Paku Ukuran 7Cm',
    category: 'Bahan Bangunan',
    unit: 'Kg',
    priceKediri: 20000,
    priceMin: 19000,
    priceMax: 21000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['paku', '7cm', '7']
  },
  {
    id: 'siska-46',
    name: 'Papan Meranti (4m X 3cm X 20mm)',
    category: 'Bahan Bangunan',
    unit: 'Lembar',
    priceKediri: 68000,
    priceMin: 65000,
    priceMax: 72000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Galangan Kayu Pare & Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['papan', 'meranti']
  },
  // Pupuk Non Subsidi
  {
    id: 'siska-47',
    name: 'Pupuk KCL Non Subsidi',
    category: 'Pupuk & Pertanian',
    unit: 'Kg',
    priceKediri: 11500,
    priceMin: 11000,
    priceMax: 12000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Kios Pertanian Pare & Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['pupuk', 'kcl']
  },
  {
    id: 'siska-48',
    name: 'Pupuk NPK Non Subsidi',
    category: 'Pupuk & Pertanian',
    unit: 'Kg',
    priceKediri: 14500,
    priceMin: 14000,
    priceMax: 15500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Kios Pertanian Pare & Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['pupuk', 'npk', 'phonska']
  },
  {
    id: 'siska-49',
    name: 'Pupuk SP 35 Non Subsidi',
    category: 'Pupuk & Pertanian',
    unit: 'Kg',
    priceKediri: 10500,
    priceMin: 10000,
    priceMax: 11000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Kios Pertanian Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['pupuk', 'sp35', 'sp-35']
  },
  {
    id: 'siska-50',
    name: 'Pupuk Urea Non Subsidi',
    category: 'Pupuk & Pertanian',
    unit: 'Kg',
    priceKediri: 9500,
    priceMin: 9000,
    priceMax: 10000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Kios Pertanian Kab. Kediri',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['pupuk', 'urea']
  },
  {
    id: 'siska-51',
    name: 'Pupuk ZA Non Subsidi',
    category: 'Pupuk & Pertanian',
    unit: 'Kg',
    priceKediri: 8500,
    priceMin: 8000,
    priceMax: 9000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Kios Pertanian Kab. Kediri',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['pupuk', 'za']
  },
  // Semen (Bahan Bangunan)
  {
    id: 'siska-52',
    name: 'Semen Bosowa',
    category: 'Bahan Bangunan',
    unit: '40Kg',
    priceKediri: 53000,
    priceMin: 51000,
    priceMax: 55000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare & Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['semen', 'bosowa']
  },
  {
    id: 'siska-53',
    name: 'Semen Dynamix',
    category: 'Bahan Bangunan',
    unit: '40 Kg',
    priceKediri: 56000,
    priceMin: 54000,
    priceMax: 58000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare & Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['semen', 'dynamix', 'holcim']
  },
  {
    id: 'siska-54',
    name: 'Semen Gresik',
    category: 'Bahan Bangunan',
    unit: '40 Kg',
    priceKediri: 58000,
    priceMin: 56000,
    priceMax: 60000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare & Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['semen', 'gresik']
  },
  {
    id: 'siska-55',
    name: 'Semen Padang',
    category: 'Bahan Bangunan',
    unit: '40Kg',
    priceKediri: 54000,
    priceMin: 52000,
    priceMax: 56000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['semen', 'padang']
  },
  {
    id: 'siska-56',
    name: 'Semen Tiga Roda',
    category: 'Bahan Bangunan',
    unit: '40 Kg',
    priceKediri: 59000,
    priceMin: 57000,
    priceMax: 61000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare & Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['semen', 'tiga', 'roda']
  },
  {
    id: 'siska-57',
    name: 'Semen Tonasa',
    category: 'Bahan Bangunan',
    unit: '40Kg',
    priceKediri: 52000,
    priceMin: 50000,
    priceMax: 54000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Toko Bangunan Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['semen', 'tonasa']
  },
  // Susu & Telur
  {
    id: 'siska-58',
    name: 'Susu Bubuk Merk Bendera (Instant)',
    category: 'Susu & Olahan',
    unit: '400 gr/dos',
    priceKediri: 44000,
    priceMin: 42000,
    priceMax: 46000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare & Supermarket Kediri',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['susu', 'bubuk', 'bendera', 'frisian', 'flag']
  },
  {
    id: 'siska-59',
    name: 'Susu Bubuk Merk Indomilk (Instant)',
    category: 'Susu & Olahan',
    unit: '400 gr/dos',
    priceKediri: 43000,
    priceMin: 41000,
    priceMax: 45000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare & Supermarket Kediri',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['susu', 'bubuk', 'indomilk']
  },
  {
    id: 'siska-60',
    name: 'Susu Kental Manis Merk Bendera',
    category: 'Susu & Olahan',
    unit: '370 gr/kl',
    priceKediri: 12500,
    priceMin: 12000,
    priceMax: 13000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare & Minimarket Kab. Kediri',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['susu', 'kental', 'manis', 'bendera', 'frisian']
  },
  {
    id: 'siska-61',
    name: 'Susu Kental Manis Merk Indomilk',
    category: 'Susu & Olahan',
    unit: '370 gr/kl',
    priceKediri: 12000,
    priceMin: 11500,
    priceMax: 12500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare & Minimarket Kab. Kediri',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['susu', 'kental', 'manis', 'indomilk']
  },
  {
    id: 'siska-62',
    name: 'Telur Ayam Kampung',
    category: 'Bahan Pokok',
    unit: 'kg',
    priceKediri: 48000,
    priceMin: 45000,
    priceMax: 50000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['telur', 'ayam', 'kampung']
  },
  {
    id: 'siska-63',
    name: 'Telur Ayam Ras',
    category: 'Bahan Pokok',
    unit: 'kg',
    priceKediri: 27000,
    priceMin: 26000,
    priceMax: 28000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih, Pasar Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['telur', 'ayam', 'ras', 'petelur']
  },
  {
    id: 'siska-64',
    name: 'Tepung Terigu',
    category: 'Tepung & Olahan',
    unit: 'kg',
    priceKediri: 11000,
    priceMin: 10500,
    priceMax: 11500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['tepung', 'terigu', 'segitiga', 'cakra', 'sanitasi']
  },
  {
    id: 'siska-65',
    name: 'Tomat',
    category: 'Sayur & Buah',
    unit: 'kg',
    priceKediri: 8000,
    priceMin: 7000,
    priceMax: 9000,
    trend: 'down',
    changeAmount: -1000,
    marketLocation: 'Pasar Induk Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['tomat', 'sayur']
  },
  {
    id: 'siska-66',
    name: 'Triplek (6mm)',
    category: 'Bahan Bangunan',
    unit: 'lembar',
    priceKediri: 72000,
    priceMin: 70000,
    priceMax: 75000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Galangan Kayu & Depo Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['triplek', '6mm']
  },
  {
    id: 'siska-67',
    name: 'Wortel',
    category: 'Sayur & Buah',
    unit: 'kg',
    priceKediri: 11000,
    priceMin: 10000,
    priceMax: 12000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Induk Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['wortel', 'sayur']
  }
];

/**
 * Match a product name against Siskaperbapo items
 */
export function findMatchingSiskaperbapoItem(productName: string): SiskaperbapoItem | undefined {
  if (!productName) return undefined;
  const lower = productName.toLowerCase();

  // 1. Direct keywords match score
  let bestMatch: SiskaperbapoItem | undefined;
  let maxScore = 0;

  for (const item of SISKAPERBAPO_KEDIRI_DATA) {
    let score = 0;

    // Direct name match
    if (lower.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(lower)) {
      score += 10;
    }

    for (const kw of item.keywords) {
      if (lower.includes(kw)) {
        score += kw.length;
      }
    }

    if (score > maxScore && score >= 3) {
      maxScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}
