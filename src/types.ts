export interface TransactionItem {
  description: string;
  category: "pemasukan" | "pengeluaran" | "unknown";
  amount: number | null;
  confidence: "high" | "low";
  flag?: string;
}

export interface AnalysisTotals {
  pemasukan: number;
  pengeluaran: number;
  laba_bersih: number;
}

export interface AnalysisResult {
  period: string;
  business_type: string;
  items: TransactionItem[];
  totals: AnalysisTotals;
}

export interface BlogPost {
  id: string;
  title: string;
  titleEn?: string;
  slug: string;
  category: string;
  categoryEn?: string;
  date: string;
  dateEn?: string;
  readTime: string;
  readTimeEn?: string;
  summary: string;
  summaryEn?: string;
  content: string[];
  contentEn?: string[];
  citation: string;
}

export interface UserState {
  ownerName: string;
  businessName: string;
  businessType: string;
  phone: string;
  email: string;
  location?: string;
  isOnboarded: boolean;
}
