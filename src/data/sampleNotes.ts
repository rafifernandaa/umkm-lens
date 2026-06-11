export interface SampleNote {
  id: string;
  title: string;
  businessType: string;
  period: string;
  recordType: "pemasukan" | "pengeluaran" | "keduanya";
  snippet: string;
  // A mock representation of handwriting in CSS/HTML format
  handwrittenContent: string[];
  // Standard base64 text of a tiny white spacer image, to pass validation to the API if selected
  base64Image: string;
  // The expected result of the analysis
  expectedResult: {
    period: string;
    business_type: string;
    items: Array<{
      description: string;
      category: "pemasukan" | "pengeluaran" | "unknown";
      amount: number | null;
      confidence: "high" | "low";
      flag?: string;
    }>;
    totals: {
      pemasukan: number;
      pengeluaran: number;
      laba_bersih: number;
    };
  };
}

export const sampleNotes: SampleNote[] = [
  {
    id: "makanan-nastar",
    title: "Catatan Buku Kas Nastar Ibu Lilis",
    businessType: "makanan",
    period: "Mei 2026",
    recordType: "keduanya",
    snippet: "Buku harian kue kering lebaran. Ada biaya margarin, terigu, penjualan 15 toples, oven gas, dll.",
    handwrittenContent: [
      "Buku Catatan Mei 2026",
      "-------------------------",
      "1. Penjualan Nastar 15 toples @ 75rb -- Rp 1.125.000",
      "2. Beli Terigu 5 kg -- 75.000 (Pengeluaran)",
      "3. Blue Band 4 kilo -- 180.000 (bahan)",
      "4. Upah isi gas oven -- 25.000",
      "5. Beli mika toples kosong -- 60.000",
      "6. Penjualan Kastangel sisa 3 toples -- 240.000 (cash)",
      "7. Nota kurir kirim gojek -- 45.000",
      "8. Tulisan coret tak terbaca (palsu?) -- ??????"
    ],
    // 1x1 transparent png spacer
    base64Image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    expectedResult: {
      period: "Mei 2026",
      business_type: "makanan",
      items: [
        { description: "Penjualan Kue Nastar (15 toples)", category: "pemasukan", amount: 1125000, confidence: "high" },
        { description: "Sisa Penjualan Kastangel (3 toples)", category: "pemasukan", amount: 240000, confidence: "high" },
        { description: "Beli Tepung Terigu (5 kg)", category: "pengeluaran", amount: 75000, confidence: "high" },
        { description: "Beli Margarin Blue Band (4 kg)", category: "pengeluaran", amount: 180000, confidence: "high" },
        { description: "Refill Gas Oven", category: "pengeluaran", amount: 25000, confidence: "high" },
        { description: "Beli Kemasan Mika Celah Mika Toples", category: "pengeluaran", amount: 60000, confidence: "high" },
        { description: "Biaya Kurir Gojek Ongkos Kirim", category: "pengeluaran", amount: 45000, confidence: "high" },
        { description: "Tulisan tidak terbaca", category: "unknown", amount: null, confidence: "low", flag: "Tulisan buram / coret tinta hitam mendatar - mohon periksa manual." }
      ],
      totals: {
        pemasukan: 1365000,
        pengeluaran: 385000,
        laba_bersih: 980000
      }
    }
  },
  {
    id: "kerajinan-rotan",
    title: "Nota Penjualan Anyaman Pak Made",
    businessType: "kerajinan",
    period: "Juni 2026",
    recordType: "keduanya",
    snippet: "Nota laci kerajinan bambu & rotan. Ada pesanan dari hotel Sanur, beli cat pelitur, anyaman lampion, dll.",
    handwrittenContent: [
      "Anyaman Rotan - Juni 2026",
      "-------------------------",
      "05-Juni: Kirim 10 pcs Lampion Hotel Sanur -- Rp 2.500.000",
      "07-Juni: Beli bahan rotan mentah di gudang -- 800.000",
      "08-Juni: Cat kayu & vernis pelitur bks -- 140.000",
      "10-Juni: Pesenan tas anyam ibu wati -- 450.000",
      "12-Juni: Kuas cat anyaman 3 biji -- 24rb",
      "15-Juni: Uang transport sewa mobil pickup -- 200.000",
      "18-Juni: Tulisan luntur kena air -- ??? (tidak terbaca)"
    ],
    base64Image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    expectedResult: {
      period: "Juni 2026",
      business_type: "kerajinan",
      items: [
        { description: "Kirim 10 pcs Lampion Anyaman (Hotel Sanur)", category: "pemasukan", amount: 2500000, confidence: "high" },
        { description: "Pesanan Tas Anyaman Ibu Wati", category: "pemasukan", amount: 450000, confidence: "high" },
        { description: "Pembelian Bahan Baku Rotan Mentah", category: "pengeluaran", amount: 800000, confidence: "high" },
        { description: "Cat Vernis Kayu & Vernis Pelitur", category: "pengeluaran", amount: 140000, confidence: "high" },
        { description: "Beli Alat Kuas Cat (3 pcs)", category: "pengeluaran", amount: 24000, confidence: "high" },
        { description: "Sewa Ongkos Mobil Pickup / Transport", category: "pengeluaran", amount: 200000, confidence: "high" },
        { description: "Tulisan basah luntur kena kucuran air", category: "unknown", amount: null, confidence: "low", flag: "Bagian kertas basah luntur - mohon masukkan nominal manual." }
      ],
      totals: {
        pemasukan: 2950000,
        pengeluaran: 1164000,
        laba_bersih: 1786000
      }
    }
  },
  {
    id: "warung-kelontong",
    title: "Buku Pembelian Grosir Warung Bu Rahma",
    businessType: "warung",
    period: "Juni 2026",
    recordType: "pengeluaran",
    snippet: "Buku nota supplier logistik sembako kelontong. Kulakan beras, minyak goreng, sewa kulkas es krim dsb.",
    handwrittenContent: [
      "Belanja Grosir Warung Rahma",
      "-------------------------",
      "1. Beras Cianjur 3 karung @ 350rb -- Rp 1.050.000",
      "2. Minyak Goreng Bimoli 2 karton -- 360.000",
      "3. Gula Pasir 10 kilo -- 160.000",
      "4. Rokok Sampoerna Mild 1 bal -- 1.850.000",
      "5. Sabun Cuci Rinso 15 pack -- 195.000",
      "6. Bayar tagihan galon Aqua 10 biji -- 180.000",
      "7. Bagian bawah sobek kena guntingan -- ??????"
    ],
    base64Image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    expectedResult: {
      period: "Juni 2026",
      business_type: "warung",
      items: [
        { description: "Kulakan Beras Cianjur (3 Karung @ 350rb)", category: "pengeluaran", amount: 1050000, confidence: "high" },
        { description: "Minyak Goreng Bimoli (2 Karton)", category: "pengeluaran", amount: 360000, confidence: "high" },
        { description: "Gula Pasir (10 kg Bulk)", category: "pengeluaran", amount: 160000, confidence: "high" },
        { description: "Pembelian Rokok Sampoerna Mild (1 Bal)", category: "pengeluaran", amount: 1850000, confidence: "high" },
        { description: "Kulakan Deterjen Sabun Cuci Rinso (15 pack)", category: "pengeluaran", amount: 195000, confidence: "high" },
        { description: "Isi Ulang Galon Aqua (10 pcs)", category: "pengeluaran", amount: 180000, confidence: "high" },
        { description: "Kertas sobek akibat guntingan kemasan", category: "unknown", amount: null, confidence: "low", flag: "Bagian pinggir sobek terjepit laci - periksa catatan supplier pembanding." }
      ],
      totals: {
        pemasukan: 0,
        pengeluaran: 3895000,
        laba_bersih: -3895000
      }
    }
  }
];
