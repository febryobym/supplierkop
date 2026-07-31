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
  marketLocation: string; // e.g., 'Pasar Pare & Pasar Ngadiluwih, Kab. Kediri'
  lastUpdated: string;
  keywords: string[];
}

export const SISKAPERBAPO_KEDIRI_DATA: SiskaperbapoItem[] = [
  {
    id: 'siska-01',
    name: 'Beras Premium',
    category: 'Bahan Pokok',
    unit: 'KG',
    priceKediri: 14800,
    priceMin: 14500,
    priceMax: 15200,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih, Pasar Gringging (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['beras', 'premium', 'panen', 'ciherang', 'rojo lemo']
  },
  {
    id: 'siska-02',
    name: 'Beras Medium',
    category: 'Bahan Pokok',
    unit: 'KG',
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
    id: 'siska-03',
    name: 'Gula Pasir Kristal Putih',
    category: 'Bahan Pokok',
    unit: 'KG',
    priceKediri: 16500,
    priceMin: 16000,
    priceMax: 17000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Gurah, Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['gula', 'pasir', 'gulaku', 'kristal']
  },
  {
    id: 'siska-04',
    name: 'Minyak Goreng MINYAKITA',
    category: 'Minyak & Lemak',
    unit: 'Liter',
    priceKediri: 15700,
    priceMin: 15500,
    priceMax: 16000,
    trend: 'up',
    changeAmount: 200,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['minyakita', 'minyak', 'goreng', 'kita']
  },
  {
    id: 'siska-05',
    name: 'Minyak Goreng Kemasan Premium',
    category: 'Minyak & Lemak',
    unit: 'Liter',
    priceKediri: 19500,
    priceMin: 18500,
    priceMax: 20500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Gringging, Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['minyak', 'kemasan', 'bimoli', 'sania', 'filma', 'tropical', 'sunco', 'fortune']
  },
  {
    id: 'siska-06',
    name: 'Minyak Goreng Curah',
    category: 'Minyak & Lemak',
    unit: 'KG',
    priceKediri: 16200,
    priceMin: 15800,
    priceMax: 16500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['minyak', 'curah']
  },
  {
    id: 'siska-07',
    name: 'Daging Sapi Murni',
    category: 'Daging & Unggas',
    unit: 'KG',
    priceKediri: 118000,
    priceMin: 115000,
    priceMax: 120000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['daging', 'sapi', 'murni', 'karkas', 'has']
  },
  {
    id: 'siska-08',
    name: 'Daging Ayam Ras / Broiler',
    category: 'Daging & Unggas',
    unit: 'KG',
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
    id: 'siska-09',
    name: 'Telur Ayam Ras',
    category: 'Bahan Pokok',
    unit: 'KG',
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
    id: 'siska-10',
    name: 'Tepung Terigu (Protein Tinggi / Cakra)',
    category: 'Tepung & Olahan',
    unit: 'KG',
    priceKediri: 12200,
    priceMin: 11500,
    priceMax: 13000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['tepung', 'terigu', 'cakra', 'kembar', 'protein', 'bogasari']
  },
  {
    id: 'siska-11',
    name: 'Tepung Terigu (Protein Sedang / Segitiga Biru)',
    category: 'Tepung & Olahan',
    unit: 'KG',
    priceKediri: 11000,
    priceMin: 10500,
    priceMax: 11500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['tepung', 'terigu', 'segitiga', 'biru', 'sedang']
  },
  {
    id: 'siska-12',
    name: 'Tepung Tapioka / Kanji',
    category: 'Tepung & Olahan',
    unit: 'KG',
    priceKediri: 12800,
    priceMin: 12000,
    priceMax: 13500,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Gringging, Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['tepung', 'tapioka', 'kanji', 'singkong', 'patia']
  },
  {
    id: 'siska-13',
    name: 'Tepung Maizena / Pati Jagung',
    category: 'Tepung & Olahan',
    unit: 'KG',
    priceKediri: 14000,
    priceMin: 13500,
    priceMax: 14800,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['tepung', 'maizena', 'pati', 'jagung']
  },
  {
    id: 'siska-14',
    name: 'Cabai Rawit Merah',
    category: 'Bumbu Dapur',
    unit: 'KG',
    priceKediri: 38000,
    priceMin: 35000,
    priceMax: 42000,
    trend: 'up',
    changeAmount: 1500,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['cabai', 'cabe', 'rawit', 'sret']
  },
  {
    id: 'siska-15',
    name: 'Cabai Merah Besar',
    category: 'Bumbu Dapur',
    unit: 'KG',
    priceKediri: 28000,
    priceMin: 25000,
    priceMax: 30000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Gurah (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['cabai', 'cabe', 'merah', 'besar']
  },
  {
    id: 'siska-16',
    name: 'Bawang Merah',
    category: 'Bumbu Dapur',
    unit: 'KG',
    priceKediri: 25000,
    priceMin: 23000,
    priceMax: 27000,
    trend: 'down',
    changeAmount: -1000,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['bawang', 'merah', 'probolinggo', 'nganjuk']
  },
  {
    id: 'siska-17',
    name: 'Bawang Putih Honan',
    category: 'Bumbu Dapur',
    unit: 'KG',
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
    id: 'siska-18',
    name: 'Garam Beryodium Halus',
    category: 'Bumbu Dapur',
    unit: 'KG',
    priceKediri: 10000,
    priceMin: 9000,
    priceMax: 11000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['garam', 'yodium', 'halus', 'kapal']
  },
  {
    id: 'siska-19',
    name: 'Penyedap Rasa / Royco Sapi & Ayam',
    category: 'Bumbu Dapur',
    unit: 'KG',
    priceKediri: 38000,
    priceMin: 36000,
    priceMax: 40000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare, Pasar Ngadiluwih (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['royco', 'masako', 'penyedap', 'kaldu', 'sapi', 'ayam']
  },
  {
    id: 'siska-20',
    name: 'Jagung Pipilan Kering',
    category: 'Bahan Pokok',
    unit: 'KG',
    priceKediri: 7500,
    priceMin: 7000,
    priceMax: 8000,
    trend: 'stable',
    changeAmount: 0,
    marketLocation: 'Pasar Pare (Kab. Kediri)',
    lastUpdated: new Date().toISOString().split('T')[0],
    keywords: ['jagung', 'pipilan', 'kering']
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
    for (const kw of item.keywords) {
      if (lower.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > maxScore && score >= 4) {
      maxScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}
