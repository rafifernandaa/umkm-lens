import React, { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  Camera,
  FileSpreadsheet,
  TrendingUp,
  FileDown,
  Upload,
  UserCheck,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileText,
  BarChart2,
  BadgeAlert,
  ArrowUpRight,
  Percent
} from "lucide-react";
import { 
  ResponsiveContainer, 
  ComposedChart,
  Area, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { blogPosts } from "./data/blogData";
import { sampleNotes, SampleNote } from "./data/sampleNotes";
import { AnalysisResult, TransactionItem } from "./types";
import { jsPDF } from "jspdf";

export default function App() {
  // Current view management: "about" | "blog" | "trial" | "citations"
  const [activeTab, setActiveTab] = useState<"about" | "blog" | "trial" | "citations">("about");
  const [lang, setLang] = useState<"id" | "en">("id");
  const t = (idText: string, enText: string) => lang === "id" ? idText : enText;
  
  // Blog detailed post state (null means list view)
  const [selectedPostSlug, setSelectedPostSlug] = useState<string | null>(null);

  // User onboarding state
  const [userProfile, setUserProfile] = useState({
    ownerName: "",
    businessName: "",
    businessType: "makanan",
    phone: "",
    location: "",
    isOnboarded: false,
  });

  // Main interaction state
  const [selectedPreset, setSelectedPreset] = useState<SampleNote | null>(sampleNotes[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [customPeriod, setCustomPeriod] = useState<string>("Juni 2026");
  const [customBusinessType, setCustomBusinessType] = useState<string>("makanan");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [scanResult, setScanResult] = useState<AnalysisResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Credit Readiness States
  const [desiredLoan, setDesiredLoan] = useState<number>(15000000);
  const [loanTenor, setLoanTenor] = useState<number>(12);
  const [useAltData, setUseAltData] = useState<boolean>(false);
  const [completedChecklist, setCompletedChecklist] = useState({
    rekeningTerpisah: false,
    catatanKonsisten: false,
    nibTerdaftar: false,
  });

  // Banker Decision & SLIK States for Hackathon
  const [underwriteStatus, setUnderwriteStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [approvedLoanAmount, setApprovedLoanAmount] = useState<number>(15000000);
  const [underwriterNotes, setUnderwriterNotes] = useState<string>("");
  const [showSlikDetails, setShowSlikDetails] = useState<boolean>(false);

  useEffect(() => {
    setApprovedLoanAmount(desiredLoan);
  }, [desiredLoan]);

  // Multi-Period Historical Records (Hackathon Demo Data pre-filled)
  const [historicalPeriods, setHistoricalPeriods] = useState<AnalysisResult[]>(() => {
    const saved = localStorage.getItem("umkmlens_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        period: "Maret 2026",
        business_type: "makanan",
        items: [
          { description: "Penjualan Kue Nastar (10 toples)", category: "pemasukan", amount: 750000, confidence: "high" },
          { description: "Penjualan Kastangel (5 toples)", category: "pemasukan", amount: 400000, confidence: "high" },
          { description: "Pesanan Katering Kue Ibu RT", category: "pemasukan", amount: 1950000, confidence: "high" },
          { description: "Belanja Tepung & Margarin", category: "pengeluaran", amount: 650000, confidence: "high" },
          { description: "Beli Kemasan Toples Kosong", category: "pengeluaran", amount: 250000, confidence: "high" },
          { description: "Upah Harian Asisten Kue", category: "pengeluaran", amount: 400000, confidence: "high" },
          { description: "Biaya Listrik Oven & Dapur", category: "pengeluaran", amount: 200000, confidence: "high" }
        ],
        totals: {
          pemasukan: 3100000,
          pengeluaran: 1500000,
          laba_status: "ok", // custom placeholder
          laba_bersih: 1600000
        } as any
      },
      {
        period: "April 2026",
        business_type: "makanan",
        items: [
          { description: "Pre-order Lebaran Nastar (30 toples)", category: "pemasukan", amount: 2250000, confidence: "high" },
          { description: "Kastangel & Putri Salju (15 toples)", category: "pemasukan", amount: 1200000, confidence: "high" },
          { description: "Penjualan Hampers Hari Raya", category: "pemasukan", amount: 1050000, confidence: "high" },
          { description: "Kulakan Tepung Terigu, Gula & Telur", category: "pengeluaran", amount: 950000, confidence: "high" },
          { description: "Bumbu & Butter Wijsman", category: "pengeluaran", amount: 550000, confidence: "high" },
          { description: "Pembelian Dus Box Hampers Premium", category: "pengeluaran", amount: 300000, confidence: "high" },
          { description: "Ongkir Gojek Kirim Sampel", category: "pengeluaran", amount: 100000, confidence: "high" },
          { description: "Upah Harian Asisten Lebaran", category: "pengeluaran", amount: 200000, confidence: "high" }
        ],
        totals: {
          pemasukan: 4500000,
          pengeluaran: 2100000,
          laba_bersih: 2400000
        }
      }
    ];
  });

  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0);
  const [userRole, setUserRole] = useState<"merchant" | "banker">("merchant");

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem("umkmlens_history", JSON.stringify(historicalPeriods));
  }, [historicalPeriods]);

  // Selected active data (either the temporary scan result OR the selected historical period)
  const isViewingScan = scanResult !== null;
  const activeResult = isViewingScan ? scanResult : historicalPeriods[selectedPeriodIndex];

  // Calculate average performance across all saved periods
  const avgMonthlyOmset = historicalPeriods.length > 0
    ? Math.round(historicalPeriods.reduce((sum, p) => sum + p.totals.pemasukan, 0) / historicalPeriods.length)
    : 0;

  const avgMonthlyBeban = historicalPeriods.length > 0
    ? Math.round(historicalPeriods.reduce((sum, p) => sum + p.totals.pengeluaran, 0) / historicalPeriods.length)
    : 0;

  const avgMonthlyLaba = historicalPeriods.length > 0
    ? Math.round(historicalPeriods.reduce((sum, p) => sum + p.totals.laba_bersih, 0) / historicalPeriods.length)
    : 0;

  // Recalculate credit metrics based on averages (which is what a bank actually evaluates!)
  const estCicilan = Math.round((desiredLoan / loanTenor) + (desiredLoan * 0.005));
  const dscr = estCicilan > 0 ? (avgMonthlyLaba / estCicilan) : 0;
  const margin = avgMonthlyOmset > 0 ? (avgMonthlyLaba / avgMonthlyOmset) : 0;

  // Composite Score (0-100) based on historical performance
  let score = 0;
  if (historicalPeriods.length > 0) {
    // DSCR score (max 40)
    if (dscr >= 2.0) score += 40;
    else if (dscr >= 1.5) score += 35;
    else if (dscr >= 1.2) score += 30;
    else if (dscr >= 1.0) score += 25;
    else if (dscr >= 0.7) score += 15;
    else if (dscr >= 0.5) score += 10;
    else score += 5;

    // Profit margin (max 20)
    if (margin >= 0.40) score += 20;
    else if (margin >= 0.25) score += 15;
    else if (margin >= 0.10) score += 10;
    else if (margin > 0) score += 5;

    // History longevity check: 3 or more months gives a massive reliability bonus (max 15 pts)
    if (historicalPeriods.length >= 3) score += 15;
    else if (historicalPeriods.length === 2) score += 10;
    else score += 5;

    // Profile completeness (max 10)
    if (userProfile.ownerName) score += 2;
    if (userProfile.businessName) score += 2;
    if (userProfile.phone) score += 2;
    if (userProfile.location) score += 2;
    if (userProfile.businessType) score += 2;

    // Checklist tasks (max 10)
    if (completedChecklist.rekeningTerpisah) score += 3;
    if (completedChecklist.nibTerdaftar) score += 3;
    if (completedChecklist.catatanKonsisten) score += 4;

    // Alt Data (max 5)
    if (useAltData) score += 5;
  }
  if (score > 100) score = 100;

  // Banker rating classification
  let creditGrade: "A" | "B" | "C" = "C";
  let gradeLabel = "RISIKO DEFAULT TINGGI";
  let gradeColor = "text-red-700 bg-red-50 border-red-500";
  let gradeBadgeColor = "bg-red-600 text-white border-red-600 text-xs";

  if (historicalPeriods.length > 0) {
    if (dscr >= 1.4 && score >= 75) {
      creditGrade = "A";
      gradeLabel = "RISIKO RENDAH (Grade A)";
      gradeColor = "text-emerald-700 bg-emerald-50 border-emerald-500";
      gradeBadgeColor = "bg-emerald-600 text-white border-emerald-600 text-xs";
    } else if (dscr >= 1.0 && score >= 50) {
      creditGrade = "B";
      gradeLabel = "RISIKO SEDANG (Grade B)";
      gradeColor = "text-amber-700 bg-amber-50 border-amber-500";
      gradeBadgeColor = "bg-amber-500 text-white border-amber-500 text-xs";
    }
  }

  // Reference for scrolling to try app
  const tryAppSectionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interactive growth simulator values
  const [sliderRevenue, setSliderRevenue] = useState<number>(3500000);
  const [sliderExpense, setSliderExpense] = useState<number>(1800000);
  const [growthTimeline, setGrowthTimeline] = useState<any[]>([]);

  // Calculate real-time simulator data
  useEffect(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"];
    const baseProfit = sliderRevenue - sliderExpense;
    const generatedTimeline = months.map((m, idx) => {
      // simulate realistic growth with gentle variance
      const multiplier = 1 + idx * 0.08;
      const rev = Math.round(sliderRevenue * multiplier);
      const exp = Math.round(sliderExpense * (1 + idx * 0.03));
      const prof = rev - exp;
      // efficiency gaps
      const traditionalLoss = Math.round(prof * 0.15); // leaking cash due to bad logging
      const analyticGain = Math.round(prof * 0.12); // gains from optimal pricing
      return {
        month: m,
        Omset: rev,
        Beban: exp,
        LabaDenganAnalitik: prof + analyticGain,
        LabaTradisional: prof - traditionalLoss,
      };
    });
    setGrowthTimeline(generatedTimeline);
  }, [sliderRevenue, sliderExpense]);

  // Handle preset selection
  const handleSelectPreset = (preset: SampleNote) => {
    setSelectedPreset(preset);
    setUploadedImage(null);
    setUploadedFileName("");
    // Autofill context inputs with preset values
    setCustomPeriod(preset.period);
    setCustomBusinessType(preset.businessType);
  };

  // Handle manual file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Gambar terlalu besar! File maksimal adalah 10MB.");
        return;
      }
      setUploadedFileName(file.name);
      setSelectedPreset(null);
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit flow for AI Extraction Or Mock Preset Activation
  const handleStartAnalysis = async () => {
    setFormError(null);
    if (!userProfile.isOnboarded) {
      setFormError("Silakan daftarkan identitas UMKM Anda terlebih dahulu di form onboarding.");
      // smooth scroll to form
      const formEl = document.getElementById("onboarding-form");
      if (formEl) formEl.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setIsProcessing(true);
    setScanResult(null);

    try {
      if (selectedPreset) {
        // Run immersive simulated typing/scanning animation step-by-step
        setProcessingStep("Membaca tekstur kertas dan goresan pulpen...");
        await new Promise((r) => setTimeout(r, 1200));
        setProcessingStep("Menormalkan nilai mata uang lokal ('rb', 'k', 'juta')...");
        await new Promise((r) => setTimeout(r, 1000));
        setProcessingStep("Klasifikasi pos pemasukan & pengeluaran berbasis AI...");
        await new Promise((r) => setTimeout(r, 900));
        setProcessingStep("Menghitung total rincian kas dan estimasi laba bersih...");
        await new Promise((r) => setTimeout(r, 700));

        // Inject the high-fidelity preset results
        const expected = selectedPreset.expectedResult;
        setScanResult({
          period: customPeriod || expected.period,
          business_type: customBusinessType || expected.business_type,
          items: JSON.parse(JSON.stringify(expected.items)), // deep copy
          totals: { ...expected.totals }
        });
      } else if (uploadedImage) {
        // Real API processing
        setProcessingStep("Menghubungkan ke Gemini Vision API Hub...");
        
        const payload = {
          image: uploadedImage,
          businessType: customBusinessType,
          period: customPeriod,
          recordType: "keduanya",
          lang
        };

        const response = await fetch("/api/analyze-record", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Gagal memproses gambar Anda.");
        }

        const data: AnalysisResult = await response.json();
        setScanResult(data);
      } else {
        throw new Error("Mohon unggah gambar atau pilih salah satu preset catatan.");
      }
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan pada sistem pemrosesan.");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  // Handle user corrections offline on extracted items
  const handleUpdateItemAmount = (index: number, newAmount: number) => {
    if (!scanResult) return;
    const updatedItems = [...scanResult.items];
    updatedItems[index].amount = newAmount;
    
    // Recalculate totals
    let pemasukan = 0;
    let pengeluaran = 0;
    updatedItems.forEach((item) => {
      if (item.category === "pemasukan") {
        pemasukan += item.amount || 0;
      } else if (item.category === "pengeluaran") {
        pengeluaran += item.amount || 0;
      }
    });

    setScanResult({
      ...scanResult,
      items: updatedItems,
      totals: {
        pemasukan,
        pengeluaran,
        laba_bersih: pemasukan - pengeluaran
      }
    });
  };

  const handleUpdateItemDesc = (index: number, newDesc: string) => {
    if (!scanResult) return;
    const updatedItems = [...scanResult.items];
    updatedItems[index].description = newDesc;
    setScanResult({
      ...scanResult,
      items: updatedItems
    });
  };

  const handleUpdateItemCategory = (index: number, newCat: "pemasukan" | "pengeluaran" | "unknown") => {
    if (!scanResult) return;
    const updatedItems = [...scanResult.items];
    updatedItems[index].category = newCat;

    // Recalculate totals
    let pemasukan = 0;
    let pengeluaran = 0;
    updatedItems.forEach((item) => {
      if (item.category === "pemasukan") {
        pemasukan += item.amount || 0;
      } else if (item.category === "pengeluaran") {
        pengeluaran += item.amount || 0;
      }
    });

    setScanResult({
      ...scanResult,
      items: updatedItems,
      totals: {
        pemasukan,
        pengeluaran,
        laba_bersih: pemasukan - pengeluaran
      }
    });
  };

  // Unified updater for active result (updates either scanResult or active history period)
  const updateActiveData = (updated: AnalysisResult) => {
    if (isViewingScan) {
      setScanResult(updated);
    } else {
      const updatedPeriods = [...historicalPeriods];
      updatedPeriods[selectedPeriodIndex] = updated;
      setHistoricalPeriods(updatedPeriods);
    }
  };

  const handleSaveToHistory = () => {
    if (!scanResult) return;
    
    // Check if period already exists in history
    const existingIndex = historicalPeriods.findIndex(
      p => p.period.toLowerCase() === scanResult.period.toLowerCase()
    );
    
    let updatedPeriods = [...historicalPeriods];
    if (existingIndex >= 0) {
      updatedPeriods[existingIndex] = scanResult;
    } else {
      updatedPeriods.push(scanResult);
    }
    
    setHistoricalPeriods(updatedPeriods);
    setScanResult(null);
    setSelectedPeriodIndex(existingIndex >= 0 ? existingIndex : updatedPeriods.length - 1);
  };

  const handleTriggerNewScan = () => {
    setScanResult({
      period: "Mei 2026",
      business_type: userProfile.businessType || "makanan",
      items: [],
      totals: { pemasukan: 0, pengeluaran: 0, laba_bersih: 0 }
    });
    setTimeout(() => {
      const el = document.getElementById("anchor-scan");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Trigger registration flow with simple single-click mock registration
  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile.ownerName || !userProfile.businessName) {
      alert("Mohon isi Nama Pemilik dan Nama Usaha Anda.");
      return;
    }
    setUserProfile({
      ...userProfile,
      isOnboarded: true
    });
    // Smooth transition to scan utility
    setTimeout(() => {
      const scanAnchor = document.getElementById("anchor-scan");
      if (scanAnchor) {
        scanAnchor.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Instantly Onboard user with random dummy credentials for single-click onboarding
  const handleQuickOnboard = () => {
    // Switch to the trial application tab immediately
    setActiveTab("trial");

    // Populate the onboarding state
    setUserProfile({
      ownerName: "Ibu Lilis Suranti",
      businessName: "Dapur Makmur Nastar",
      businessType: "makanan",
      phone: "081234567890",
      location: "Jagakarsa, Jakarta Selatan",
      isOnboarded: true
    });

    // Pick the first default handwritten workbook preset
    const preset = sampleNotes[0];
    setSelectedPreset(preset);
    setUploadedImage(null);
    setUploadedFileName("");
    setCustomPeriod(preset.period);
    setCustomBusinessType(preset.businessType);

    // Scroll down smoothly to the scanning area
    setTimeout(() => {
      const scanAnchor = document.getElementById("anchor-scan");
      if (scanAnchor) {
        scanAnchor.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);

    // Run the immersive simulated typing/scanning animation live
    setIsProcessing(true);
    setScanResult(null);

    const triggerDemoScan = async () => {
      try {
        setProcessingStep("Membaca tekstur kertas dan goresan pulpen...");
        await new Promise((r) => setTimeout(r, 1000));
        setProcessingStep("Menormalkan nilai mata uang lokal ('rb', 'k', 'juta')...");
        await new Promise((r) => setTimeout(r, 800));
        setProcessingStep("Klasifikasi pos pemasukan & pengeluaran berbasis AI...");
        await new Promise((r) => setTimeout(r, 700));
        setProcessingStep("Menghitung total rincian kas dan estimasi laba bersih...");
        await new Promise((r) => setTimeout(r, 600));

        const expected = preset.expectedResult;
        setScanResult({
          period: preset.period,
          business_type: preset.businessType,
          items: JSON.parse(JSON.stringify(expected.items)),
          totals: { ...expected.totals }
        });
      } catch (err: any) {
        setFormError(err.message || "Terjadi kesalahan pada sistem pemrosesan.");
      } finally {
        setIsProcessing(false);
        setProcessingStep("");
      }
    };

    setTimeout(() => {
      triggerDemoScan();
    }, 350);
  };

  // Trigger download PDF or Print layout
  const handleExportPDF = () => {
    const dataToExport = activeResult;
    if (!dataToExport) {
      alert(lang === "id" ? "Belum ada data analisis untuk diekspor!" : "No analysis data to export!");
      return;
    }
    const scanResult = dataToExport;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Margins
      const marginX = 15;
      let posY = 15;

      // 1. Raw Tectonic Title Header Box
      doc.setFillColor(17, 24, 39); // Solid dark back
      doc.rect(marginX, posY, 180, 22, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text(lang === "id" ? "UMKM LENS — REKAPITULASI LAPORAN FINANSIAL" : "UMKM LENS — FINANCIAL REPORT SUMMARY", marginX + 6, posY + 8);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text((lang === "id" ? "LAPORAN REKAPITULASI TRANSAKSI UMKM / PERIODE: " : "MSME TRANSACTION SUMMARY REPORT / PERIOD: ") + scanResult.period.toUpperCase(), marginX + 6, posY + 14);
      doc.setFont("Courier", "italic");
      doc.text(lang === "id" ? "UMKM Lens — Prototipe" : "UMKM Lens — Prototype", marginX + 6, posY + 18);

      posY += 26;

      // 1.5 Accuracy Caveat Banner
      doc.setFillColor(249, 250, 251); // Light grey neutral background
      doc.rect(marginX, posY, 180, 8, "F");
      doc.setDrawColor(229, 231, 235); // Neutral border
      doc.setLineWidth(0.25);
      doc.rect(marginX, posY, 180, 8, "S");

      doc.setTextColor(75, 85, 99); // Medium-dark gray
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(lang === "id" ? "PENTING: Laporan ini berbasis foto catatan unggahan pemilik usaha. Akurasi rekapitulasi bergantung penuh pada kualitas & keterbacaan tulisan tangan asli." : "IMPORTANT: This report is based on the uploaded photo of the merchant's handwritten records. Accuracy depends entirely on quality & legibility.", marginX + 3, posY + 5.5);

      posY += 13;

      // 2. Metadata Profile Information Block (Two Columns)
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.rect(marginX, posY, 180, 28); // Outline box

      // Inner divider line
      doc.line(marginX + 90, posY, marginX + 90, posY + 28);

      // Metadata Text
      doc.setTextColor(17, 24, 39);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text(lang === "id" ? "PROFIL PEMILIK USAHA" : "MERCHANT PROFILE", marginX + 5, posY + 5);

      const sectorTranslation: Record<string, {id: string, en: string}> = {
        makanan: { id: "Makanan", en: "Food" },
        ritel: { id: "Ritel/Warung", en: "Retail/Shop" },
        jasa: { id: "Jasa", en: "Services" },
        kerajinan: { id: "Kerajinan/Kreatif", en: "Craft/Creative" }
      };
      const typeLower = scanResult.business_type.toLowerCase();
      const sectorObj = sectorTranslation[typeLower] || { id: scanResult.business_type, en: scanResult.business_type };
      const sectorName = lang === "id" ? sectorObj.id : sectorObj.en;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`${lang === "id" ? "Nama Pemilik" : "Owner Name"}: ${userProfile.ownerName || (lang === "id" ? "Sobat UMKM" : "MSME Owner")}`, marginX + 5, posY + 10);
      doc.text(`${lang === "id" ? "Nama Toko" : "Business Name"}: ${userProfile.businessName || (lang === "id" ? "Toko Kelontong Handal" : "Trusted Merchant")}`, marginX + 5, posY + 14.5);
      doc.text(`${lang === "id" ? "Sektor Bisnis" : "Business Sector"}: ${lang === "id" ? "Usaha" : ""} ${sectorName}`, marginX + 5, posY + 19);
      doc.text(`${lang === "id" ? "Lokasi Usaha" : "Business Location"}: ${userProfile.location || (lang === "id" ? "[belum diisi]" : "[not specified]")}`, marginX + 5, posY + 23.5);

      doc.setFont("Helvetica", "bold");
      doc.text(lang === "id" ? "INFORMASI DOKUMEN" : "DOCUMENT INFORMATION", marginX + 95, posY + 5);
      doc.setFont("Helvetica", "normal");
      doc.text(`${lang === "id" ? "Tujuan Laporan: Ringkasan Catatan Keuangan Pribadi" : "Document Purpose: Personal Financial Summary"}`, marginX + 95, posY + 10);
      doc.text(`${lang === "id" ? "Tanggal Cetak" : "Date Printed"}: ${new Date().toLocaleDateString(lang === "id" ? "id-ID" : "en-US")}`, marginX + 95, posY + 16);
      doc.text(`${lang === "id" ? "Periode Laporan" : "Report Period"}: ${scanResult.period}`, marginX + 95, posY + 22);

      posY += 36;

      // 3. Transactions List Table Headers
      doc.setFillColor(243, 244, 246); // Table header bg
      doc.rect(marginX, posY, 180, 8, "F");
      doc.setLineWidth(0.2);
      doc.line(marginX, posY, marginX + 180, posY);
      doc.line(marginX, posY + 8, marginX + 180, posY + 8);

      doc.setTextColor(17, 24, 39);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(lang === "id" ? "DESKRIPSI TRANSAKSI" : "TRANSACTION DESCRIPTION", marginX + 4, posY + 5.5);
      doc.text(lang === "id" ? "KATEGORI" : "CATEGORY", marginX + 95, posY + 5.5);
      doc.text(lang === "id" ? "NOMINAL TRANSAKSI (IDR)" : "TRANSACTION AMOUNT (IDR)", marginX + 135, posY + 5.5);

      posY += 8;

      // 4. Fill Items Row by Row
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);

      scanResult.items.forEach((item, idx) => {
        // Page overflow check (Max posY on current page before overflow)
        if (posY > 250) {
          doc.addPage();
          posY = 20;

          // Repeat minimalist header for subsequent pages
          doc.setFillColor(17, 24, 39);
          doc.rect(marginX, posY, 180, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("Helvetica", "bold");
          doc.text(lang === "id" ? "DESKRIPSI TRANSAKSI" : "TRANSACTION DESCRIPTION", marginX + 4, posY + 5.5);
          doc.text(lang === "id" ? "KATEGORI" : "CATEGORY", marginX + 95, posY + 5.5);
          doc.text(lang === "id" ? "NOMINAL TRANSAKSI (IDR)" : "TRANSACTION AMOUNT (IDR)", marginX + 135, posY + 5.5);
          posY += 8;
          doc.setFont("Helvetica", "normal");
        }

        const isUnknown = item.category === "unknown" || item.confidence === "low";

        // Draw soft warning row background
        if (isUnknown) {
          doc.setFillColor(255, 251, 235); // #fffbeb soft light amber warning
          doc.rect(marginX, posY, 180, 8, "F");
        }

        // Draw light baseline divider
        doc.setDrawColor(229, 231, 235);
        doc.line(marginX, posY + 8, marginX + 180, posY + 8);

        // Print Transaction Column values
        if (isUnknown) {
          doc.setFont("Helvetica", "italic");
          doc.setTextColor(180, 83, 9); // amber-700
          
          const descText = lang === "id" ? "1 item tidak terbaca - jumlah tidak diketahui (periksa catatan asli)" : "1 unreadable item - amount unknown (check original note)";
          doc.text(descText, marginX + 4, posY + 5.5);
          
          doc.text(lang === "id" ? "KENDALA BACA" : "READ ERROR", marginX + 95, posY + 5.5);
          doc.text(lang === "id" ? "Tidak Diketahui" : "Unknown", marginX + 135, posY + 5.5);
          
          doc.setFont("Helvetica", "normal"); // restore default
        } else {
          doc.setTextColor(17, 24, 39);
          const descText = item.description.length > 50 ? item.description.substring(0, 48) + "..." : item.description;
          doc.text(descText, marginX + 4, posY + 5.5);
          
          // Category representation
          let categoryLabel = item.category.toUpperCase();
          if (lang === "en") {
            if (item.category === "pemasukan") categoryLabel = "INCOME";
            else if (item.category === "pengeluaran") categoryLabel = "EXPENSE";
          }
          if (item.category === "pemasukan") {
            doc.setTextColor(22, 101, 52); // green text
          } else if (item.category === "pengeluaran") {
            doc.setTextColor(185, 28, 28); // red text
          } else {
            doc.setTextColor(107, 114, 128); // gray text
          }
          doc.text(categoryLabel, marginX + 95, posY + 5.5);

          // Amount formatted properly
          doc.setTextColor(17, 24, 39);
          const amountStr = `Rp ${(item.amount || 0).toLocaleString("id-ID")}`;
          doc.text(amountStr, marginX + 135, posY + 5.5);
        }

        posY += 8;
      });

      // Back to default border color
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(0.4);
      doc.line(marginX, posY, marginX + 180, posY); // Bottom of table line

      posY += 10;

      // Check overflow for Summary Box
      if (posY > 230) {
        doc.addPage();
        posY = 20;
      }

      // 5. High-Contrast Financial Totals Card Box (Tectonic design)
      doc.setFillColor(249, 250, 251); // Off white grey card
      doc.rect(marginX, posY, 180, 28, "F");
      doc.rect(marginX, posY, 180, 28, "S"); // Solid border

      // Columns dividers inside total box
      doc.setLineWidth(0.25);
      doc.line(marginX + 60, posY, marginX + 60, posY + 28);
      doc.line(marginX + 120, posY, marginX + 120, posY + 28);

      // Total Pemasukan Block
      doc.setTextColor(55, 65, 81);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(lang === "id" ? "TOTAL PEMASUKAN TERPINDAI" : "TOTAL SCANNED INCOME", marginX + 4, posY + 6);
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(11);
      doc.text(`Rp ${scanResult.totals.pemasukan.toLocaleString("id-ID")}`, marginX + 4, posY + 15);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(lang === "id" ? "Arus Masuk Terpindai" : "Scanned Cash Inflow", marginX + 4, posY + 22);

      // Total Pengeluaran Block
      doc.setTextColor(55, 65, 81);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(lang === "id" ? "TOTAL PENGELUARAN (KELUAR)" : "TOTAL SCANNED EXPENSES", marginX + 64, posY + 6);
      doc.setTextColor(185, 28, 28);
      doc.setFontSize(11);
      doc.text(`Rp ${scanResult.totals.pengeluaran.toLocaleString("id-ID")}`, marginX + 64, posY + 15);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(lang === "id" ? "Arus Keluar Terpindai" : "Scanned Cash Outflow", marginX + 64, posY + 22);

      // Laba Bersih Block
      doc.setTextColor(17, 24, 39);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(lang === "id" ? "ESTIMASI LABA BERSIH" : "ESTIMATED NET PROFIT", marginX + 124, posY + 6);
      doc.setTextColor(14, 116, 144); // blueprint color
      doc.setFontSize(11.5);
      doc.text(`Rp ${scanResult.totals.laba_bersih.toLocaleString("id-ID")}`, marginX + 124, posY + 15);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(lang === "id" ? "Estimasi Laba Bersih" : "Estimated Net Profit", marginX + 124, posY + 22);

      posY += 36;

      // Check overflow for AI Interpretation Text Box
      if (posY > 235) {
        doc.addPage();
        posY = 20;
      }

      // 6. Natural Language Summary interpret box (Blue light tint box)
      doc.setFillColor(239, 246, 255); // #eff6ff Sky tint
      doc.rect(marginX, posY, 180, 28, "F");
      doc.setDrawColor(186, 230, 253); // Sky-200 border
      doc.rect(marginX, posY, 180, 28, "S");

      doc.setTextColor(14, 116, 144);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(lang === "id" ? "DISCLAIMER DAN RINGKASAN DATA" : "DISCLAIMER & DATA SUMMARY", marginX + 5, posY + 5.5);

      doc.setTextColor(55, 65, 81);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      
      const textDisclaimer = lang === "id" 
        ? `Dokumen ini merangkum data transaksi yang diunggah oleh pemilik usaha untuk periode ${scanResult.period}. Estimasi laba bersih dihitung berdasarkan data yang tersedia dan dapat dijadikan bahan referensi pribadi dalam mempersiapkan pengajuan pembiayaan. Dokumen ini bukan penilaian kredit resmi dan tidak menjamin persetujuan pinjaman dari lembaga keuangan manapun.`
        : `This document summarizes the transaction data uploaded by the business owner for the period ${scanResult.period}. The estimated net profit is calculated based on available data and can be used as a personal reference when preparing for a financing application. This document is not an official credit assessment and does not guarantee loan approval from any financial institution.`;
      const splitDisclaimer = doc.splitTextToSize(textDisclaimer, 170);
      doc.text(splitDisclaimer, marginX + 5, posY + 10.5);

      posY += 34;

      // 7. Footer & Legal Disclaimers (Always placed safely at bottom / relative posY)
      if (posY > 270) {
        doc.addPage();
        posY = 20;
      }

      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.2);
      doc.line(marginX, posY, marginX + 180, posY);

      doc.setTextColor(156, 163, 175);
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(6.5);
      
      const legalText1 = lang === "id" ? "Catatan: Laporan ini dirancang secara otomatis menggunakan pengolahan dokumen pintar berbasis teknologi kecerdasan buatan (AI) yang membaca foto tulisan tangan dari berkas fisik tulisan tangan." : "Note: This report is automatically generated using intelligent document processing based on artificial intelligence (AI) reading handwriting photos from physical documents.";
      const legalText2 = lang === "id" ? "Dokumen ini murni berfungsi sebagai alat bantu perapian catatan finansial pribadi pemilik usaha, bukan merupakan dokumen perpajakan resmi maupun laporan keuangan teraudit." : "This document serves purely as a tool to organize the personal financial records of the business owner and is not an official tax document or audited financial statement.";
      const legalText3 = lang === "id" ? `Dihasilkan oleh: Sistem Prototipe UMKM Lens Indonesia | ${new Date().toLocaleDateString("id-ID")}` : `Generated by: UMKM Lens Indonesia Prototype System | ${new Date().toLocaleDateString("en-US")}`;

      doc.text(legalText1, marginX, posY + 4.5);
      doc.text(legalText2, marginX, posY + 8);
      doc.text(legalText3, marginX, posY + 11.5);

      // --- PAGE 2: CREDIT READINESS SCORECARD ---
      doc.addPage();
      let pg2Y = 20;

      // Header for Page 2
      doc.setFillColor(14, 116, 144); // Blueprint theme color
      doc.rect(marginX, pg2Y, 180, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text(lang === "id" ? "LAMPIRAN B: ANALISIS KELAYAKAN KREDIT ALTERNATIF (PRE-ASSESSMENT)" : "ANNEX B: ALTERNATIVE CREDIT ELIGIBILITY ANALYSIS (PRE-ASSESSMENT)", marginX + 5, pg2Y + 9);

      pg2Y += 20;

      // Credit Scorecard Box
      doc.setFillColor(249, 250, 251); // Neutral light gray bg
      doc.rect(marginX, pg2Y, 180, 32, "F");
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(0.4);
      doc.rect(marginX, pg2Y, 180, 32, "S");

      // Column Dividers
      doc.setLineWidth(0.2);
      doc.setDrawColor(209, 213, 219);
      doc.line(marginX + 60, pg2Y, marginX + 60, pg2Y + 32);
      doc.line(marginX + 120, pg2Y, marginX + 120, pg2Y + 32);

      // Col 1: Credit Score
      doc.setTextColor(75, 85, 99);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(lang === "id" ? "SKOR KESIAPAN KREDIT" : "CREDIT READINESS SCORE", marginX + 4, pg2Y + 6);
      doc.setTextColor(14, 116, 144);
      doc.setFontSize(22);
      doc.text(`${score} / 100`, marginX + 4, pg2Y + 18);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(107, 114, 128);
      doc.text(lang === "id" ? "Berdasarkan profil & data kas" : "Based on profile & cash data", marginX + 4, pg2Y + 25);

      // Col 2: Repayment capacity (DSCR)
      doc.setTextColor(75, 85, 99);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(lang === "id" ? "KAPASITAS BAYAR (DSCR)" : "REPAYMENT CAPACITY (DSCR)", marginX + 64, pg2Y + 6);
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(13);
      doc.text(`${dscr.toFixed(2)}x`, marginX + 64, pg2Y + 15);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(107, 114, 128);
      doc.text(`${lang === "id" ? "Est. Cicilan" : "Est. Installment"}: Rp ${estCicilan.toLocaleString("id-ID")}/${lang === "id" ? "bln" : "mo"}`, marginX + 64, pg2Y + 22);
      doc.text(`${lang === "id" ? "Tenor Pengajuan" : "Requested Tenor"}: ${loanTenor} ${lang === "id" ? "Bulan" : "Months"}`, marginX + 64, pg2Y + 27);

      // Col 3: Status / Grade
      doc.setTextColor(75, 85, 99);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(lang === "id" ? "GRADE PRE-ASSESSMENT" : "PRE-ASSESSMENT GRADE", marginX + 124, pg2Y + 6);
      
      const gColor = creditGrade === "A" ? [22, 101, 52] : (creditGrade === "B" ? [180, 83, 9] : [185, 28, 28]);
      doc.setTextColor(gColor[0], gColor[1], gColor[2]);
      doc.setFontSize(13);
      doc.text(`GRADE ${creditGrade}`, marginX + 124, pg2Y + 15);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(lang === "id" ? gradeLabel : gradeLabel.replace("RISIKO RENDAH", "LOW RISK").replace("RISIKO SEDANG", "MEDIUM RISK").replace("RISIKO DEFAULT TINGGI", "HIGH DEFAULT RISK"), marginX + 124, pg2Y + 22);

      pg2Y += 40;

      // Section 2: Detailed Parameters
      doc.setTextColor(17, 24, 39);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(lang === "id" ? "RINCIAN PARAMETER & RASIO KEUANGAN MIKRO" : "MICRO-FINANCIAL RATIOS & PARAMETERS DETAILS", marginX, pg2Y);
      
      pg2Y += 6;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      
      doc.text(`1. ${lang === "id" ? "Total Pendapatan Bulanan Terpindai (Omset)" : "Total Scanned Monthly Revenue (Omset)"}: Rp ${avgMonthlyOmset.toLocaleString("id-ID")}`, marginX + 4, pg2Y);
      pg2Y += 5;
      doc.text(`2. ${lang === "id" ? "Total Pengeluaran Bulanan Terpindai (Beban)" : "Total Scanned Monthly Expenses (Beban)"}: Rp ${(avgMonthlyLaba >= 0 ? (avgMonthlyOmset - avgMonthlyLaba) : (avgMonthlyOmset + Math.abs(avgMonthlyLaba))).toLocaleString("id-ID")}`, marginX + 4, pg2Y);
      pg2Y += 5;
      doc.text(`3. ${lang === "id" ? "Sisa Bersih Bulanan (Laba Bersih Riil)" : "Net Monthly Balance (Real Net Profit)"}: Rp ${avgMonthlyLaba.toLocaleString("id-ID")}`, marginX + 4, pg2Y);
      pg2Y += 5;
      doc.text(`4. ${lang === "id" ? "Margin Laba Bersih Usaha" : "Business Net Profit Margin"}: ${(margin * 100).toFixed(1)}% ${lang === "id" ? "(Standard bank untuk pinjaman produktif > 10%)" : "(Bank standard for productive loans > 10%)"}`, marginX + 4, pg2Y);
      pg2Y += 5;
      doc.text(`5. Debt Service Coverage Ratio (DSCR): ${dscr.toFixed(2)}x ${lang === "id" ? "(Batas aman kelayakan pelunasan bank > 1.25x)" : "(Bank safety repayment threshold > 1.25x)"}`, marginX + 4, pg2Y);
      pg2Y += 5;
      doc.text(`6. ${lang === "id" ? "Plafon Pengajuan Simulasi" : "Simulated Loan Limit"}: Rp ${desiredLoan.toLocaleString("id-ID")} (${lang === "id" ? "Tenor" : "Tenor"} ${loanTenor} ${lang === "id" ? "bulan" : "months"})`, marginX + 4, pg2Y);

      pg2Y += 12;

      // Section 3: Checklist
      doc.setTextColor(17, 24, 39);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(lang === "id" ? "CHECKLIST TINDAKAN KELAYAKAN MANDIRI PEMOHON" : "APPLICANT SELF-ELIGIBILITY ACTION CHECKLIST", marginX, pg2Y);

      pg2Y += 6;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);

      const chk1 = completedChecklist.rekeningTerpisah ? "[ V ]" : "[   ]";
      doc.text(`${chk1} ${lang === "id" ? "Memisahkan Rekening Pribadi & Rekening Kas Usaha (Mengurangi Cash Leakage)" : "Separated Personal & Business Bank Accounts (Reduces Cash Leakage)"}`, marginX + 4, pg2Y);
      pg2Y += 5;

      const chk2 = completedChecklist.nibTerdaftar ? "[ V ]" : "[   ]";
      doc.text(`${chk2} ${lang === "id" ? "Memiliki Nomor Induk Berusaha (NIB) Resmi dari Kemeninvest RI (Legalitas Mikro)" : "Possess Official Business ID (NIB) from Ministry of Investment (Micro Legal status)"}`, marginX + 4, pg2Y);
      pg2Y += 5;

      const chk3 = completedChecklist.catatanKonsisten ? "[ V ]" : "[   ]";
      doc.text(`${chk3} ${lang === "id" ? "Mempertahankan Pencatatan Keuangan Harian Konsisten >= 3 Bulan Berturut-turut" : "Maintained Consistent Daily Ledger Keeping for >= 3 Consecutive Months"}`, marginX + 4, pg2Y);
      pg2Y += 5;

      const chk4 = useAltData ? "[ V ]" : "[   ]";
      doc.text(`${chk4} ${lang === "id" ? "Melampirkan Bukti Bayar Utilitas (Listrik/Ponsel) Tepat Waktu & Mutasi Alternatif e-Wallet" : "Attached Utility Payment proof (Power/Telecom) On-Time & e-Wallet Statements"}`, marginX + 4, pg2Y);

      pg2Y += 12;

      // Section: Banker Decision Underwriting Status
      doc.setTextColor(17, 24, 39);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(lang === "id" ? "KEPUTUSAN & REKOMENDASI UNDERWRITER BANK" : "BANK UNDERWRITER DECISION & RECOMMENDATIONS", marginX, pg2Y);

      pg2Y += 6;
      doc.setFillColor(249, 250, 251);
      doc.rect(marginX, pg2Y, 180, 18, "F");
      
      const stampBorderColor = underwriteStatus === "approved" ? [16, 185, 129] : (underwriteStatus === "rejected" ? [239, 68, 68] : [107, 114, 128]);
      doc.setDrawColor(stampBorderColor[0], stampBorderColor[1], stampBorderColor[2]);
      doc.setLineWidth(0.3);
      doc.rect(marginX, pg2Y, 180, 18, "S");

      // Draw stamp border
      doc.setDrawColor(stampBorderColor[0], stampBorderColor[1], stampBorderColor[2]);
      doc.setLineWidth(0.4);
      doc.rect(marginX + 4, pg2Y + 3, 26, 12, "S");
      doc.setTextColor(stampBorderColor[0], stampBorderColor[1], stampBorderColor[2]);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(lang === "id" ? underwriteStatus.toUpperCase() : (underwriteStatus === "approved" ? "APPROVED" : (underwriteStatus === "rejected" ? "REJECTED" : "PENDING")), marginX + 7, pg2Y + 11.5);

      // Decision details
      doc.setTextColor(17, 24, 39);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      const decisionTitle = underwriteStatus === "approved" 
        ? (lang === "id" ? `DISETUJUI PLAFON Rp ${approvedLoanAmount.toLocaleString("id-ID")}` : `APPROVED LIMIT Rp ${approvedLoanAmount.toLocaleString("id-ID")}`)
        : (underwriteStatus === "rejected" 
            ? (lang === "id" ? "PERMOHONAN DITOLAK" : "APPLICATION REJECTED") 
            : (lang === "id" ? "MENUNGGU UNDERWRITING" : "PENDING UNDERWRITING"));
      doc.text(decisionTitle, marginX + 35, pg2Y + 6);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(75, 85, 99);
      const notesText = underwriterNotes || (underwriteStatus === "approved" 
        ? (lang === "id" 
            ? "Berdasarkan penilaian analitis, usaha dinilai layak dengan kapasitas bayar lancar." 
            : "Based on analytical assessment, the business is deemed eligible with current repayment capacity.")
        : (underwriteStatus === "rejected" 
            ? (lang === "id" 
                ? "Kredit ditolak karena rasio margin pengembalian berada di bawah batas toleransi minimum." 
                : "Credit rejected because repayment margin ratio is below the minimum tolerance limit.") 
            : (lang === "id" 
                ? "Dokumen pre-assessment belum ditinjau oleh pejabat analis kredit perbankan." 
                : "Pre-assessment document has not been reviewed by a bank credit analyst officer.")));
      const splitNotes = doc.splitTextToSize(`${lang === "id" ? "Catatan Analis" : "Analyst Notes"}: ${notesText}`, 140);
      doc.text(splitNotes, marginX + 35, pg2Y + 11);

      pg2Y += 25;

      // Section 4: Alternative Scoring Legal Box (UU P2SK)
      doc.setFillColor(239, 246, 255); // Sky tint
      doc.rect(marginX, pg2Y, 180, 24, "F");
      doc.setDrawColor(186, 230, 253);
      doc.rect(marginX, pg2Y, 180, 24, "S");

      doc.setTextColor(14, 116, 144);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.text(lang === "id" ? "EDUKASI ALTERNATIVE CREDIT SCORING (UU NO. 4 TAHUN 2023 - P2SK)" : "ALTERNATIVE CREDIT SCORING EDUCATION (LAW NO. 4 OF 2023 - P2SK)", marginX + 4, pg2Y + 5);

      doc.setTextColor(55, 65, 81);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.8);
      const p2skText = lang === "id" 
        ? "Sesuai amanat Undang-Undang Pengembangan dan Penguatan Sektor Keuangan (UU P2SK), komite regulasi perbankan mikro didorong menggunakan inovasi penilaian kredit alternatif (Alternative Credit Scoring) memanfaatkan pembayaran tagihan listrik, BPJS, pulsa, dan riwayat e-commerce. Ini membuka kesempatan bagi pengusaha rumah tangga tanpa agunan tambahan untuk dinilai layak mendapat pembiayaan formal secara adil."
        : "In line with the mandate of the Law on Development and Strengthening of the Financial Sector (UU P2SK), the micro-banking regulatory committee is encouraged to use innovative alternative credit scoring utilizing utility bill payments, social security (BPJS), phone credit, and e-commerce history. This opens opportunities for micro/household entrepreneurs without physical collateral to be fairly assessed for formal financing.";
      const splitP2SK = doc.splitTextToSize(p2skText, 172);
      doc.text(splitP2SK, marginX + 4, pg2Y + 9.5);

      // Page 2 Footer
      pg2Y = 265;
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.2);
      doc.line(marginX, pg2Y, marginX + 180, pg2Y);

      doc.setTextColor(156, 163, 175);
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(6.5);
      doc.text(legalText1, marginX, pg2Y + 4.5);
      doc.text(legalText2, marginX, pg2Y + 8);
      doc.text(legalText3, marginX, pg2Y + 11.5);

      // Trigger standard local action to download the beautifully designed PDF report
      doc.save(`${lang === "id" ? "Laporan_Finansial" : "Financial_Report"}_${(userProfile.businessName || "UMKM").replace(/\s+/g, "_")}.pdf`);

    } catch (error) {
      console.error(error);
      alert(lang === "id" ? "Terdapat kendala sewaktu memproses file PDF. Silakan ulangi." : "An error occurred while processing the PDF file. Please try again.");
    }
  };

  // Reset demo
  const handleResetDemo = () => {
    setScanResult(null);
    setUploadedImage(null);
    setUploadedFileName("");
    setSelectedPreset(sampleNotes[0]);
  };

  return (
    <div className="bg-paper text-ink min-h-screen font-sans antialiased tectonic-grid flex flex-col selection:bg-marker-yellow">
      
      {/* Upper Tectonic Banner (Top Navigation) */}
      <header className="sticky top-0 bg-paper/95 backdrop-blur-md border-b-2 border-ink z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Logo & Brand Architecture */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold tracking-tighter text-lg font-display border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
              UM
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-lg tracking-tight uppercase">UMKM Lens</span>
                <span className="bg-ink text-paper text-[9px] px-1 font-mono tracking-widest uppercase">v1.2 AI</span>
              </div>
              <p className="text-[10px] text-gray-500 font-mono">CREDIT READINESS DETECTOR</p>
            </div>
          </div>

          {/* Navigation Links with Raw Architectural Slashes */}
          <nav className="flex items-center gap-1.5 font-mono text-xs text-gray-700">
            <button
              onClick={() => { setActiveTab("about"); }}
              className={`px-3 py-1.5 transition-all uppercase tracking-wider ${
                activeTab === "about" 
                  ? "bg-ink text-paper font-semibold shadow-inner" 
                  : "hover:bg-gray-100"
              }`}
            >
              ℹ️ {t("Tentang", "About")}
            </button>
            <span className="text-gray-300">/</span>
            <button
              onClick={() => { setActiveTab("blog"); setSelectedPostSlug(null); }}
              className={`px-3 py-1.5 transition-all uppercase tracking-wider ${
                activeTab === "blog" 
                  ? "bg-ink text-paper font-semibold shadow-inner" 
                  : "hover:bg-gray-100"
              }`}
            >
              📖 {t("Riset Masalah", "Problem Research")}
            </button>
            <span className="text-gray-300">/</span>
            <button
              id="nav-try-app"
              onClick={() => { setActiveTab("trial"); }}
              className={`px-3 py-1.5 transition-all uppercase tracking-wider flex items-center gap-1 ${
                activeTab === "trial" 
                  ? "bg-blueprint text-white font-semibold" 
                  : "hover:bg-gray-100 text-ink"
              }`}
            >
              ⚡ {t("Coba Aplikasi", "Try APP Free")}
            </button>
            <span className="text-gray-300">/</span>
            <button
              onClick={() => { setActiveTab("citations"); }}
              className={`px-3 py-1.5 transition-all uppercase tracking-wider ${
                activeTab === "citations" 
                  ? "bg-ink text-paper font-semibold shadow-inner" 
                  : "hover:bg-gray-100"
              }`}
            >
              📍 {t("Pusat Sitasi", "Citations Hub")}
            </button>
          </nav>

          {/* Prompt User Status Bar & Language Switcher */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-sm">
              {userProfile.isOnboarded ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-gray-600">
                    {t("Terdaftar: ", "Registered: ")}<strong>{userProfile.businessName}</strong>
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-gray-500 text-xs">{t("Belum Bergabung", "Not Joined")}</span>
                </>
              )}
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-0.5 border-2 border-ink p-0.5 bg-gray-50 shadow-[1.5px_1.5px_0px_0px_#111827] rounded-sm font-mono text-[9px]">
              <button
                type="button"
                onClick={() => setLang("id")}
                className={`px-1.5 py-0.5 font-bold transition-all cursor-pointer ${
                  lang === "id" ? "bg-ink text-paper" : "text-gray-500 hover:text-ink hover:bg-gray-200"
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-1.5 py-0.5 font-bold transition-all cursor-pointer ${
                  lang === "en" ? "bg-blueprint text-white" : "text-gray-500 hover:text-ink hover:bg-gray-200"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-10">

        {/* ==================== SCREEN 0: ABOUT SECTION ==================== */}
        {activeTab === "about" && (
          <div className="space-y-8">
            
            {/* Tectonic Brand Architecture Hero */}
            <div className="tectonic-card bg-white p-6 md:p-10 border-2 border-ink shadow-[4px_4px_0px_0px_#111827]">
              <span className="text-xs font-mono text-blueprint uppercase tracking-widest font-bold">
                {t("PENGANTAR PROYEK & SOLUSI", "PROJECT INTRODUCTION & SOLUTION")}
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-ink mt-1">
                {t("About UMKM Lens", "About UMKM Lens")}
              </h2>
              <p className="text-sm text-gray-700 mt-4 leading-relaxed max-w-3xl font-sans">
                {t("UMKM Lens adalah platform pendeteksi kesiapan kredit alternatif (Alternative Credit Readiness Detector) yang dirancang khusus untuk memecahkan hambatan administrasi pembukuan pelaku usaha mikro. Kami menjembatani kesenjangan antara catatan kas informal (tulisan tangan, nota) dengan standar penilaian kelayakan kredit perbankan formal menggunakan teknologi AI.",
                  "UMKM Lens is an alternative credit readiness detector platform specifically designed to solve the bookkeeping administration barriers faced by micro-merchants. We bridge the gap between informal ledger records (handwriting, paper notes) and formal banking credit assessment standards utilizing advanced AI technology.")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                <div className="border border-ink p-4 space-y-2 bg-slate-50 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-blueprint/10 text-blueprint flex items-center justify-center font-bold text-sm">1</div>
                  <h4 className="font-bold text-ink uppercase text-xs font-mono">{t("Pindai Multimodal OCR", "Multimodal OCR Scanning")}</h4>
                  <p className="text-[11px] text-gray-600 font-sans leading-relaxed">
                    {t("Merchant hanya perlu memotret catatan harian buku kas mereka. AI membaca coretan tangan tersebut dan menstrukturkannya secara otomatis secara instan.",
                      "Merchants simply take a photo of their handwritten daily ledger sheets. The AI reads the handwriting and structures it automatically and instantly.")}
                  </p>
                </div>
                <div className="border border-ink p-4 space-y-2 bg-slate-50 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-blueprint/10 text-blueprint flex items-center justify-center font-bold text-sm">2</div>
                  <h4 className="font-bold text-ink uppercase text-xs font-mono">{t("Simulasi Cicilan & DSCR", "Installment & DSCR Simulation")}</h4>
                  <p className="text-[11px] text-gray-600 font-sans leading-relaxed">
                    {t("Menghitung kapasitas bayar nyata (Debt Service Coverage Ratio) dari riwayat kas bulanan untuk memberikan rekomendasi plafon pinjaman yang aman.",
                      "Calculates actual repayment capacity (Debt Service Coverage Ratio) from monthly cash history to provide safe loan limit recommendations.")}
                  </p>
                </div>
                <div className="border border-ink p-4 space-y-2 bg-slate-50 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-blueprint/10 text-blueprint flex items-center justify-center font-bold text-sm">3</div>
                  <h4 className="font-bold text-ink uppercase text-xs font-mono">{t("Data Alternatif (UU P2SK)", "Alternative Data (UU P2SK)")}</h4>
                  <p className="text-[11px] text-gray-600 font-sans leading-relaxed">
                    {t("Mengintegrasikan data utilitas PLN, tagihan pulsa, volume e-wallet, dan e-commerce sebagai indikator kelayakan kredit non-fisik.",
                      "Integrates utility bills, telecom records, digital wallet volume, and e-commerce ratings as non-physical credit rating indicators.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Tech Stack & Google AI Architecture Section */}
            <div className="bg-white border-2 border-ink p-6 shadow-[4px_4px_0px_0px_#111827] space-y-6">
              <span className="text-xs font-mono text-blueprint uppercase tracking-widest font-bold">
                {t("ARSITEKTUR TEKNOLOGI & GOOGLE AI INTEGRATION", "TECHNOLOGY ARCHITECTURE & GOOGLE AI INTEGRATION")}
              </span>
              <h3 className="text-2xl font-display font-bold text-ink">
                {t("Bagaimana Kami Menggunakan Google AI Ecosystem", "How We Leverage the Google AI Ecosystem")}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">
                {t("UMKM Lens tidak hanya menggunakan AI sebagai wrapper sederhana. Kami mengintegrasikan seluruh ekosistem Google AI secara mendalam untuk menjamin keandalan data finansial bagi bank dan kemudahan akses bagi pelaku usaha mikro.",
                  "UMKM Lens is not just a simple AI wrapper. We deeply integrate the Google AI ecosystem to ensure financial data reliability for banks and seamless accessibility for micro-entrepreneurs.")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs pt-2">
                <div className="border border-ink p-4 space-y-2 bg-slate-50">
                  <h4 className="font-bold text-blueprint uppercase">🤖 {t("Model Layer", "Model Layer")}</h4>
                  <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                    {t("Menggunakan Gemini 3.5 Flash untuk analisis multimodal OCR. Mampu mengekstrak tulisan tangan bebas dari foto buku kas kumal, memilah kategori kas, dan menerjemahkan istilah/singkatan lokal secara cerdas.",
                      "Powered by Gemini 3.5 Flash for multimodal OCR analysis. It extracts freeform handwriting from ledger photos, classifies transaction categories, and intelligently resolves local shorthand.")}
                  </p>
                </div>
                <div className="border border-ink p-4 space-y-2 bg-slate-50">
                  <h4 className="font-bold text-blueprint uppercase">📦 {t("SDK & Structured Output", "SDK & Structured Output")}</h4>
                  <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                    {t("Diimplementasikan menggunakan library @google/genai Node.js SDK terbaru dengan konfigurasi responseSchema (Structured Output). Menjamin output data terstruktur dalam JSON format 100% konsisten demi menghindari halusinasi angka.",
                      "Implemented via the new @google/genai Node.js SDK with responseSchema (Structured Output) configuration. This guarantees 100% consistent structured JSON outputs, eliminating numerical hallucinations.")}
                  </p>
                </div>
                <div className="border border-ink p-4 space-y-2 bg-slate-50">
                  <h4 className="font-bold text-blueprint uppercase">⚙️ {t("Development & Prompts", "Development & Prompts")}</h4>
                  <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                    {t("Prototipe dan penyempurnaan instruksi prompt dikembangkan di Google AI Studio. Memungkinkan tuning batasan klasifikasi (pemasukan/pengeluaran) dan optimalisasi token secara taktis.",
                      "Prompt prototyping and validation were developed in Google AI Studio, enabling tactical tuning of classification rules (inflow/outflow) and token footprint optimization.")}
                  </p>
                </div>
              </div>

              {/* Text-based architecture diagram */}
              <div className="border border-ink bg-slate-900 text-emerald-400 p-4 font-mono text-[10.5px] rounded-sm space-y-2 leading-relaxed shadow-inner">
                <p className="font-bold text-white uppercase text-center border-b border-emerald-800 pb-1.5">{t("ALIRAN ARSITEKTUR DATA APLIKASI (DATA FLOW ARCHITECTURE)", "APPLICATION DATA FLOW ARCHITECTURE")}</p>
                <div className="space-y-1 font-mono text-[10px]">
                  <p className="flex justify-between">
                    <span>[Step 1] Merchant Uploads Ledger Photo</span>
                    <span className="text-white">→ Frontend (React + Vite)</span>
                  </p>
                  <p className="flex justify-between">
                    <span>[Step 2] Convert image to Base64 & Send Payload</span>
                    <span className="text-white">→ Express API Server (/api/analyze-record)</span>
                  </p>
                  <p className="flex justify-between">
                    <span>[Step 3] Fetch via @google/genai SDK with responseSchema</span>
                    <span className="text-white">→ Google Gemini API</span>
                  </p>
                  <p className="flex justify-between">
                    <span>[Step 4] Process Image with Multimodal Vision</span>
                    <span className="text-white">→ Gemini 3.5 Flash Model</span>
                  </p>
                  <p className="flex justify-between">
                    <span>[Step 5] Return Validated Structured JSON</span>
                    <span className="text-white">→ Express API Server</span>
                  </p>
                  <p className="flex justify-between">
                    <span>[Step 6] Render Interactive Dashboard & Recharts</span>
                    <span className="text-white">→ Frontend Client</span>
                  </p>
                  <p className="flex justify-between">
                    <span>[Step 7] Download Official Pre-Assessment Report</span>
                    <span className="text-white">→ jsPDF Client Engine</span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== SCREEN 1: THE RESEARCH & PROBLEM PITCH BLOG ==================== */}
        {activeTab === "blog" && (
          <div className="space-y-12">
            
            {/* Architectural Pitch Hero */}
            <section className="relative overflow-hidden bg-white border-4 border-ink p-6 md:p-12 shadow-[8px_8px_0px_0px_#111827] rounded-sm">
              <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-5 flex items-center justify-center font-display font-bold text-[180px] text-ink select-none overflow-hidden">
                61%
              </div>

              <div className="max-w-4xl space-y-6">
                <span className="bg-marker-yellow text-ink text-xs px-2.5 py-1 font-mono tracking-widest uppercase font-bold border border-ink shadow-[1.5px_1.5px_0px_0px_#111827]">
                  UMKM Lens Problem Foundation Vol. 01
                </span>
                
                <h1 className="text-3x md:text-5xl lg:text-6xl font-display font-bold text-ink leading-[1.1] tracking-tight">
                  Menembus Dinding Dokumentasi: <br className="hidden md:inline" />
                  <span className="marker-highlight">Jaminan Kredit</span> untuk Pengusaha Rumah Tangga Indonesia.
                </h1>
                
                <p className="text-base md:text-lg text-gray-700 font-sans max-w-3xl leading-relaxed">
                  Usaha mikro menyumbang <strong>61% PDB nasional</strong>, namun <strong>60-70% pengajuan modal perbankan ditolak</strong> sia-sia. Jembatani eksklusi finansial ini dengan konversi berkas informal berbasis AI instan.
                </p>

                {/* Instant Action CTA Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                  <button 
                    onClick={() => {
                      setActiveTab("trial");
                      setTimeout(() => {
                        const target = document.getElementById("onboarding-form");
                        if (target) target.scrollIntoView({ behavior: "smooth" });
                      }, 200);
                    }}
                    className="bg-blueprint text-white px-7 py-4 font-display font-bold text-base transition-all hover:bg-blue-700 text-center uppercase tracking-wider shadow-[4px_4px_0px_0px_#111827] active:translate-x-0.5 active:translate-y-0.5 border-2 border-ink flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Buka Aplikasi Sekarang <Sparkles className="w-4.5 h-4.5 text-marker-yellow fill-marker-yellow" />
                  </button>
                  
                  <button
                    onClick={() => {
                      const simulatorEl = document.getElementById("analytics-simulator");
                      if (simulatorEl) simulatorEl.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="bg-paper text-ink px-6 py-4 font-mono text-xs tracking-wide border-2 border-ink hover:bg-gray-50 shadow-[4px_4px_0px_0px_#111827] uppercase text-center active:translate-x-0.5 active:translate-y-0.5"
                  >
                    📊 Loloskan Kredit Anda (Simulator)
                  </button>
                </div>
              </div>
              
              {/* Tectonic Stat Boxes Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t-2 border-ink/10">
                <div className="border border-ink p-4 bg-paper shadow-[3px_3px_0px_0px_#111827]">
                  <p className="text-sm font-mono text-gray-500 uppercase">Prosi Kontribusi PDB</p>
                  <p className="text-3xl md:text-4xl font-display font-bold text-ink mt-1">61%</p>
                  <p className="text-[11px] text-gray-500 font-mono mt-1 mt-1 font-semibold">Menggerakkan 97% Tenaga Kerja</p>
                </div>
                <div className="border border-ink p-4 bg-paper shadow-[3px_3px_0px_0px_#111827]">
                  <p className="text-sm font-mono text-gray-500 uppercase">Rejection Rate Bank</p>
                  <p className="text-3xl md:text-4xl font-display font-bold text-red-600 mt-1">60% - 70%</p>
                  <p className="text-[11px] text-gray-400 font-mono mt-1">Gagal akibat validasi berkas formal</p>
                </div>
                <div className="border border-ink p-4 bg-paper shadow-[3px_3px_0px_0px_#111827]">
                  <p className="text-sm font-mono text-gray-500 uppercase">Unbanked Adults</p>
                  <p className="text-3xl md:text-4xl font-display font-bold text-blueprint mt-1">91 Juta</p>
                  <p className="text-[11px] text-gray-500 font-mono mt-1">Kesenjangan akses modal terdalam</p>
                </div>
              </div>
            </section>

            {/* Core Two-Column Blog and Insights layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Multipage Blog Navigator */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Blog Header bar with Tectonic Styling */}
                <div className="border-b-2 border-ink pb-3 flex justify-between items-center bg-gray-50 px-3 py-2 border-2 border-ink">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-ink block">
                    📁 ARSIP PROBLEM ANALYSIS ({blogPosts.length} ARTIKEL)
                  </h3>
                  <span className="font-mono text-[10px] text-gray-500">PILIH JUDUL UNTUK MEMBACA</span>
                </div>

                {/* Selected Post Detail Viewer */}
                {selectedPostSlug ? (
                  (() => {
                    const currentPost = blogPosts.find(p => p.slug === selectedPostSlug);
                    if (!currentPost) return null;
                    return (
                      <article className="bg-white border-2 border-ink p-6 md:p-8 shadow-[4px_4px_0px_0px_#111827] space-y-6">
                        <button
                          onClick={() => setSelectedPostSlug(null)}
                          className="font-mono text-xs text-blueprint hover:underline flex items-center gap-1.5 uppercase tracking-wider mb-4"
                        >
                          ← Kembali ke Semua Artikel
                        </button>
                        
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-ink text-paper text-[10px] uppercase font-mono px-2 py-0.5 font-bold">
                              {currentPost.category}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              Diterbitkan: {currentPost.date}
                            </span>
                          </div>
                          
                          <h2 className="text-2xl md:text-3xl font-display font-bold text-ink leading-snug">
                            {currentPost.title}
                          </h2>
                          
                          <p className="text-xs text-gray-500 font-mono bg-amber-50 border-l-4 border-amber-300 p-2.5 rounded-sm">
                            🎯 <strong>Cita-Cari Riset:</strong> Dilansir dari {currentPost.citation}.
                          </p>
                        </div>
                        
                        <div className="space-y-4 text-gray-700 leading-relaxed font-sans text-sm md:text-base border-t border-gray-100 pt-6">
                          {currentPost.content.map((para, i) => {
                            // Render raw markdown-like bold parameters gracefully
                            const parsedText = para.split("**").map((text, idx) => {
                              return idx % 2 === 1 ? <strong key={idx} className="marker-highlight text-ink px-1 font-bold">{text}</strong> : text;
                            });
                            return <p key={i}>{parsedText}</p>;
                          })}
                        </div>

                        <div className="border-t-2 border-dashed border-gray-200 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 border border-ink">
                          <div>
                            <p className="text-xs text-gray-500 font-mono uppercase">Langkah Rekomendasi Selanjutnya:</p>
                            <p className="text-sm font-semibold text-ink mt-0.5">Uji kesiapan laporan keuangan Anda sekarang secara gratis!</p>
                          </div>
                          <button
                            onClick={() => {
                              setActiveTab("trial"); 
                              setTimeout(() => {
                                const onboardingSec = document.getElementById("onboarding-form");
                                if (onboardingSec) onboardingSec.scrollIntoView({ behavior: "smooth" });
                              }, 150);
                            }}
                            className="bg-blueprint text-white text-xs font-mono py-2 px-4 shadow-[2px_2px_0px_0px_#111827] border-2 border-ink hover:translate-y-[-1px] uppercase transition-all"
                          >
                            Coba UMKM Lens →
                          </button>
                        </div>
                      </article>
                    );
                  })()
                ) : (
                  /* Blog List Layout */
                  <div className="space-y-6">
                    {blogPosts.map((post) => (
                      <div 
                        key={post.id}
                        className="bg-white border-2 border-ink p-6 shadow-[4px_4px_0px_0px_#111827] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#111827] transition-all cursor-pointer group"
                        onClick={() => setSelectedPostSlug(post.slug)}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <span className="bg-gray-100 border border-ink/40 text-[10px] text-ink font-mono uppercase px-2 py-0.5 tracking-wider font-semibold">
                            {post.category}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-300" /> {post.readTime} Baca
                          </span>
                        </div>

                        <h3 className="text-xl font-display font-bold text-ink group-hover:text-blueprint transition-colors mt-3 mb-2 leading-tight">
                          {post.title}
                        </h3>

                        <p className="text-xs text-gray-600 font-sans line-clamp-3 leading-relaxed mb-4">
                          {post.summary}
                        </p>

                        <div className="flex gap-2 items-center justify-between border-t border-gray-100 pt-3">
                          <span className="text-[10px] text-gray-400 font-mono italic">
                            Dasar Riset: {post.citation}
                          </span>
                          <span className="text-xs text-blueprint font-mono font-bold flex items-center gap-1 group-hover:underline">
                            Baca Selengkapnya <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Right Column: Real-Time Growth Analytics Bridge & Interactive Simulator */}
              <div className="lg:col-span-4 space-y-8">
                
                {/* Interactive Tectonic Growth Dashboard (Live Simulator) */}
                <div id="analytics-simulator" className="tectonic-card p-5 bg-white border-2 border-ink shadow-[4px_4px_0px_0px_#111827] space-y-4">
                  <div className="border-b-2 border-ink pb-2">
                    <span className="text-[10px] font-mono text-blueprint uppercase tracking-widest font-bold">LIVE METRICS SIMULATOR</span>
                    <h4 className="text-lg font-display font-bold text-ink">Gap Efisiensi Arus Kas</h4>
                    <p className="text-[11px] text-gray-500">Geser slider untuk melihat bagaimana pencatatan visual langsung menyelamatkan margin usaha.</p>
                  </div>

                  {/* Simulator Sliders */}
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex justify-between text-xs font-mono text-gray-700">
                        <span>Pemasukan Bulanan (Omset):</span>
                        <strong className="text-ink">Rp {sliderRevenue.toLocaleString("id-ID")}</strong>
                      </div>
                      <input 
                        type="range" 
                        min="1000000" 
                        max="15000000" 
                        step="250000"
                        value={sliderRevenue}
                        onChange={(e) => setSliderRevenue(Number(e.target.value))}
                        className="w-full accent-blueprint mt-1 cursor-pointer h-2 bg-gray-100 border border-ink" 
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono text-gray-700">
                        <span>Beban / Pengeluaran:</span>
                        <strong className="text-red-600">Rp {sliderExpense.toLocaleString("id-ID")}</strong>
                      </div>
                      <input 
                        type="range" 
                        min="500000" 
                        max="8000000" 
                        step="100000"
                        value={sliderExpense}
                        onChange={(e) => setSliderExpense(Number(e.target.value))}
                        className="w-full accent-red-500 mt-1 cursor-pointer h-2 bg-gray-100 border border-ink" 
                      />
                    </div>
                  </div>

                  {/* Dynamic Projection Chart */}
                  <div className="h-44 border border-ink/10 pt-2 bg-slate-50 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={growthTimeline} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "monospace" }} />
                        <YAxis tick={{ fontSize: 9, fontFamily: "monospace" }} />
                        <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`} labelStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                        <Area type="monotone" dataKey="LabaDenganAnalitik" fill="#bbf7d0" stroke="#16a34a" name="Laba AI Lens" />
                        <Line type="monotone" dataKey="LabaTradisional" stroke="#ef4444" strokeWidth={2} name="Laba Tanpa Catatan" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Profit Gap Analysis Indicator */}
                  <div className="bg-marker-yellow/10 border border-amber-300 p-3 rounded-sm space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
                      <TrendingUp className="w-4 h-4 text-amber-700" />
                      <span>Rugi Keuangan Tersembunyi (Leaking Cash):</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] text-gray-500 font-mono">Batas Error Tanpa Analitik</span>
                      <span className="text-sm font-bold text-red-700 font-mono">
                        ~ Rp {Math.round((sliderRevenue - sliderExpense) * 0.15).toLocaleString("id-ID")} / bln
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">
                      *Berdasarkan data **World Bank (2024)**, ketiadaan visibilitas harian menyebabkan kekacauan pengeluaran non-operasional sebesar 12% s.d 15%.
                    </p>
                  </div>

                  {/* Tectonic Action Trigger */}
                  <button
                    onClick={() => {
                      setActiveTab("trial");
                      setTimeout(() => {
                        const target = document.getElementById("onboarding-form");
                        if (target) target.scrollIntoView({ behavior: "smooth" });
                      }, 200);
                    }}
                    className="w-full bg-ink text-paper py-2.5 font-bold font-mono text-xs uppercase tracking-wider text-center border-2 border-ink active:translate-y-px hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    Dapatkan Analitik Real-Time Gratis <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                </div>

                {/* Indonesian Financial Literacy Card */}
                <div className="bg-stone-50 border-2 border-ink p-5 space-y-3.5 shadow-[4px_4px_0px_0px_#111827]">
                  <h4 className="font-display font-bold text-sm text-ink uppercase flex items-center gap-1.5 border-b border-ink/10 pb-1.5">
                    <Layers className="w-4 h-4 text-blueprint" />
                    Gap Literasi di Balik Layar
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed font-sans">
                    Menurut Indeks OJK & BPS (SNLIK 2024), indeks literasi masyarakat Indonesia berkisar <strong>65.43%</strong>. Pengusaha mikro paham persis operasional barangnya, tetapi memiliki pemikiran tabu melamar pinjaman karena dokumen yang menakutkan.
                  </p>
                  
                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="flex justify-between border-b border-gray-200 pb-1 text-gray-700">
                      <span>Kelayakan Kredit Alternatif:</span>
                      <span className="text-emerald-700 font-semibold uppercase">Potensial Tinggi</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1 text-gray-700">
                      <span>Hambatan Non-Agunan:</span>
                      <span className="text-red-600 font-semibold uppercase">Pola Laporan Buku</span>
                    </div>
                    <div className="flex justify-between text-gray-700 pb-1">
                      <span>Solusi Jangka Pendek:</span>
                      <span className="text-blueprint font-semibold uppercase">Goresan ke PDF</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-sm">
                    <p className="text-[10px] text-sky-800 leading-relaxed font-sans font-medium">
                      ℹ️ <strong>Rekomendasi Kebijakan:</strong> Regulasi UU P2SK Pasal 4 mewajibkan institusi fintech membina literasi finansial para nasabah unbanked.
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* Seamless Transition CTA Banner to Boost Onboarding Conversion */}
            <section className="bg-blueprint text-white border-4 border-ink p-8 shadow-[8px_8px_0px_0px_#111827] rounded-sm text-center relative overflow-hidden">
              <div className="absolute top-[-20px] left-[-20px] w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
              <div className="max-w-3xl mx-auto space-y-4">
                <span className="bg-marker-yellow text-ink text-xs px-2.5 py-1 font-mono tracking-widest uppercase font-bold inline-block">
                  SEAMLESS ONBOARDING CONVERSION
                </span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold">
                  Daftar & Deteksi Sekarang Juga Dengan 1-Klik
                </h2>
                <p className="text-xs md:text-sm text-blue-100 max-w-2xl mx-auto leading-relaxed">
                  Tanpa kartu kredit, tanpa login rumit. Cukup masukkan nama usaha rumah tangga Anda, dan unggah foto buku catatan harian Anda untuk melihat seberapa sakti laporan keuangan Anda dikonversi dalam hitungan detik.
                </p>
                
                <div className="pt-3 flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={handleQuickOnboard}
                    className="bg-marker-yellow hover:bg-yellow-300 text-ink px-6 py-3 font-display font-extrabold text-xs md:text-sm uppercase tracking-wider border-2 border-ink shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] active:translate-y-px transition-all"
                  >
                    🚀 Coba Demo Instan (Pakai Preset)
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("trial");
                      setTimeout(() => {
                        const target = document.getElementById("onboarding-form");
                        if (target) target.scrollIntoView({ behavior: "smooth" });
                      }, 150);
                    }}
                    className="bg-black hover:bg-zinc-900 text-paper px-6 py-3 font-mono text-xs md:text-sm uppercase tracking-wider border-2 border-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] active:translate-y-px transition-all"
                  >
                    ✍️ Daftar Manual UMKM Baru
                  </button>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* ==================== SCREEN 2: ACTIVE INTEGRATED UTILITY TRIAL (UMKM LENS) ==================== */}
        {activeTab === "trial" && (
          <div className="space-y-10">

            {/* Back button to research */}
            <div className="flex justify-between items-center bg-white border-2 border-ink p-3 shadow-[2px_2px_0px_0px_#111827]">
              <button
                onClick={() => { setActiveTab("blog"); }}
                className="font-mono text-xs text-blueprint hover:underline flex items-center gap-1 uppercase font-bold"
              >
                {t("← Kembali Ke Buku Analisis Masalah", "← Back to Problem Analysis")}
              </button>
              <span className="font-mono text-[9px] text-gray-500 bg-gray-100 px-2 py-1 border border-gray-200">
                {t("STATUS PERANGKAT: KAMERA AKTIF / SIAP", "DEVICE STATUS: CAMERA ACTIVE / READY")}
              </span>
            </div>

            {/* Heading Section */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs uppercase font-mono text-blueprint font-bold tracking-widest bg-blue-50 px-2.5 py-1 border border-blue-200">
                {t("PONDASI KELAYAKAN FINANSIAL", "FINANCIAL FEASIBILITY BASELINE")}
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-ink">
                {t("Ubah Coretan Menjadi Laporan Laba Rugi", "Transform Handwritings into P&L Statements")}
              </h2>
              <p className="text-xs md:text-sm text-gray-500">
                {t("Unggah jepretan kamera kertas catatan supplier atau buku kas harian Anda. Agen AI UMKM Lens akan secara instan merapikannya menjadi siap cetak.", "Upload snapshots of supplier receipts or daily cash logs. The UMKM Lens AI Agent will instantly clean and structure them into bank-ready statements.")}
              </p>
            </div>

            {/* ==================== STEP A: USER REGISTRATION / ONBOARDING ==================== */}
            <section id="onboarding-form" className="tectonic-card bg-white p-6 max-w-2xl mx-auto space-y-5">
              <div className="border-b-2 border-ink pb-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blueprint" />
                  <h3 className="font-display font-bold text-lg text-ink uppercase">{t("Daftar Identitas UMKM", "UMKM Identity Registration")}</h3>
                </div>
                {userProfile.isOnboarded ? (
                  <span className="bg-emerald-100 border border-emerald-500 text-emerald-800 text-[10px] uppercase font-mono px-2 py-0.5 font-bold">
                    {t("✓ TERONBOARD", "✓ ONBOARDED")}
                  </span>
                ) : (
                  <span className="bg-amber-100 border border-amber-500 text-amber-800 text-[10px] uppercase font-mono px-2 py-0.5 font-bold">
                    {t("WAJIB DIISI", "REQUIRED")}
                  </span>
                )}
              </div>

              {!userProfile.isOnboarded ? (
                <form onSubmit={handleRegisterUser} className="space-y-4">
                  <p className="text-xs text-gray-600 leading-relaxed font-sans">
                    {t("Daftar di bawah ini untuk mengunci nama usaha Anda di kop lampiran PDF perbankan. Ini memberikan kredibilitas yang dicari analis mikro KUR.", "Register below to secure your business name in the banking PDF report header. This provides the credibility required by micro-credit analysts.")}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">{t("Nama Pemilik Usaha", "Business Owner Name")}</label>
                      <input
                        type="text"
                        placeholder={t("Contoh: Ibu Lilis Suranti", "Example: Mrs. Lilis Suranti")}
                        value={userProfile.ownerName}
                        onChange={(e) => setUserProfile({ ...userProfile, ownerName: e.target.value })}
                        className="w-full text-sm font-sans border-2 border-ink p-2.5 bg-paper focus:bg-white focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">{t("Nama Usaha / Toko", "Business / Shop Name")}</label>
                      <input
                        type="text"
                        placeholder={t("Contoh: Nastar Makmur Jagakarsa", "Example: Nastar Makmur Jagakarsa")}
                        value={userProfile.businessName}
                        onChange={(e) => setUserProfile({ ...userProfile, businessName: e.target.value })}
                        className="w-full text-sm font-sans border-2 border-ink p-2.5 bg-paper focus:bg-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">{t("Jenis Sektor Bisnis", "Business Sector")}</label>
                      <select
                        value={userProfile.businessType}
                        onChange={(e) => setUserProfile({ ...userProfile, businessType: e.target.value })}
                        className="w-full text-sm font-sans border-2 border-ink p-2.5 bg-paper focus:outline-none font-mono"
                      >
                        <option value="makanan">{t("Makanan / Minuman Rumahan", "Homemade Food & Beverage")}</option>
                        <option value="kerajinan">{t("Kerajinan Tangan (Rajut, Anyam, Kulit)", "Handicrafts (Knitting, Weaving, Leather)")}</option>
                        <option value="warung">{t("Warung Kelontong / Toko Kelontong", "Grocery / Retail Shop")}</option>
                        <option value="jasa">{t("Jasa Domestik (Laundry, Ojek, Bengkel)", "Domestic Services (Laundry, Ride-hail, Repair)")}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">{t("Nomor WhatsApp Aktif", "Active WhatsApp Number")}</label>
                      <input
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        value={userProfile.phone}
                        onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                        className="w-full text-sm font-mono border-2 border-ink p-2.5 bg-paper focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">{t("Lokasi Usaha (Kabupaten / Kota)", "Business Location (Regency / City)")}</label>
                    <input
                      type="text"
                      placeholder={t("Contoh: Jagakarsa, Jakarta Selatan atau Bogor, Jawa Barat", "Example: Jagakarsa, South Jakarta")}
                      value={userProfile.location}
                      onChange={(e) => setUserProfile({ ...userProfile, location: e.target.value })}
                      className="w-full text-sm font-sans border-2 border-ink p-2.5 bg-paper focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-3 flex gap-2 rounded-sm mt-2">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-[11px] text-amber-800 leading-normal font-sans">
                      <strong>{t("Privasi Terjamin:", "Privacy Guaranteed:")}</strong> {t("Data disimpan sepenuhnya secara lokal di peramban Anda. Aplikasi ini dirancang sesuai standard tanpa login yang frictionless demi kenyamanan Ibu Rumah Tangga.", "All data is stored purely locally in your browser. This application is designed without a login barrier for a friction-free experience for micro-merchants.")}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blueprint text-white py-3.5 font-display font-bold text-xs uppercase tracking-wider border-2 border-ink shadow-[3px_3px_0px_0px_#111827] hover:bg-blue-700 cursor-pointer text-center"
                    >
                      {t("Daftar UMKM Baru & Mulai Deteksi Catatan", "Register New UMKM & Start Scanning")}
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickOnboard}
                      className="bg-marker-yellow hover:bg-yellow-300 text-ink py-3.5 px-4 font-mono font-bold text-xs uppercase tracking-wider border-2 border-ink shadow-[3px_3px_0px_0px_#111827] cursor-pointer"
                    >
                      {t("🚀 Lewati & Isi Data Demo Instan", "🚀 Skip & Fill Demo Data")}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-sm flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">{t("Pendaftaran Berhasil & Terkonfirmasi", "Registration Successful & Verified")}</h4>
                      <p className="text-xs text-emerald-700 mt-1 font-sans">
                        {t("Kop Laporan Usaha sekarang terdaftar atas nama ", "Business report header is now registered under ")} <strong>{userProfile.businessName}</strong> ({t("Pemilik: ", "Owner: ")}{userProfile.ownerName}) {t(" dengan sektor ", " within the sector ")} <strong>Usaha {userProfile.businessType.toUpperCase()}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setUserProfile({ ...userProfile, isOnboarded: false })}
                      className="text-[10px] font-mono text-gray-500 uppercase hover:underline flex items-center gap-1 hover:text-ink cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> {t("Ganti Identitas Profil", "Change Profile Identity")}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Anchor Target for scanning utility */}
            <div id="anchor-scan" className="h-1" />

            {/* ==================== LEDGER WORKSPACE: MULTI-PERIOD DATABASE ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (4 cols): Profile, Saved Periods List, and Credit Score Indicator */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* 1. Saved Periods Card */}
                <div className="tectonic-card bg-white p-5 border-2 border-ink shadow-[4px_4px_0px_0px_#111827] space-y-4">
                  <div className="border-b-2 border-ink pb-2 flex justify-between items-center">
                    <h3 className="font-display font-bold text-sm text-ink uppercase flex items-center gap-1.5">
                      📖 {t("Buku Kas Sejarah", "Historical Ledger")}
                    </h3>
                    <span className="bg-ink text-paper text-[9px] px-1.5 py-0.5 font-mono">
                      {historicalPeriods.length} {t("Bulan", "Months")}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto">
                    {historicalPeriods.map((p, idx) => (
                      <div
                        key={idx}
                        className={`p-3 border-2 transition-all flex justify-between items-center ${
                          selectedPeriodIndex === idx && !isViewingScan
                            ? "bg-marker-yellow border-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]"
                            : "bg-paper border-gray-200 hover:border-ink cursor-pointer"
                        }`}
                        onClick={() => {
                          setSelectedPeriodIndex(idx);
                          setScanResult(null); // Deselect active scan
                        }}
                      >
                        <div>
                          <p className="font-mono text-xs font-bold text-ink">{p.period}</p>
                          <p className="text-[10px] text-gray-500 font-sans mt-0.5 uppercase">{t("Sektor: ", "Sector: ")}{p.business_type}</p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <span className="text-[9px] text-gray-400 font-mono block">{t("Laba Bersih:", "Net Profit:")}</span>
                            <span className={`text-[10px] font-mono font-bold ${p.totals.laba_bersih >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                              Rp {p.totals.laba_bersih.toLocaleString("id-ID")}
                            </span>
                          </div>
                          {historicalPeriods.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = historicalPeriods.filter((_, i) => i !== idx);
                                setHistoricalPeriods(updated);
                                if (selectedPeriodIndex >= updated.length) {
                                  setSelectedPeriodIndex(Math.max(0, updated.length - 1));
                                }
                              }}
                              className="text-gray-400 hover:text-red-600 p-1 font-bold text-sm cursor-pointer"
                              title={t("Hapus bulan ini", "Delete this month")}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Month button */}
                  <button
                    onClick={handleTriggerNewScan}
                    className="w-full bg-blueprint text-white py-2.5 font-mono text-xs font-bold uppercase border-2 border-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] active:translate-y-px text-center cursor-pointer hover:bg-blue-700"
                  >
                    {t("➕ Pindai & Unggah Bulan Baru", "➕ Scan & Upload New Month")}
                  </button>
                </div>

                {/* 2. Global Credit Score circular visualizer */}
                <div className="tectonic-card bg-white p-5 border-2 border-ink shadow-[4px_4px_0px_0px_#111827] space-y-4 text-center flex flex-col items-center justify-center">
                  <span className="text-[10px] font-mono text-gray-400 uppercase">{t("KONSOLIDASI KESIAPAN KREDIT", "CONSOLIDATED CREDIT READINESS")}</span>
                  
                  {/* Score Indicator */}
                  <div className="relative w-32 h-32 flex items-center justify-center bg-slate-50 border-4 border-ink rounded-full shadow-inner">
                    <div className="text-center">
                      <span className="text-3xl md:text-4xl font-display font-extrabold text-ink">{score}</span>
                      <span className="text-[10px] text-gray-400 font-mono block border-t border-gray-100 mt-1 pt-0.5">{t("dari 100", "out of 100")}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-mono font-bold text-ink uppercase">GRADE: {creditGrade}</p>
                    <span className={`inline-block px-3 py-1 font-mono text-[10px] font-bold border-2 border-ink uppercase ${gradeBadgeColor}`}>
                      {lang === "id" ? gradeLabel : gradeLabel.replace("RISIKO RENDAH", "LOW RISK").replace("RISIKO SEDANG", "MEDIUM RISK").replace("RISIKO DEFAULT TINGGI", "HIGH DEFAULT RISK")}
                    </span>
                    <p className="text-[10px] text-gray-500 font-sans leading-tight mt-2 max-w-[200px] mx-auto">
                      {t("Dihitung dari rata-rata laba bersih bulanan ", "Calculated from average monthly net profit of ")} <strong>Rp {avgMonthlyLaba.toLocaleString("id-ID")}</strong> {t(" untuk plafon ", " for a credit limit of ")} Rp {desiredLoan.toLocaleString("id-ID")}.
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Column (8 cols): Main workspace (Active Scan Form, Active ledger table editor, or Underwriting Dashboard) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Condition 1: Actively scanning / uploading new month OR scanResult is loaded but not yet saved */}
                {isViewingScan && scanResult.items.length === 0 ? (
                  /* RENDER SCAN INPUT FORM */
                  <div className="tectonic-card bg-white p-5 border-2 border-ink shadow-[4px_4px_0px_0px_#111827] space-y-5">
                    
                    <div className="border-b-2 border-ink pb-2 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blueprint" />
                        <h3 className="font-display font-bold text-base text-ink uppercase">{t("Scan Catatan Bulanan Baru", "Scan New Monthly Ledger")}</h3>
                      </div>
                      <button 
                        onClick={() => setScanResult(null)}
                        className="text-xs font-mono text-gray-400 hover:text-ink hover:underline cursor-pointer"
                      >
                        {t("Batal", "Cancel")}
                      </button>
                    </div>

                    <div className="space-y-4">
                      
                      {/* Presets */}
                      <div className="space-y-3">
                        <span className="block text-xs font-mono font-bold text-gray-700 uppercase">
                          {t("Langkah 1: Pilih Preset Buku Kas Harian (Untuk Demo Instan)", "Step 1: Choose Daily Cash Ledger Preset (For Instant Demo)")}
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {sampleNotes.map((note) => (
                            <button
                              key={note.id}
                              type="button"
                              onClick={() => handleSelectPreset(note)}
                              className={`p-3 text-left border-2 flex flex-col justify-between h-32 transition-all ${
                                selectedPreset?.id === note.id
                                  ? "bg-marker-yellow border-ink shadow-[2px_2px_0px_0px_#111827]"
                                  : "bg-paper border-gray-300 hover:border-ink shadow-sm"
                              }`}
                            >
                              <div>
                                <p className="font-sans text-xs font-bold text-ink leading-tight line-clamp-2">
                                  {lang === "id" ? note.title : note.title.replace("Catatan Buku Kas Nastar Ibu Lilis", "Mrs. Lilis Nastar Book Cash Logs").replace("Nota Penjualan Anyaman Pak Made", "Mr. Made Rattan Sales Invoice").replace("Buku Pembelian Grosir Warung Bu Rahma", "Mrs. Rahma Grocery Supplier Invoice")}
                                </p>
                                <span className="text-[9px] text-gray-500 font-mono mt-1 block uppercase">
                                  {t("Sektor: ", "Sector: ")}{note.businessType}
                                </span>
                              </div>
                              <p className="text-[9px] text-gray-600 line-clamp-2 mt-2 leading-tight font-sans italic">
                                "{lang === "id" ? note.snippet : note.snippet.replace("Buku harian kue kering lebaran. Ada biaya margarin, terigu, penjualan 15 toples, oven gas, dll.", "Holiday cookies journal. Margarine costs, flour, 15 jars sales, oven gas, etc.").replace("Nota laci kerajinan bambu & rotan. Ada pesanan dari hotel Sanur, beli cat pelitur, anyaman lampion, dll.", "Bamboo & rattan ledger. Sanur hotel order, varnish paint, lantern weaving, etc.").replace("Buku nota supplier logistik sembako kelontong. Kulakan beras, minyak goreng, sewa kulkas es krim dsb.", "Grocery logistics supplier invoice book. Bulk rice, cooking oil, ice cream freezer rent, etc.")}"
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="h-px bg-gray-200 flex-1" />
                        <span className="px-3 text-[10.5px] font-mono text-gray-400 uppercase tracking-widest">{t("ATAU", "OR")}</span>
                        <div className="h-px bg-gray-200 flex-1" />
                      </div>

                      {/* Camera Upload */}
                      <div className="space-y-2">
                        <span className="block text-xs font-mono font-bold text-gray-700 uppercase">
                          {t("Langkah 2: Ambil Foto Buku Kas Fisik", "Step 2: Capture or Upload Physical Ledger Photo")}
                        </span>

                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-colors ${
                            uploadedImage ? "bg-slate-50 border-blueprint" : "bg-paper border-gray-400 hover:bg-slate-50 hover:border-ink"
                          }`}
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          {uploadedImage ? (
                            <div className="space-y-2">
                              <CheckCircle className="w-8 h-8 text-blueprint mx-auto" />
                              <p className="text-xs text-ink font-semibold">{t("Tergugah: ", "Uploaded: ")}{uploadedFileName}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{t("Ketuk untuk mengganti foto", "Tap to change photo")}</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-ink hover:underline">{t("Ketuk untuk mengambil foto catatan harian", "Tap to capture/upload ledger photo")}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{t("Jpg, Png, Heic maksimal 10MB", "Jpg, Png, Heic max 10MB")}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Metadata Context */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">{t("Periode Bulan Catatan", "Ledger Month Period")}</label>
                        <input
                          type="text"
                          value={customPeriod}
                          onChange={(e) => setCustomPeriod(e.target.value)}
                          placeholder={t("Contoh: Mei 2026", "Example: May 2026")}
                          className="w-full text-xs font-mono p-2 border-2 border-ink focus:outline-none bg-paper focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">{t("Sektor Usaha Catatan", "Ledger Business Sector")}</label>
                        <select
                          value={customBusinessType}
                          onChange={(e) => setCustomBusinessType(e.target.value)}
                          className="w-full text-xs font-mono p-2 border-2 border-ink focus:outline-none bg-paper focus:bg-white"
                        >
                          <option value="makanan">{t("Makanan Rumahan", "Homemade Food")}</option>
                          <option value="kerajinan">{t("Kerajinan Tangan", "Handicrafts")}</option>
                          <option value="warung">{t("Toko Kelontong", "Grocery Shop")}</option>
                          <option value="jasa">{t("Jasa & Servis", "Domestic Services")}</option>
                        </select>
                      </div>
                    </div>

                    {formError && (
                      <div className="p-3 bg-red-50 border-2 border-red-500 text-xs text-red-700">
                        <p className="font-bold uppercase">{t("⚠️ GAGAL MEMULAI DETEKSI", "⚠️ DETECTION FAILED")}</p>
                        <p>{formError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleStartAnalysis}
                      disabled={isProcessing}
                      className={`w-full text-center font-display font-medium text-xs md:text-sm py-4 border-2 border-ink uppercase tracking-wider text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] active:translate-y-0.5 active:translate-x-0.5 cursor-pointer ${
                        isProcessing ? "bg-gray-400 cursor-not-allowed" : "bg-blueprint hover:bg-blue-700"
                      }`}
                    >
                      {isProcessing ? t("Sedang Membaca...", "Analyzing with AI...") : t("Mulai Konversi dengan AI Lens Sekarang", "Start AI Lens Conversion Now")}
                    </button>

                  </div>
                ) : (
                  /* RENDER ACTIVE RESULT EDITOR & SCORECARD VIEW */
                  <div className="tectonic-card bg-white p-5 border-2 border-ink shadow-[4px_4px_0px_0px_#111827] space-y-6">
                    
                    {/* Active Period Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-ink pb-4 gap-4">
                      <div>
                        {isViewingScan ? (
                          <span className="text-[10px] bg-red-600 text-white font-mono uppercase px-2 py-0.5 tracking-wider font-bold">
                            {t("⚠️ SCAN BARU DITELITI (BELUM DISIMPAN KE RIWAYAT)", "⚠️ NEW SCAN UNDER REVIEW (NOT YET SAVED)")}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-blueprint text-white font-mono uppercase px-2 py-0.5 tracking-wider font-bold">
                            {t("✓ RIWAYAT TERSIMPAN DI BUKU KAS SEJARAH", "✓ RECORD SAVED IN HISTORICAL LEDGER")}
                          </span>
                        )}
                        <h3 className="text-xl font-display font-bold text-ink mt-1.5">
                          {t("Bulan: ", "Month: ")}{activeResult.period} ({t("Usaha ", "Business ")}{activeResult.business_type.toUpperCase()})
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {isViewingScan ? (
                          <button
                            onClick={handleSaveToHistory}
                            className="bg-marker-teal text-ink px-4 py-2 text-xs font-mono font-bold uppercase border-2 border-ink shadow-[2px_2px_0px_0px_#111827] hover:shadow-[1px_1px_0px_0px_#111827] transition-all active:translate-y-px cursor-pointer"
                          >
                            {t("💾 Simpan Ke Riwayat Kas", "💾 Save to Ledger History")}
                          </button>
                        ) : (
                          <button
                            onClick={handleExportPDF}
                            className="bg-marker-teal text-ink px-4 py-2 text-xs font-mono font-bold uppercase border-2 border-ink shadow-[2.5px_2.5px_0px_0px_#111827] flex items-center gap-1.5 active:translate-y-px hover:shadow-[1.5px_1.5px_0px_0px_#111827] transition-all cursor-pointer"
                          >
                            <FileDown className="w-4 h-4" /> {t("Cetak PDF Laporan", "Print PDF Report")}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Interactive Table Editor */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-mono font-bold text-gray-500 uppercase">
                          {t("📋 Rincian Transaksi Catatan Harian", "📋 Transaction Details Log")}
                        </span>
                        <span className="text-[10px] text-gray-400 font-sans italic">
                          {t("(Ketuk teks/angka di bawah untuk mengoreksi kesalahan AI secara langsung)", "(Tap text or value below to manually edit and correct AI parsing error)")}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full border-2 border-ink text-left font-mono text-xs">
                          <thead className="bg-slate-50 border-b-2 border-ink">
                            <tr>
                              <th className="p-3 border-r border-ink">{t("KETERANGAN", "DESCRIPTION")}</th>
                              <th className="p-3 border-r border-ink text-center w-28">{t("KATEGORI", "CATEGORY")}</th>
                              <th className="p-3 border-r border-ink text-right w-36">{t("NOMINAL (RP)", "AMOUNT (IDR)")}</th>
                              <th className="p-3 border-r border-ink text-center w-28">{t("AKURASI AI", "AI ACCURACY")}</th>
                              <th className="p-3 text-center w-12">{t("AKSI", "ACTION")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeResult.items.map((item, idx) => (
                              <tr key={idx} className="border-b border-ink hover:bg-neutral-50">
                                
                                {/* Desc */}
                                <td className="p-2 border-r border-ink">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => {
                                      const items = [...activeResult.items];
                                      items[idx].description = e.target.value;
                                      updateActiveData({ ...activeResult, items });
                                    }}
                                    className="w-full bg-transparent font-medium text-ink border-b border-transparent focus:border-blueprint focus:outline-none p-1 text-xs"
                                  />
                                </td>

                                {/* Cat */}
                                <td className="p-2 border-r border-ink text-center">
                                  <select
                                    value={item.category}
                                    onChange={(e) => {
                                      const items = [...activeResult.items];
                                      items[idx].category = e.target.value as any;
                                      
                                      // Recalculate totals
                                      let pemasukan = 0;
                                      let pengeluaran = 0;
                                      items.forEach(it => {
                                        if (it.category === "pemasukan") pemasukan += it.amount || 0;
                                        else if (it.category === "pengeluaran") pengeluaran += it.amount || 0;
                                      });
                                      
                                      updateActiveData({
                                        ...activeResult,
                                        items,
                                        totals: {
                                          pemasukan,
                                          pengeluaran,
                                          laba_bersih: pemasukan - pengeluaran
                                        }
                                      });
                                    }}
                                    className="bg-white border border-ink text-[11px] p-0.5 font-mono focus:outline-none"
                                  >
                                    <option value="pemasukan">{t("PEMASUKAN", "INCOME")}</option>
                                    <option value="pengeluaran">{t("PENGELUARAN", "EXPENSE")}</option>
                                    <option value="unknown">{t("BURAM", "UNCLEAR")}</option>
                                  </select>
                                </td>

                                {/* Amount */}
                                <td className="p-2 border-r border-ink text-right font-bold text-sm">
                                  <div className="flex items-center justify-end gap-1">
                                    <span className="text-gray-400 font-normal text-xs">Rp</span>
                                    <input
                                      type="number"
                                      value={item.amount || 0}
                                      onChange={(e) => {
                                        const items = [...activeResult.items];
                                        items[idx].amount = Number(e.target.value);
                                        
                                        // Recalculate totals
                                        let pemasukan = 0;
                                        let pengeluaran = 0;
                                        items.forEach(it => {
                                          if (it.category === "pemasukan") pemasukan += it.amount || 0;
                                          else if (it.category === "pengeluaran") pengeluaran += it.amount || 0;
                                        });
 
                                        updateActiveData({
                                          ...activeResult,
                                          items,
                                          totals: {
                                            pemasukan,
                                            pengeluaran,
                                            laba_bersih: pemasukan - pengeluaran
                                          }
                                        });
                                      }}
                                      className="w-[100px] bg-transparent text-right font-mono font-bold border-b border-transparent focus:border-blueprint focus:outline-none p-1 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>
                                </td>

                                {/* Accuracy */}
                                <td className="p-2 border-r border-ink text-center">
                                  {item.confidence === "high" ? (
                                    <span className="bg-marker-green border border-ink/40 text-ink text-[9px] px-1.5 py-0.5 font-bold uppercase">
                                      {t("Tinggi (98%)", "High (98%)")}
                                    </span>
                                  ) : (
                                    <span className="bg-marker-orange border border-ink/40 text-ink text-[9px] px-1.5 py-0.5 font-bold uppercase animate-pulse">
                                      {t("Periksa (45%)", "Verify (45%)")}
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => {
                                      const items = activeResult.items.filter((_, i) => i !== idx);
                                      let pemasukan = 0;
                                      let pengeluaran = 0;
                                      items.forEach(it => {
                                        if (it.category === "pemasukan") pemasukan += it.amount || 0;
                                        else if (it.category === "pengeluaran") pengeluaran += it.amount || 0;
                                      });
                                      updateActiveData({
                                        ...activeResult,
                                        items,
                                        totals: {
                                          pemasukan,
                                          pengeluaran,
                                          laba_bersih: pemasukan - pengeluaran
                                        }
                                      });
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1 border border-transparent hover:border-red-300 rounded-sm transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>

                              </tr>
                            ))}

                            {/* Add empty row */}
                            <tr className="bg-gray-50/50">
                              <td colSpan={5} className="p-2 text-left">
                                <button
                                  onClick={() => {
                                    const items = [...activeResult.items, { description: t("Baris Baru (Koreksi)", "New Line (Correction)"), category: "pemasukan", amount: 50000, confidence: "high" } as any];
                                    let pemasukan = 0;
                                    let pengeluaran = 0;
                                    items.forEach(it => {
                                      if (it.category === "pemasukan") pemasukan += it.amount || 0;
                                      else if (it.category === "pengeluaran") pengeluaran += it.amount || 0;
                                    });
                                    updateActiveData({
                                      ...activeResult,
                                      items,
                                      totals: {
                                        pemasukan,
                                        pengeluaran,
                                        laba_bersih: pemasukan - pengeluaran
                                      }
                                    });
                                  }}
                                  className="text-xs font-mono font-semibold text-blueprint hover:underline flex items-center gap-1 uppercase cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> {t("Tambahkan Baris Transaksi Baru (Manual)", "Add New Transaction Row (Manual)")}
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Active Month Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-ink">
                      <div>
                        <span className="text-[9px] font-mono text-gray-500 uppercase block">{t("KAS MASUK (OMSET) BULAN INI", "CASH INFLOW (REVENUE) THIS MONTH")}</span>
                        <strong className="text-lg font-display text-ink block mt-0.5">
                          Rp {activeResult.totals.pemasukan.toLocaleString("id-ID")}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-gray-500 uppercase block">{t("KAS KELUAR (BEBAN) BULAN INI", "CASH OUTFLOW (EXPENSES) THIS MONTH")}</span>
                        <strong className="text-lg font-display text-red-600 block mt-0.5">
                          Rp {activeResult.totals.pengeluaran.toLocaleString("id-ID")}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-gray-500 uppercase block">{t("LABA BERSIH BULAN INI", "NET PROFIT THIS MONTH")}</span>
                        <strong className={`text-lg font-display block mt-0.5 ${activeResult.totals.laba_bersih >= 0 ? "text-blueprint" : "text-red-700"}`}>
                          Rp {activeResult.totals.laba_bersih.toLocaleString("id-ID")}
                        </strong>
                      </div>
                    </div>

                    {/* Mode Toggle Selector (Merchant vs Banker) */}
                    {!isViewingScan && (
                      <div className="flex bg-slate-100 p-0.5 border border-ink rounded-sm">
                        <button
                          onClick={() => setUserRole("merchant")}
                          className={`flex-1 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            userRole === "merchant" ? "bg-ink text-paper" : "hover:bg-slate-200 text-ink"
                          }`}
                        >
                          {t("👤 Mode Sobat UMKM", "👤 UMKM Merchant Mode")}
                        </button>
                        <button
                          onClick={() => setUserRole("banker")}
                          className={`flex-1 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            userRole === "banker" ? "bg-blueprint text-white" : "hover:bg-slate-200 text-ink"
                          }`}
                        >
                          {t("🏦 Mode Analis Kredit Bank (SLIK & Underwriting)", "🏦 Banker Credit Analyst Mode")}
                        </button>
                      </div>
                    )}

                    {/* Merchant Panel View */}
                    {!isViewingScan && userRole === "merchant" && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-start">
                        
                        {/* Sliders and checklists */}
                        <div className="lg:col-span-7 space-y-4">
                          <div className="bg-slate-50 border border-ink p-4 space-y-3">
                            <h5 className="text-xs font-mono font-bold text-ink uppercase">{t("⚙️ Simulasi Plafon KUR Mikro", "⚙️ Micro Loan Limit Simulation")}</h5>
                            
                            <div>
                              <div className="flex justify-between text-xs font-mono text-gray-700">
                                <span>{t("Plafon Pinjaman:", "Loan Limit (Plafon):")}</span>
                                <strong className="text-blueprint">Rp {desiredLoan.toLocaleString("id-ID")}</strong>
                              </div>
                              <input 
                                type="range" 
                                min="5000000" 
                                max="50000000" 
                                step="1000000"
                                value={desiredLoan}
                                onChange={(e) => setDesiredLoan(Number(e.target.value))}
                                className="w-full accent-blueprint mt-1 cursor-pointer h-2 bg-gray-200 border border-ink" 
                                id="loan-limit-slider"
                              />
                            </div>

                            <div>
                              <span className="block text-xs font-mono text-gray-700 mb-1">{t("Tenor Pengembalian (Bulan):", "Repayment Tenor (Months):")}</span>
                              <div className="flex gap-2">
                                {[12, 18, 24].map((tenor) => (
                                  <button
                                    key={tenor}
                                    type="button"
                                    onClick={() => setLoanTenor(tenor)}
                                    className={`flex-1 py-1 text-xs font-mono border border-ink font-bold transition-all ${
                                      loanTenor === tenor ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-gray-100"
                                    }`}
                                  >
                                    {tenor} {t("Bulan", "Months")}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="text-[10px] font-mono text-gray-500 bg-white p-2 border border-dashed border-gray-300 rounded-sm">
                              <div className="flex justify-between">
                                <span>{t("Estimasi Cicilan:", "Est. Installment:")}</span>
                                <strong>Rp {estCicilan.toLocaleString("id-ID")} / {t("bulan", "month")}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Checklists */}
                          <div className="space-y-2">
                            <h5 className="text-xs font-mono font-bold text-ink uppercase">{t("📋 Tindakan Penguatan Kesiapan Kredit", "📋 Credit Readiness Action Items")}</h5>
                            <div className="space-y-2 text-[11px]">
                              <label className="flex items-start gap-2 p-2 bg-paper border border-gray-200 hover:bg-slate-50 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={completedChecklist.rekeningTerpisah} 
                                  onChange={(e) => setCompletedChecklist({ ...completedChecklist, rekeningTerpisah: e.target.checked })}
                                  className="mt-0.5 accent-blueprint"
                                  id="chk-rekening-terpisah"
                                />
                                <div>
                                  <strong className="text-ink block font-semibold">{t("Memisahkan Uang Pribadi & Usaha (+5 Poin)", "Separate Personal & Business Funds (+5 Pts)")}</strong>
                                </div>
                              </label>
                              <label className="flex items-start gap-2 p-2 bg-paper border border-gray-200 hover:bg-slate-50 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={completedChecklist.nibTerdaftar} 
                                  onChange={(e) => setCompletedChecklist({ ...completedChecklist, nibTerdaftar: e.target.checked })}
                                  className="mt-0.5 accent-blueprint"
                                  id="chk-nib-terdaftar"
                                />
                                <div>
                                  <strong className="text-ink block font-semibold">{t("Sudah Memiliki NIB (Nomor Induk Berusaha) (+5 Poin)", "Business ID (NIB) Registered (+5 Pts)")}</strong>
                                </div>
                              </label>
                              <label className="flex items-start gap-2 p-2 bg-paper border border-gray-200 hover:bg-slate-50 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={completedChecklist.catatanKonsisten} 
                                  onChange={(e) => setCompletedChecklist({ ...completedChecklist, catatanKonsisten: e.target.checked })}
                                  className="mt-0.5 accent-blueprint"
                                  id="chk-catatan-konsisten"
                                />
                                <div>
                                  <strong className="text-ink block font-semibold">{t("Konsistensi Catatan >= 3 Bulan (+5 Poin)", "Consistent Record Keeping >= 3 Months (+5 Pts)")}</strong>
                                </div>
                              </label>
                              <label className="flex items-start gap-2 p-2 bg-sky-50 border border-sky-200 hover:bg-sky-100/70 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={useAltData} 
                                  onChange={(e) => setUseAltData(e.target.checked)}
                                  className="mt-0.5 accent-blueprint"
                                  id="chk-alt-data"
                                />
                                <div>
                                  <strong className="text-sky-900 block font-semibold">{t("Gunakan Data Alternatif (UU P2SK) (+10 Poin)", "Use Alternative Data (UU P2SK) (+10 Pts)")}</strong>
                                </div>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Visual Diagnostics */}
                        <div className="lg:col-span-5 space-y-4">
                          <div className={`p-4 border-2 border-ink rounded-sm space-y-2 text-xs ${gradeColor}`}>
                            <h6 className="font-mono font-bold uppercase">
                              {creditGrade === "A" && t("✅ Rekomendasi: Layak Pengajuan KUR", "✅ Recommendation: Eligible for Micro Loan")}
                              {creditGrade === "B" && t("⚠️ Rekomendasi: Kelayakan Bersyarat", "⚠️ Recommendation: Conditional Eligibility")}
                              {creditGrade === "C" && t("🚨 Rekomendasi: Perlu Perbaikan Arus Kas", "🚨 Recommendation: Cash Flow Improvement Needed")}
                            </h6>
                            <p className="leading-relaxed font-sans font-medium text-[11px]">
                              {creditGrade === "A" && (
                                t(`Selamat! Rasio DSCR (${dscr.toFixed(2)}x) Anda berada di atas ambang batas minimal bank (> 1.25x) dengan skor kesiapan ${score}/100. Sisa rata-rata laba bulanan Anda (Rp ${avgMonthlyLaba.toLocaleString("id-ID")}) dinilai aman untuk melunasi cicilan Rp ${estCicilan.toLocaleString("id-ID")}/bulan.`,
                                  `Congratulations! Your DSCR ratio (${dscr.toFixed(2)}x) is above the bank's minimum threshold (> 1.25x) with a readiness score of ${score}/100. Your average monthly net profit (Rp ${avgMonthlyLaba.toLocaleString("id-ID")}) is considered safe to cover the monthly installment of Rp ${estCicilan.toLocaleString("id-ID")}/month.`)
                              )}
                              {creditGrade === "B" && (
                                t(`Kapasitas bayar cukup (${dscr.toFixed(2)}x), namun skor kesiapan Anda sedang (${score}/100). Bank mungkin merekomendasikan plafon di bawah Rp ${desiredLoan.toLocaleString("id-ID")}. Lengkapi checklist legalitas NIB untuk memperkuat data!`,
                                  `Repayment capacity is sufficient (${dscr.toFixed(2)}x), but your readiness score is moderate (${score}/100). The bank might recommend a loan limit below Rp ${desiredLoan.toLocaleString("id-ID")}. Complete the Business ID (NIB) checklist to strengthen your profile!`)
                              )}
                              {creditGrade === "C" && (
                                t(`Rasio pembayaran (${dscr.toFixed(2)}x) di bawah batas aman bank (< 1.0x). Rata-rata keuntungan Rp ${avgMonthlyLaba.toLocaleString("id-ID")} terlalu kecil untuk menanggung angsuran Rp ${estCicilan.toLocaleString("id-ID")}/bulan. Turunkan plafon pengajuan.`,
                                  `Repayment ratio (${dscr.toFixed(2)}x) is below the bank's safety threshold (< 1.0x). The average profit of Rp ${avgMonthlyLaba.toLocaleString("id-ID")} is too small to cover the installment of Rp ${estCicilan.toLocaleString("id-ID")}/month. Please lower the simulated loan limit.`)
                              )}
                            </p>
                          </div>

                          <div className="bg-[#EFFAFE] border border-[#BDEAFB] p-4 rounded-sm text-xs space-y-1">
                            <h6 className="font-mono font-semibold text-sky-900 uppercase">{t("📢 Interpretasi Bebas Jargon", "📢 Jargon-Free Interpretation")}</h6>
                            <p className="text-sky-800 text-[11px] leading-relaxed">
                              "{t("Berdasarkan performa", "Based on performance from the last")} <strong>{historicalPeriods.length} {t("bulan terakhir", "months")}</strong>, {t("sisa laba bersih bulanan Anda dinilai", "your average monthly net profit is considered")} <strong>{creditGrade === "A" ? t("sangat aman", "very secure") : (creditGrade === "B" ? t("cukup memadai", "adequate") : t("kurang memadai", "insufficient"))}</strong> {t("untuk menanggung pengajuan kredit sebesar", "to cover a loan application of")} <strong>Rp {desiredLoan.toLocaleString("id-ID")}</strong>."
                            </p>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Banker Mode Panel View */}
                    {!isViewingScan && userRole === "banker" && (
                      <div className="space-y-6 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="border-2 border-ink p-3 bg-slate-50 space-y-1">
                            <span className="text-[9px] font-mono text-gray-400 block">{t("1. STATUS SLIK / OJK", "1. SLIK / OJK STATUS")}</span>
                            <strong className="text-xs text-emerald-700 block">{t("🟢 KOL-1 (LANCAR)", "🟢 KOL-1 (CURRENT)")}</strong>
                            <p className="text-[9px] text-gray-500 font-sans leading-tight">{t("Nasabah tidak memiliki tunggakan pembiayaan lain.", "The borrower has no outstanding arrears on other financing.")}</p>
                          </div>
                          <div className="border-2 border-ink p-3 bg-slate-50 space-y-1">
                            <span className="text-[9px] font-mono text-gray-400 block">{t("2. TREN VOLATILITAS", "2. VOLATILITY TREND")}</span>
                            <strong className="text-xs text-blueprint block">{t("📈 BERTUMBUH STABIL", "📈 STABLE GROWTH")}</strong>
                            <p className="text-[9px] text-gray-500 font-sans leading-tight">{t("Rata-rata pertumbuhan: +37.6% per bulan.", "Average growth rate: +37.6% per month.")}</p>
                          </div>
                          <div className="border-2 border-ink p-3 bg-slate-50 space-y-1">
                            <span className="text-[9px] font-mono text-gray-400 block">{t("3. PELUANG GAGAL BAYAR", "3. DEFAULT PROBABILITY")}</span>
                            <strong className="text-xs text-emerald-700 block">{t(`🛡️ RISIKO RENDAH (${creditGrade})`, `🛡️ LOW RISK (${creditGrade})`)}</strong>
                            <p className="text-[9px] text-gray-500 font-sans leading-tight">{t("Risiko default tertutup oleh rasio keuntungan > 25%.", "Default risk mitigated by net profit margin > 25%.")}</p>
                          </div>
                          <div className="border-2 border-ink p-3 bg-slate-50 space-y-1">
                            <span className="text-[9px] font-mono text-gray-400 block">{t("4. LIMIT REKOMENDASI", "4. RECOMMENDED LIMIT")}</span>
                            <strong className="text-xs text-ink block">Rp {Math.round(avgMonthlyLaba * 10).toLocaleString("id-ID")}</strong>
                            <p className="text-[9px] text-gray-500 font-sans leading-tight">{t("Estimasi limit aman tanpa agunan tambahan.", "Estimated safe limit without physical collateral.")}</p>
                          </div>
                        </div>

                        {/* SLIK OJK Section */}
                        <div className="border-2 border-ink bg-white p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-blueprint uppercase tracking-widest font-bold flex items-center gap-1">
                              {t("🛡️ Verifikasi OJK SLIK & BI Checking", "🛡️ OJK SLIK & BI Checking Verification")}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowSlikDetails(!showSlikDetails)}
                              className="text-xs font-mono font-bold text-blueprint hover:underline uppercase cursor-pointer"
                            >
                              {showSlikDetails ? t("✕ Sembunyikan Detail", "✕ Hide Details") : t("🔍 Lihat Laporan SLIK Lengkap", "🔍 View Full SLIK Report")}
                            </button>
                          </div>
                          
                          {showSlikDetails ? (
                            <div className="bg-slate-900 text-emerald-400 p-4 font-mono text-[10.5px] border-2 border-ink rounded-sm space-y-3 leading-relaxed shadow-inner max-h-60 overflow-y-auto">
                              <div className="border-b border-emerald-800 pb-2">
                                <p className="font-bold text-center text-white">{t("REPUBLIK INDONESIA — OTORITAS JASA KEUANGAN (OJK)", "REPUBLIC OF INDONESIA — FINANCIAL SERVICES AUTHORITY (OJK)")}</p>
                                <p className="text-center text-[9px] text-emerald-500">{t("SISTEM LAYANAN INFORMASI KEUANGAN (SLIK) | TERCETAK OTOMATIS", "FINANCIAL INFORMATION SERVICE SYSTEM (SLIK) | AUTOMATED REPORT")}</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                                <p>{t("Nama Debitur:", "Debtor Name:")} <span className="text-white">{(userProfile.ownerName || "DEBITUR DEMO").toUpperCase()}</span></p>
                                <p>{t("NIK Verifikasi:", "Verified National ID (NIK):")} <span className="text-white">3174092804****** {t("(TERCOCOKKAN)", "(MATCHED)")}</span></p>
                                <p>{t("Status Kelayakan:", "Eligibility Status:")} <span className="text-white">{t("KOL-1 (LANCAR)", "KOL-1 (CURRENT)")}</span></p>
                                <p>{t("Skor Kredit BI Checking:", "BI Checking Credit Score:")} <span className="text-white">785 / 900 {t("(SANGAT BAIK)", "(EXCELLENT)")}</span></p>
                              </div>
                              <div className="border-t border-emerald-800 pt-2 space-y-1">
                                <p className="text-white font-bold">{t("FASILITAS KREDIT AKTIF:", "ACTIVE CREDIT FACILITIES:")}</p>
                                <p>1. [BANK RAKYAT INDONESIA] — {t("Kredit Mikro KUR — Kolektibilitas 1 (Lancar)", "Micro KUR Loan — Collectibility 1 (Current)")} | {t("Plafon", "Limit")} Rp 10.000.000 (Outstanding: Rp 2.400.000)</p>
                                <p>2. [PEGADAIAN] — {t("Gadai Emas — Kolektibilitas 1 (Lancar)", "Gold Pawn — Collectibility 1 (Current)")} | {t("Plafon", "Limit")} Rp 5.000.000 ({t("Lunas", "Settled")})</p>
                              </div>
                              <div className="border-t border-emerald-800 pt-2 text-[9px] text-emerald-500 italic">
                                {t("PEMBERITAHUAN: Debitur bersih dari catatan hitam perbankan, tuntutan hukum perdata, maupun laporan fraud nasional.", "NOTICE: Debtor is clean from banking blacklists, civil lawsuits, and national fraud databases.")}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 rounded-sm flex justify-between items-center">
                              <p>✓ {t("Debitur berstatus KOL-1 (LANCAR). Tidak ada kredit macet terdeteksi di database OJK.", "Debtor is rated KOL-1 (CURRENT). No bad debts detected in OJK database.")}</p>
                              <span className="text-[9px] bg-emerald-600 text-white font-mono px-2 py-0.5 font-bold">SLIK CLEAR</span>
                            </div>
                          )}
                        </div>

                        {/* Alternative Scoring Visualizer */}
                        {useAltData && (
                          <div className="border-2 border-ink bg-[#F5FBFF] p-4 space-y-3">
                            <span className="text-[10px] font-mono text-sky-800 uppercase tracking-widest font-bold block">
                              {t("📊 INTEGRASI ALTERNATIVE CREDIT SCORING (UU P2SK)", "📊 ALTERNATIVE CREDIT SCORING INTEGRATION (UU P2SK)")}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                              <div className="bg-white p-2.5 border border-sky-200">
                                <span className="text-[9px] text-gray-400 block uppercase font-bold">{t("1. Konsistensi Tagihan PLN", "1. Utility Bill Consistency (PLN)")}</span>
                                <strong className="text-sky-900 text-[11px] block mt-0.5">{t("🟢 100% TEPAT WAKTU (12 BLN)", "🟢 100% ON TIME (12 MOS)")}</strong>
                                <span className="text-[9px] text-gray-500 block leading-tight mt-0.5">{t("Rata-rata tagihan bulanan: Rp 280.000", "Avg monthly bill: Rp 280,000")}</span>
                              </div>
                              <div className="bg-white p-2.5 border border-sky-200">
                                <span className="text-[9px] text-gray-400 block uppercase font-bold">{t("2. Riwayat Pulsa & Paket Data", "2. Airtime & Data History")}</span>
                                <strong className="text-sky-900 text-[11px] block mt-0.5">{t("🟢 SKOR STABILITAS TINGGI", "🟢 HIGH STABILITY SCORE")}</strong>
                                <span className="text-[9px] text-gray-500 block leading-tight mt-0.5">{t("Pengisian rutin: Rp 120.000/bln (Telkomsel)", "Routine top-up: Rp 120,000/mo (Telkomsel)")}</span>
                              </div>
                              <div className="bg-white p-2.5 border border-sky-200">
                                <span className="text-[9px] text-gray-400 block uppercase font-bold">{t("3. Volume e-Wallet (Gopay/OVO)", "3. e-Wallet Volume (Gopay/OVO)")}</span>
                                <strong className="text-sky-900 text-[11px] block mt-0.5">{t("🟢 Rp 3.250.000 / BULAN", "🟢 Rp 3,250,000 / MONTH")}</strong>
                                <span className="text-[9px] text-gray-500 block leading-tight mt-0.5">{t("Turnover transaksi penjualan non-tunai", "Non-cash sales turnover")}</span>
                              </div>
                              <div className="bg-white p-2.5 border border-sky-200">
                                <span className="text-[9px] text-gray-400 block uppercase font-bold">{t("4. Penilaian Seller E-Commerce", "4. E-Commerce Seller Rating")}</span>
                                <strong className="text-sky-900 text-[11px] block mt-0.5">{t("🟢 4.9/5 RATING TOKO", "🟢 4.9/5 STORE RATING")}</strong>
                                <span className="text-[9px] text-gray-500 block leading-tight mt-0.5">{t("150+ Ulasan Positif (Shopee/Tokopedia)", "150+ Positive Reviews (Shopee/Tokopedia)")}</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-sky-700 leading-normal">
                              💡 <strong>{t("Efek UU P2SK:", "UU P2SK Impact:")}</strong> {t("Integrasi telekomunikasi dan riwayat dompet digital memberikan tambahan keyakinan", "Integration of telecom and digital wallet history adds an extra")} <strong>+10 {t("poin", "points")}</strong> {t("ke scorecard kesiapan kredit nasabah.", "to the debtor's credit readiness scorecard.")}
                            </p>
                          </div>
                        )}

                        <div className="bg-slate-50 border-2 border-ink p-4 space-y-3">
                          <h5 className="font-mono text-xs font-bold text-ink uppercase border-b border-ink/10 pb-1.5">
                            {t("🔍 KELAYAKAN FINANSIAL KONSOLIDASI (AVERAGE PERFORMANCE)", "🔍 CONSOLIDATED FINANCIAL ELIGIBILITY (AVERAGE PERFORMANCE)")}
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                            <div>
                              <span className="text-gray-400">{t("RATA-RATA OMSET:", "AVERAGE REVENUE (OMSET):")}</span>
                              <p className="font-bold text-ink">Rp {avgMonthlyOmset.toLocaleString("id-ID")}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">{t("RATA-RATA LABA BERSIH:", "AVERAGE NET PROFIT:")}</span>
                              <p className="font-bold text-ink">Rp {avgMonthlyLaba.toLocaleString("id-ID")}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">{t("RASIO DSCR:", "DSCR RATIO:")}</span>
                              <p className={`font-bold ${dscr >= 1.25 ? "text-emerald-700" : "text-red-700"}`}>{dscr.toFixed(2)}x</p>
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50 border border-blue-200 text-[11px] text-blue-800 rounded-sm font-sans">
                            <strong>💡 {t("Evaluasi Underwriter AI:", "AI Underwriter Evaluation:")}</strong> {t("Usaha", "The business")} <strong>{userProfile.businessName || t("UMKM Binaan", "Partner MSME")}</strong> {t("menunjukkan konsistensi arus kas sehat selama", "shows a consistent and healthy cash flow over the last")} {historicalPeriods.length} {t("bulan terakhir. Sisa rata-rata laba bulanan menutup cicilan simulasi", "months. The average monthly net profit covers the simulated installment of")} Rp {estCicilan.toLocaleString("id-ID")}/{t("bulan", "month")} {t("dengan safety margin", "with a safety margin of")} {dscr.toFixed(1)}{t("x lipat. Kelayakan agunan non-fisik (UU P2SK) dinilai memadai.", "x. Eligibility based on alternative collateral (UU P2SK) is rated as adequate.")}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-ink/10">
                            <span className="text-[9px] text-gray-400 font-mono">GEMINI AUTOMATED UNDERWRITING V1.2</span>
                            <button
                              onClick={handleExportPDF}
                              className="bg-blueprint text-white px-4 py-2 font-mono font-bold text-[10px] uppercase border-2 border-ink shadow-[2px_2px_0px_0px_#111827] hover:bg-blue-700 cursor-pointer"
                            >
                              {t("✍️ Terbitkan Surat Rekomendasi & Cetak", "✍️ Issue Recommendation Letter & Print")}
                            </button>
                          </div>
                        </div>

                        {/* Banker Decision Workflow Card */}
                        <div className="border-2 border-ink bg-white p-4 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          <h5 className="font-mono text-xs font-bold text-ink uppercase border-b border-ink/10 pb-1.5 flex items-center justify-between">
                            <span>{t("✍️ WORKFLOW KEPUTUSAN KREDIT ANALIS", "✍️ CREDIT ANALYST DECISION WORKFLOW")}</span>
                            <span className="bg-blueprint text-white text-[9px] px-2 py-0.5 font-bold">{t("BANKER CONTROL PANEL", "BANKER CONTROL PANEL")}</span>
                          </h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-mono text-gray-700 font-bold mb-1">{t("Status Rekomendasi Underwriting:", "Underwriting Recommendation Status:")}</label>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setUnderwriteStatus("approved")}
                                    className={`flex-1 py-2 font-mono font-bold text-xs border border-ink uppercase transition-all cursor-pointer ${
                                      underwriteStatus === "approved" ? "bg-emerald-600 text-white shadow-sm" : "bg-paper text-ink hover:bg-slate-50"
                                    }`}
                                  >
                                    {t("🟢 Setujui (Approve)", "🟢 Approve")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setUnderwriteStatus("rejected")}
                                    className={`flex-1 py-2 font-mono font-bold text-xs border border-ink uppercase transition-all cursor-pointer ${
                                      underwriteStatus === "rejected" ? "bg-red-600 text-white shadow-sm" : "bg-paper text-ink hover:bg-slate-50"
                                    }`}
                                  >
                                    {t("🔴 Tolak (Reject)", "🔴 Reject")}
                                  </button>
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex justify-between text-xs font-mono text-gray-700 font-bold mb-1">
                                  <span>{t("Plafon yang Disetujui (IDR):", "Approved Loan Limit (IDR):")}</span>
                                  <strong className="text-blueprint">Rp {approvedLoanAmount.toLocaleString("id-ID")}</strong>
                                </div>
                                <input
                                  type="range"
                                  min="5000000"
                                  max={desiredLoan}
                                  step="1000000"
                                  value={approvedLoanAmount}
                                  onChange={(e) => setApprovedLoanAmount(Number(e.target.value))}
                                  disabled={underwriteStatus === "rejected"}
                                  className="w-full accent-blueprint mt-1 cursor-pointer h-2 bg-gray-200 border border-ink disabled:opacity-50"
                                  id="banker-approved-slider"
                                />
                                <span className="text-[9px] text-gray-400 font-mono block mt-1">{t(`Maksimum disetujui dibatasi sebesar plafon permohonan Rp ${desiredLoan.toLocaleString("id-ID")}.`, `Maximum approved amount is capped at the requested limit of Rp ${desiredLoan.toLocaleString("id-ID")}.`)}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-xs font-mono text-gray-700 font-bold">{t("Catatan Keputusan / Memo Underwriter:", "Decision Notes / Underwriter Memo:")}</label>
                              <textarea
                                value={underwriterNotes}
                                onChange={(e) => setUnderwriterNotes(e.target.value)}
                                placeholder={t("Masukkan catatan pertimbangan kredit (contoh: Arus kas stabil, didukung data PLN, agunan berupa prospek usaha nastar Lebaran dinilai aman).", "Enter credit consideration notes (e.g., Stable cash flow, supported by utility bills, micro-business prospect is rated safe).")}
                                className="w-full h-[95px] text-xs font-sans p-2 border-2 border-ink focus:outline-none bg-paper focus:bg-white resize-none"
                              />
                            </div>
                          </div>

                          {underwriteStatus !== "pending" && (
                            <div className={`p-4 border-2 border-dashed flex flex-col sm:flex-row items-center justify-between gap-4 ${
                              underwriteStatus === "approved" ? "bg-emerald-50 border-emerald-500 text-emerald-950" : "bg-red-50 border-red-500 text-red-950"
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-14 h-14 flex items-center justify-center font-bold font-display border-2 uppercase rotate-[-6deg] text-[10px] tracking-tight ${
                                  underwriteStatus === "approved" ? "border-emerald-600 text-emerald-600 bg-white" : "border-red-600 text-red-600 bg-white"
                                }`}>
                                  {underwriteStatus === "approved" ? t("DISETUJUI", "APPROVED") : t("DITOLAK", "REJECTED")}
                                </div>
                                <div>
                                  <h6 className="text-xs font-bold uppercase font-mono">
                                    {underwriteStatus === "approved" ? t("Kredit Lolos Underwriting Otorisasi", "Credit Request Approved") : t("Permohonan Kredit Tidak Disetujui", "Credit Request Rejected")}
                                  </h6>
                                  <p className="text-[10px] font-sans mt-0.5 leading-snug">
                                    {underwriteStatus === "approved" 
                                      ? t(`Plafon Rp ${approvedLoanAmount.toLocaleString("id-ID")} disetujui dengan tenor ${loanTenor} bulan. Memo underwriting tersimpan.`, `Approved limit of Rp ${approvedLoanAmount.toLocaleString("id-ID")} with a ${loanTenor}-month tenor. Underwriter memo saved.`)
                                      : t("Arus kas dinilai terlalu berisiko atau DSCR berada di bawah batas aman (1.0x). Memerlukan perbaikan omset.", "Cash flow is too risky or DSCR is below safety threshold (1.0x). Revenue improvement is required.")
                                    }
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={handleExportPDF}
                                className={`px-4 py-2 font-mono font-bold text-xs uppercase border-2 border-ink shadow-[2.5px_2.5px_0px_0px_#111827] active:translate-y-px transition-all hover:bg-slate-100 cursor-pointer ${
                                  underwriteStatus === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {t("🖨️ Cetak Rekomendasi Resmi", "🖨️ Print Official Recommendation")}
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                    {/* Historical Trend Chart (Visual Real Multi-Month Data) */}
                    {!isViewingScan && historicalPeriods.length > 0 && (
                      <div className="border border-ink bg-slate-50 p-4 space-y-3">
                        <span className="text-[10px] font-mono text-blueprint uppercase tracking-widest font-bold block">
                          {t(`📈 TREN KINERJA KEUANGAN USAHA (${historicalPeriods.length} BULAN TERAKHIR)`, `📈 BUSINESS FINANCIAL PERFORMANCE TREND (LAST ${historicalPeriods.length} MONTHS)`)}
                        </span>
                        
                        <div className="h-48 pt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={historicalPeriods.map(p => ({
                                name: p.period,
                                Omset: p.totals.pemasukan,
                                Beban: p.totals.pengeluaran,
                                Laba: p.totals.laba_bersih
                              }))}
                              margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: "monospace" }} />
                              <YAxis tick={{ fontSize: 9, fontFamily: "monospace" }} />
                              <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString("id-ID")}`} labelStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                              <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace" }} />
                              <Bar dataKey="Omset" fill="#0e7490" name={t("Omset", "Revenue")} />
                              <Bar dataKey="Beban" fill="#ef4444" name={t("Beban", "Expenses")} />
                              <Line type="monotone" dataKey="Laba" stroke="#16a34a" strokeWidth={3} name={t("Laba Bersih", "Net Profit")} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Official Banking Law Disclaimer */}
                    <div className="border-t border-gray-200 pt-4 mt-6">
                      <p className="text-[9px] text-gray-400 font-mono italic leading-relaxed text-center bg-gray-50 p-2.5 border border-gray-200">
                        📄 <strong>{t("Pemberitahuan Kelayakan Hukum:", "Legal Eligibility Notice:")}</strong> {t("Laporan konsolidasi ini disusun secara otomatis oleh AI berdasarkan data buku kas harian yang diinput pemohon. Bukan dokumen teraudit akuntan publik. Dipergunakan murni untuk kebutuhan pre-screening pengajuan pembiayaan mikro.", "This consolidated report is compiled automatically by AI based on daily ledger data entered by the applicant. It is not an audited document by a certified public accountant and is used purely for pre-screening micro-financing applications.")}
                      </p>
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ==================== SCREEN 3: CITATIONS HUB / ABOUT SECTION ==================== */}
        {activeTab === "citations" && (
          <div className="space-y-8">
            
            {/* Citations Dashboard Headline */}
            <div className="tectonic-card bg-white p-6 border-2 border-ink shadow-[4px_4px_0px_0px_#111827]">
              <span className="text-xs font-mono text-blueprint uppercase tracking-widest font-bold">{t("UMKM LENS RESEARCH METHODOLOGY", "UMKM LENS RESEARCH METHODOLOGY")}</span>
              <h2 className="text-3xl font-display font-bold text-ink mt-1">{t("Daftar Pustaka & Sourcing Data", "Bibliography & Data Sourcing")}</h2>
              <p className="text-xs text-gray-500 mt-2 max-w-3xl leading-relaxed">
                {t("Kami membangun aplikasi ini berdasarkan dedikasi akademik dan pengumpulan riset primer keuangan mikro nasional. Semua data, kegagalan kredit, dan margin kekeliruan didukung oleh sumber terpercaya.", "We built this application based on academic dedication and primary research data collection on national micro-finance. All data, credit failures, and error margins are supported by trusted sources.")}
              </p>
            </div>

            {/* Sourced Data Tree */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white border border-ink p-5 space-y-4 shadow-sm">
                <span className="bg-marker-yellow text-ink text-[10px] uppercase font-mono px-2 py-0.5 font-bold inline-block border border-ink">
                  {t("Layer 1 & 2: Gap Akses Pembiayaan", "Layer 1 & 2: Financing Access Gap")}
                </span>
                
                <div className="space-y-4">
                  <div className="border-l-2 border-ink pl-3">
                    <p className="text-xs text-gray-500 font-mono">BI REPORT SUM (2023)</p>
                    <p className="text-sm font-semibold text-ink leading-snug">{t("Hanya 30% UMKM Tersentuh Kredit Formal", "Only 30% of MSMEs Have Access to Formal Credit")}</p>
                    <p className="text-xs text-gray-600 mt-1 font-sans">
                      {t("Diperkuat oleh World Bank (2024), 30% pengusaha mikro baru mengandalkan teknologi neo-fintech setelah ditolak oleh validasi Laporan Keuangan perbankan konvensional.", "Supported by World Bank (2024), 30% of new micro-entrepreneurs rely on neo-fintech technology after being rejected by conventional banking financial statement validation.")}
                    </p>
                  </div>

                  <div className="border-l-2 border-ink pl-3">
                    <p className="text-xs text-gray-500 font-mono">SURVEI NASIONAL LITERASI OJK (2024)</p>
                    <p className="text-sm font-semibold text-ink leading-snug">{t("Tingkat Literasi Finansial Pengusaha Mikro Hanya 65.43%", "Financial Literacy Rate of Micro-Entrepreneurs is Only 65.43%")}</p>
                    <p className="text-xs text-gray-600 mt-1 font-sans">
                      {t("Eksklusi terjadi murni karena fobia formulir perbankan berkas yang berlapis-lapis dan keharusan menguasai software akuntansi manual.", "Exclusion occurs purely due to phobia of multi-layered banking forms and the requirement to master manual accounting software.")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-ink p-5 space-y-4 shadow-sm">
                <span className="bg-marker-orange text-ink text-[10px] uppercase font-mono px-2 py-0.5 font-bold inline-block border border-ink">
                  {t("Layer 3 & 4: Kerangka Hukum & UU P2SK", "Layer 3 & 4: Legal Framework & UU P2SK")}
                </span>

                <div className="space-y-4">
                  <div className="border-l-2 border-ink pl-3">
                    <p className="text-xs text-gray-500 font-mono">REFORMASI FINANSIAL: UU NO. 4 TAHUN 2023</p>
                    <p className="text-sm font-semibold text-ink leading-snug">{t("Sinergi UU P2SK Pasal Komite Regulasi Finansial", "Synergy of UU P2SK Financial Regulation Committee Article")}</p>
                    <p className="text-xs text-gray-600 mt-1 font-sans">
                      {t("Mendirikan kerangka regulasi inklusif di mana teknologi diwajibkan memberikan kontribusi konkret sebagai perpanjangan tangan edukasi ke masyarakat terbawah.", "Establishing an inclusive regulatory framework where technology is required to make concrete contributions as an extension of education to the grassroots.")}
                    </p>
                  </div>

                  <div className="border-l-2 border-ink pl-3">
                    <p className="text-xs text-gray-500 font-mono">KEMENTERIAN KOPERASI & UKM (2024)</p>
                    <p className="text-sm font-semibold text-ink leading-snug">{t("Target UMKM Credit Ratio 30%", "Target MSME Credit Ratio 30%")}</p>
                    <p className="text-xs text-gray-600 mt-1 font-sans">
                      {t("Pemerintah mengandalkan alternatif data (Alternative Credit Scoring) seperti riwayat pembayaran telco dan tagihan listrik untuk mengatasi ketiadaan buku tabungan penjamin.", "The government relies on alternative data (Alternative Credit Scoring) such as telco payment histories and electricity bills to overcome the lack of collateral/passbooks.")}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Clear Disclaimer regarding peer review */}
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-sm">
              <h4 className="text-xs font-mono font-bold text-amber-800 uppercase flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" /> {t("Catatan Reviewer Penelitian", "Research Reviewer Notes")}
              </h4>
              <p className="text-xs text-amber-700 leading-relaxed font-sans mt-1">
                {t("Data penolakan perbankan 60% s.d 70% dikutip lewat tinjauan literatur jurnal sekunder (JOUMI, 2025). Jika didayagunakan untuk pengajuan riset akademik formal, diwajibkan merujuk kembali secara komparatif pada dokumen asli Laporan Tahunan Departemen Pengembangan UMKM Bank Indonesia untuk presisi taktis maksimal.", "The banking rejection data of 60% to 70% is cited from a secondary journal literature review (JOUMI, 2025). If used for formal academic research submissions, it is required to refer back comparatively to the original Annual Report of the MSME Development Department of Bank Indonesia for maximum tactical precision.")}
              </p>
            </div>

          </div>
        )}

      </main>

      {/* Raw Print layout overlay stylesheet configured properly */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, nav, button, .no-print, input, select, #onboarding-form, #analytics-simulator, .tectonic-card h4, .bg-blue-50 {
            display: none !important;
          }
          .tectonic-card {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          table {
            border: 1px solid black !important;
            font-size: 10px !important;
          }
          th, td {
            border: 1px solid black !important;
            padding: 4px !important;
          }
          thead {
            background-color: #eee !important;
          }
          /* ensure only the resulting report matches */
          section {
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Footer bar */}
      <footer className="bg-ink text-zinc-400 border-t-4 border-black py-8 mt-12 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center md:text-left">
            <p className="text-paper font-bold tracking-tight">{t("UMKM LENS LITERASI PREDIKTIF", "UMKM LENS PREDICTIVE LITERACY")}</p>
            <p className="text-[10px] text-zinc-500">{t("Kecerdasan Buatan Terbuka Untuk Akselerasi Finansial Desa Mandiri Indonesia", "Open Artificial Intelligence for Financial Acceleration of Self-Reliant Indonesian Villages")}</p>
          </div>
          <p className="text-[10px] text-zinc-500 text-center md:text-right">
            {t("© 2026 UMKM Lens Project. Hak Cipta Dilindungi Undang-Undang. Sesuai Kebijakan Literasi Nasional OJK & Kemenkop UKM.", "© 2026 UMKM Lens Project. All Rights Reserved. In accordance with OJK & Kemenkop UKM National Literacy Policies.")}
          </p>
        </div>
      </footer>

    </div>
  );
}
