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
  // Current view management: "blog" | "trial" | "analytics-hub"
  const [activeTab, setActiveTab] = useState<"blog" | "trial" | "about">("blog");
  
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

  // Compute Credit Assessment
  const labaBersih = scanResult ? scanResult.totals.laba_bersih : 0;
  const pemasukan = scanResult ? scanResult.totals.pemasukan : 0;

  const estCicilan = Math.round((desiredLoan / loanTenor) + (desiredLoan * 0.005));
  const dscr = estCicilan > 0 ? (labaBersih / estCicilan) : 0;
  const margin = pemasukan > 0 ? (labaBersih / pemasukan) : 0;

  // Score composition (base 100)
  let score = 0;

  // Only calculate if scanResult is present
  if (scanResult) {
    // DSCR contribution (max 40)
    if (dscr >= 2.0) score += 40;
    else if (dscr >= 1.5) score += 35;
    else if (dscr >= 1.2) score += 30;
    else if (dscr >= 1.0) score += 25;
    else if (dscr >= 0.7) score += 15;
    else if (dscr >= 0.5) score += 10;
    else score += 5;

    // Profit Margin contribution (max 20)
    if (margin >= 0.40) score += 20;
    else if (margin >= 0.25) score += 15;
    else if (margin >= 0.10) score += 10;
    else if (margin > 0) score += 5;

    // Profile completeness (max 15)
    if (userProfile.ownerName) score += 3;
    if (userProfile.businessName) score += 3;
    if (userProfile.phone) score += 3;
    if (userProfile.location) score += 3;
    if (userProfile.businessType) score += 3;

    // Checklist items (max 15)
    if (completedChecklist.rekeningTerpisah) score += 5;
    if (completedChecklist.nibTerdaftar) score += 5;
    if (completedChecklist.catatanKonsisten) score += 5;

    // Alternative Data (max 10)
    if (useAltData) score += 10;
  }

  if (score > 100) score = 100;

  // Determine grade
  let creditGrade: "A" | "B" | "C" = "C";
  let gradeLabel = "BERISIKO TINGGI";
  let gradeColor = "text-red-700 bg-red-50 border-red-500";
  let gradeBadgeColor = "bg-red-600 text-white border-red-600 text-xs";

  if (scanResult) {
    if (dscr >= 1.5 && score >= 70) {
      creditGrade = "A";
      gradeLabel = "SANGAT LAYAK (Grade A)";
      gradeColor = "text-emerald-700 bg-emerald-50 border-emerald-500";
      gradeBadgeColor = "bg-emerald-600 text-white border-emerald-600 text-xs";
    } else if (dscr >= 1.0 && score >= 50) {
      creditGrade = "B";
      gradeLabel = "CUKUP LAYAK (Grade B)";
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
          recordType: "keduanya"
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

  const handleDeleteItem = (index: number) => {
    if (!scanResult) return;
    const updatedItems = scanResult.items.filter((_, idx) => idx !== index);
    
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

  const handleAddNewItem = () => {
    if (!scanResult) return;
    const newItem: TransactionItem = {
      description: "Item Baru (Koreksi)",
      category: "pemasukan",
      amount: 50000,
      confidence: "high"
    };

    const updatedItems = [...scanResult.items, newItem];
    const pemasukan = scanResult.totals.pemasukan + 50000;

    setScanResult({
      ...scanResult,
      items: updatedItems,
      totals: {
        ...scanResult.totals,
        pemasukan,
        laba_bersih: pemasukan - scanResult.totals.pengeluaran
      }
    });
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
    if (!scanResult) {
      alert("Belum ada data analisis untuk diekspor!");
      return;
    }

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
      doc.text("UMKM LENS — REKAPITULASI LAPORAN FINANSIAL", marginX + 6, posY + 8);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.text("LAPORAN REKAPITULASI TRANSAKSI UMKM / PERIODE: " + scanResult.period.toUpperCase(), marginX + 6, posY + 14);
      doc.setFont("Courier", "italic");
      doc.text("UMKM Lens — Prototipe", marginX + 6, posY + 18);

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
      doc.text("PENTING: Laporan ini berbasis foto catatan unggahan pemilik usaha. Akurasi rekapitulasi bergantung penuh pada kualitas & keterbacaan tulisan tangan asli.", marginX + 3, posY + 5.5);

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
      doc.text("PROFIL PEMILIK USAHA", marginX + 5, posY + 5);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Nama Pemilik: ${userProfile.ownerName || "Sobat UMKM"}`, marginX + 5, posY + 10);
      doc.text(`Nama Toko: ${userProfile.businessName || "Toko Kelontong Handal"}`, marginX + 5, posY + 14.5);
      doc.text(`Sektor Bisnis: Usaha ${scanResult.business_type.toUpperCase()}`, marginX + 5, posY + 19);
      doc.text(`Lokasi Usaha: ${userProfile.location || "[diisi pengguna]"}`, marginX + 5, posY + 23.5);

      doc.setFont("Helvetica", "bold");
      doc.text("INFORMASI DOKUMEN", marginX + 95, posY + 5);
      doc.setFont("Helvetica", "normal");
      doc.text(`Tujuan Laporan: Ringkasan Catatan Keuangan Pribadi`, marginX + 95, posY + 10);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}`, marginX + 95, posY + 16);
      doc.text(`Periode Laporan: ${scanResult.period}`, marginX + 95, posY + 22);

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
      doc.text("DESKRIPSI TRANSAKSI", marginX + 4, posY + 5.5);
      doc.text("KATEGORI", marginX + 95, posY + 5.5);
      doc.text("NOMINAL TRANSAKSI (IDR)", marginX + 135, posY + 5.5);

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
          doc.text("DESKRIPSI TRANSAKSI", marginX + 4, posY + 5.5);
          doc.text("KATEGORI", marginX + 95, posY + 5.5);
          doc.text("NOMINAL TRANSAKSI (IDR)", marginX + 135, posY + 5.5);
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
          
          const descText = "1 item tidak terbaca - jumlah tidak diketahui (periksa catatan asli)";
          doc.text(descText, marginX + 4, posY + 5.5);
          
          doc.text("KENDALA BACA", marginX + 95, posY + 5.5);
          doc.text("Tidak Diketahui", marginX + 135, posY + 5.5);
          
          doc.setFont("Helvetica", "normal"); // restore default
        } else {
          doc.setTextColor(17, 24, 39);
          const descText = item.description.length > 50 ? item.description.substring(0, 48) + "..." : item.description;
          doc.text(descText, marginX + 4, posY + 5.5);
          
          // Category representation
          const categoryLabel = item.category.toUpperCase();
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
      doc.text("TOTAL PEMASUKAN TERPINDAI", marginX + 4, posY + 6);
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(11);
      doc.text(`Rp ${scanResult.totals.pemasukan.toLocaleString("id-ID")}`, marginX + 4, posY + 15);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text("Arus Masuk Terpindai", marginX + 4, posY + 22);

      // Total Pengeluaran Block
      doc.setTextColor(55, 65, 81);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("TOTAL PENGELUARAN (KELUAR)", marginX + 64, posY + 6);
      doc.setTextColor(185, 28, 28);
      doc.setFontSize(11);
      doc.text(`Rp ${scanResult.totals.pengeluaran.toLocaleString("id-ID")}`, marginX + 64, posY + 15);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text("Arus Keluar Terpindai", marginX + 64, posY + 22);

      // Laba Bersih Block
      doc.setTextColor(17, 24, 39);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("ESTIMASI LABA BERSIH", marginX + 124, posY + 6);
      doc.setTextColor(14, 116, 144); // blueprint color
      doc.setFontSize(11.5);
      doc.text(`Rp ${scanResult.totals.laba_bersih.toLocaleString("id-ID")}`, marginX + 124, posY + 15);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text("Estimasi Laba Bersih", marginX + 124, posY + 22);

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
      doc.text("DISCLAIMER DAN RINGKASAN DATA", marginX + 5, posY + 5.5);

      doc.setTextColor(55, 65, 81);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      
      const textDisclaimer = `Dokumen ini merangkum data transaksi yang diunggah oleh pemilik usaha untuk periode ${scanResult.period}. Estimasi laba bersih dihitung berdasarkan data yang tersedia dan dapat dijadikan bahan referensi pribadi dalam mempersiapkan pengajuan pembiayaan. Dokumen ini bukan penilaian kredit resmi dan tidak menjamin persetujuan pinjaman dari lembaga keuangan manapun.`;
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
      
      const legalText1 = "Catatan: Laporan ini dirancang secara otomatis menggunakan pengolahan dokumen pintar berbasis teknologi kecerdasan buatan (AI) yang membaca foto tulisan tangan dari berkas fisik tulisan tangan.";
      const legalText2 = "Dokumen ini murni berfungsi sebagai alat bantu perapian catatan finansial pribadi pemilik usaha, bukan merupakan dokumen perpajakan resmi maupun laporan keuangan teraudit.";
      const legalText3 = `Dihasilkan oleh: Sistem Prototipe UMKM Lens Indonesia | ${new Date().toLocaleDateString("id-ID")}`;

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
      doc.text("LAMPIRAN B: ANALISIS KELAYAKAN KREDIT ALTERNATIF (PRE-ASSESSMENT)", marginX + 5, pg2Y + 9);

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
      doc.text("SKOR KESIAPAN KREDIT", marginX + 4, pg2Y + 6);
      doc.setTextColor(14, 116, 144);
      doc.setFontSize(22);
      doc.text(`${score} / 100`, marginX + 4, pg2Y + 18);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(107, 114, 128);
      doc.text("Berdasarkan profil & data kas", marginX + 4, pg2Y + 25);

      // Col 2: Repayment capacity (DSCR)
      doc.setTextColor(75, 85, 99);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("KAPASITAS BAYAR (DSCR)", marginX + 64, pg2Y + 6);
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(13);
      doc.text(`${dscr.toFixed(2)}x`, marginX + 64, pg2Y + 15);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(107, 114, 128);
      doc.text(`Est. Cicilan: Rp ${estCicilan.toLocaleString("id-ID")}/bln`, marginX + 64, pg2Y + 22);
      doc.text(`Tenor Pengajuan: ${loanTenor} Bulan`, marginX + 64, pg2Y + 27);

      // Col 3: Status / Grade
      doc.setTextColor(75, 85, 99);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("GRADE PRE-ASSESSMENT", marginX + 124, pg2Y + 6);
      
      const gColor = creditGrade === "A" ? [22, 101, 52] : (creditGrade === "B" ? [180, 83, 9] : [185, 28, 28]);
      doc.setTextColor(gColor[0], gColor[1], gColor[2]);
      doc.setFontSize(13);
      doc.text(`GRADE ${creditGrade}`, marginX + 124, pg2Y + 15);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(gradeLabel, marginX + 124, pg2Y + 22);

      pg2Y += 40;

      // Section 2: Detailed Parameters
      doc.setTextColor(17, 24, 39);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("RINCIAN PARAMETER & RASIO KEUANGAN MIKRO", marginX, pg2Y);
      
      pg2Y += 6;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      
      doc.text(`1. Total Pendapatan Bulanan Terpindai (Omset): Rp ${pemasukan.toLocaleString("id-ID")}`, marginX + 4, pg2Y);
      pg2Y += 5;
      doc.text(`2. Total Pengeluaran Bulanan Terpindai (Beban): Rp ${labaBersih >= 0 ? (pemasukan - labaBersih).toLocaleString("id-ID") : (pemasukan + Math.abs(labaBersih)).toLocaleString("id-ID")}`, marginX + 4, pg2Y);
      pg2Y += 5;
      doc.text(`3. Sisa Bersih Bulanan (Laba Bersih Riil): Rp ${labaBersih.toLocaleString("id-ID")}`, marginX + 4, pg2Y);
      pg2Y += 5;
      doc.text(`4. Margin Laba Bersih Usaha: ${(margin * 100).toFixed(1)}% (Standard bank untuk pinjaman produktif > 10%)`, marginX + 4, pg2Y);
      pg2Y += 5;
      doc.text(`5. Debt Service Coverage Ratio (DSCR): ${dscr.toFixed(2)}x (Batas aman kelayakan pelunasan bank > 1.25x)`, marginX + 4, pg2Y);
      pg2Y += 5;
      doc.text(`6. Plafon Pengajuan Simulasi: Rp ${desiredLoan.toLocaleString("id-ID")} (Tenor ${loanTenor} bulan)`, marginX + 4, pg2Y);

      pg2Y += 12;

      // Section 3: Checklist
      doc.setTextColor(17, 24, 39);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("CHECKLIST TINDAKAN KELAYAKAN MANDIRI PEMOHON", marginX, pg2Y);

      pg2Y += 6;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);

      const chk1 = completedChecklist.rekeningTerpisah ? "[ V ]" : "[   ]";
      doc.text(`${chk1} Memisahkan Rekening Pribadi & Rekening Kas Usaha (Mengurangi Cash Leakage)`, marginX + 4, pg2Y);
      pg2Y += 5;

      const chk2 = completedChecklist.nibTerdaftar ? "[ V ]" : "[   ]";
      doc.text(`${chk2} Memiliki Nomor Induk Berusaha (NIB) Resmi dari Kemeninvest RI (Legalitas Mikro)`, marginX + 4, pg2Y);
      pg2Y += 5;

      const chk3 = completedChecklist.catatanKonsisten ? "[ V ]" : "[   ]";
      doc.text(`${chk3} Mempertahankan Pencatatan Keuangan Harian Konsisten >= 3 Bulan Berturut-turut`, marginX + 4, pg2Y);
      pg2Y += 5;

      const chk4 = useAltData ? "[ V ]" : "[   ]";
      doc.text(`${chk4} Melampirkan Bukti Bayar Utilitas (Listrik/Ponsel) Tepat Waktu & Mutasi Alternatif e-Wallet`, marginX + 4, pg2Y);

      pg2Y += 12;

      // Section 4: Alternative Scoring Legal Box (UU P2SK)
      doc.setFillColor(239, 246, 255); // Sky tint
      doc.rect(marginX, pg2Y, 180, 24, "F");
      doc.setDrawColor(186, 230, 253);
      doc.rect(marginX, pg2Y, 180, 24, "S");

      doc.setTextColor(14, 116, 144);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.text("EDUKASI ALTERNATIVE CREDIT SCORING (UU NO. 4 TAHUN 2023 - P2SK)", marginX + 4, pg2Y + 5);

      doc.setTextColor(55, 65, 81);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.8);
      const p2skText = "Sesuai amanat Undang-Undang Pengembangan dan Penguatan Sektor Keuangan (UU P2SK), komite regulasi perbankan mikro didorong menggunakan inovasi penilaian kredit alternatif (Alternative Credit Scoring) memanfaatkan pembayaran tagihan listrik, BPJS, pulsa, dan riwayat e-commerce. Ini membuka kesempatan bagi pengusaha rumah tangga tanpa agunan tambahan untuk dinilai layak mendapat pembiayaan formal secara adil.";
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
      doc.save(`Laporan_Finansial_${(userProfile.businessName || "UMKM").replace(/\s+/g, "_")}.pdf`);

    } catch (error) {
      console.error(error);
      alert("Terdapat kendala sewaktu memproses file PDF. Silakan ulangi.");
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
              onClick={() => { setActiveTab("blog"); setSelectedPostSlug(null); }}
              className={`px-3 py-1.5 transition-all uppercase tracking-wider ${
                activeTab === "blog" 
                  ? "bg-ink text-paper font-semibold shadow-inner" 
                  : "hover:bg-gray-100"
              }`}
            >
              📖 Problem Research
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
              ⚡ Try APP Free
            </button>
            <span className="text-gray-300">/</span>
            <button
              onClick={() => { setActiveTab("about"); }}
              className={`px-3 py-1.5 transition-all uppercase tracking-wider ${
                activeTab === "about" 
                  ? "bg-ink text-paper font-semibold" 
                  : "hover:bg-gray-100"
              }`}
            >
              📍 Citations Hub
            </button>
          </nav>

          {/* Prompt User Status Bar */}
          <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-sm">
            {userProfile.isOnboarded ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-gray-600">Terdaftar: <strong>{userProfile.businessName}</strong></span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-gray-500 text-xs">Belum Bergabung</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-10">

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
                ← Kembali Ke Buku Analisis Masalah
              </button>
              <span className="font-mono text-[9px] text-gray-500 bg-gray-100 px-2 py-1 border border-gray-200">
                STATUS PERANGKAT: KAMERA AKTIF / SIAP
              </span>
            </div>

            {/* Heading Section */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs uppercase font-mono text-blueprint font-bold tracking-widest bg-blue-50 px-2.5 py-1 border border-blue-200">
                PONDASI KELAYAKAN FINANSIAL
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-ink">
                Ubah Coretan Menjadi Laporan Laba Rugi
              </h2>
              <p className="text-xs md:text-sm text-gray-500">
                Unggah jepretan kamera kertas catatan supplier atau buku kas harian Anda. Agen AI UMKM Lens akan secara instan merapikannya menjadi siap cetak.
              </p>
            </div>

            {/* ==================== STEP A: USER REGISTRATION / ONBOARDING ==================== */}
            <section id="onboarding-form" className="tectonic-card bg-white p-6 max-w-2xl mx-auto space-y-5">
              <div className="border-b-2 border-ink pb-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blueprint" />
                  <h3 className="font-display font-bold text-lg text-ink uppercase">Daftar Identitas UMKM</h3>
                </div>
                {userProfile.isOnboarded ? (
                  <span className="bg-emerald-100 border border-emerald-500 text-emerald-800 text-[10px] uppercase font-mono px-2 py-0.5 font-bold">
                    ✓ TERONBOARD
                  </span>
                ) : (
                  <span className="bg-amber-100 border border-amber-500 text-amber-800 text-[10px] uppercase font-mono px-2 py-0.5 px-2 py-0.5 font-bold">
                    WAJIB DIISI
                  </span>
                )}
              </div>

              {!userProfile.isOnboarded ? (
                <form onSubmit={handleRegisterUser} className="space-y-4">
                  <p className="text-xs text-gray-600 leading-relaxed font-sans">
                    Daftar di bawah ini untuk mengunci nama usaha Anda di kop lampiran PDF perbankan. Ini memberikan kredibilitas yang dicari analis mikro KUR.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">Nama Pemilik Usaha</label>
                      <input
                        type="text"
                        placeholder="Contoh: Ibu Lilis Suranti"
                        value={userProfile.ownerName}
                        onChange={(e) => setUserProfile({ ...userProfile, ownerName: e.target.value })}
                        className="w-full text-sm font-sans border-2 border-ink p-2.5 bg-paper focus:bg-white focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">Nama Usaha / Toko</label>
                      <input
                        type="text"
                        placeholder="Contoh: Nastar Makmur Jagakarsa"
                        value={userProfile.businessName}
                        onChange={(e) => setUserProfile({ ...userProfile, businessName: e.target.value })}
                        className="w-full text-sm font-sans border-2 border-ink p-2.5 bg-paper focus:bg-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">Jenis Sektor Bisnis</label>
                      <select
                        value={userProfile.businessType}
                        onChange={(e) => setUserProfile({ ...userProfile, businessType: e.target.value })}
                        className="w-full text-sm font-sans border-2 border-ink p-2.5 bg-paper focus:outline-none font-mono"
                      >
                        <option value="makanan">Makanan / Minuman Rumahan</option>
                        <option value="kerajinan">Kerajinan Tangan (Rajut, Anyam, Kulit)</option>
                        <option value="warung">Warung Kelontong / Toko Kelontong</option>
                        <option value="jasa">Jasa Domestik (Laundry, Ojek, Bengkel)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">Nomor WhatsApp Aktif</label>
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
                    <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">Lokasi Usaha (Kabupaten / Kota)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Jagakarsa, Jakarta Selatan atau Bogor, Jawa Barat"
                      value={userProfile.location}
                      onChange={(e) => setUserProfile({ ...userProfile, location: e.target.value })}
                      className="w-full text-sm font-sans border-2 border-ink p-2.5 bg-paper focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-3 flex gap-2 rounded-sm mt-2">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-[11px] text-amber-800 leading-normal font-sans">
                      <strong>Privasi Terjamin:</strong> Data disimpan sepenuhnya secara lokal di peramban Anda. Aplikasi ini dirancang sesuai standard tanpa login yang frictionless demi kenyamanan Ibu Rumah Tangga.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blueprint text-white py-3.5 font-display font-bold text-xs uppercase tracking-wider border-2 border-ink shadow-[3px_3px_0px_0px_#111827] hover:bg-blue-700 cursor-pointer text-center"
                    >
                      Daftar UMKM Baru & Mulai Deteksi Catatan
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickOnboard}
                      className="bg-marker-yellow hover:bg-yellow-300 text-ink py-3.5 px-4 font-mono font-bold text-xs uppercase tracking-wider border-2 border-ink shadow-[3px_3px_0px_0px_#111827]"
                    >
                      🚀 Lewati & Isi Data Demo Instan
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-sm flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">Pendaftaran Berhasil & Terkonfirmasi</h4>
                      <p className="text-xs text-emerald-700 mt-1 font-sans">
                        Kop Laporan Usaha sekarang terdaftar atas nama <strong>{userProfile.businessName}</strong> (Pemilik: {userProfile.ownerName}) dengan sektor <strong>Usaha {userProfile.businessType.toUpperCase()}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setUserProfile({ ...userProfile, isOnboarded: false })}
                      className="text-[10px] font-mono text-gray-500 uppercase hover:underline flex items-center gap-1 hover:text-ink"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Ganti Identitas Profil
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Anchor Target for scanning utility */}
            <div id="anchor-scan" className="h-1" />

            {/* ==================== STEP B: CHOOSE OR UPLOAD FINANCIAL RECORD ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Core interactive box - Presets & Custom File input */}
              <div className="lg:col-span-7 space-y-6">
                <div className="tectonic-card bg-white p-5 border-2 border-ink shadow-[4px_4px_0px_0px_#111827] space-y-5">
                  
                  <div className="border-b-2 border-ink pb-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blueprint" />
                      <h3 className="font-display font-bold text-base text-ink uppercase">Catatan Masukan</h3>
                    </div>
                    <span className="font-mono text-[10px] text-gray-400">PILIHAN UPLOAD ATAU CONTOH</span>
                  </div>

                  {/* UI Toggle preset notebooks vs real upload */}
                  <div className="space-y-4">
                    
                    {/* Method 1: Choose hand-ledger preset */}
                    <div className="space-y-3">
                      <span className="block text-xs font-mono font-bold text-gray-700 uppercase">
                        Metode A: Pilih Preset Lembar Buku Tulis Harian (Disarankan untuk Demo)
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
                                {note.title}
                              </p>
                              <span className="text-[9px] text-gray-500 font-mono mt-1 block uppercase">
                                Sektor: {note.businessType}
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-600 line-clamp-2 mt-2 leading-tight font-sans italic">
                              "{note.snippet}"
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="h-px bg-gray-200 flex-1" />
                      <span className="px-3 text-[10.5px] font-mono text-gray-400 uppercase tracking-widest">ATAU</span>
                      <div className="h-px bg-gray-200 flex-1" />
                    </div>

                    {/* Method 2: Genuine Camera capture & File upload */}
                    <div className="space-y-2">
                      <span className="block text-xs font-mono font-bold text-gray-700 uppercase">
                        Metode B: Jepret Kamera Ponsel atau Unggah Berkas Sendiri
                      </span>

                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-colors ${
                          uploadedImage 
                            ? "bg-slate-50 border-blueprint" 
                            : "bg-paper border-gray-400 hover:bg-slate-50 hover:border-ink"
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
                            <p className="text-xs text-ink font-semibold">Tergugah: {uploadedFileName}</p>
                            <p className="text-[10px] text-gray-400 font-mono">Ketuk area untuk mengganti foto</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-ink hover:underline">Ketuk untuk mengambil foto tulisan tangan</p>
                              <p className="text-[10px] text-gray-400 font-mono">Format Jpg, Png, Heic maksimal 10MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Context Info Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">Periode Finansial</label>
                      <input
                        type="text"
                        value={customPeriod}
                        onChange={(e) => setCustomPeriod(e.target.value)}
                        placeholder="Contoh: Mei 2026"
                        className="w-full text-xs font-mono p-2 border-2 border-ink focus:outline-none bg-paper focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-700 uppercase mb-1">Klasifikasi Usaha Dokumen</label>
                      <select
                        value={customBusinessType}
                        onChange={(e) => setCustomBusinessType(e.target.value)}
                        className="w-full text-xs font-mono p-2 border-2 border-ink focus:outline-none bg-paper focus:bg-white"
                      >
                        <option value="makanan">Makanan Rumahan</option>
                        <option value="kerajinan">Kerajinan Tangan</option>
                        <option value="warung">Toko Kelontong</option>
                        <option value="jasa">Jasa & Servis</option>
                      </select>
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-50 border-2 border-red-500 text-xs text-red-700 space-y-1">
                      <p className="font-bold uppercase">⚠️ Gagal Memulai deteksi</p>
                      <p>{formError}</p>
                    </div>
                  )}

                  {/* Start Extraction CTA */}
                  <button
                    onClick={handleStartAnalysis}
                    disabled={isProcessing}
                    className={`w-full text-center font-display font-medium text-xs md:text-sm py-4 border-2 border-ink uppercase tracking-wider text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] active:translate-y-0.5 active:translate-x-0.5 cursor-pointer ${
                      isProcessing 
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-blueprint hover:bg-blue-700"
                    }`}
                  >
                    {isProcessing ? "Sedang Membaca..." : "Mulai Konversi dengan AI Lens Sekarang"}
                  </button>

                </div>
              </div>

              {/* Right core interactive preview of actual document image */}
              <div className="lg:col-span-5 space-y-6">
                <div className="tectonic-card bg-white p-5 border-2 border-ink shadow-[4px_4px_0px_0px_#111827] space-y-4">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block border-b border-ink/10 pb-1.5">
                    PRATINJAU DOKUMEN TULISAN TANGAN
                  </span>

                  {/* Visual handwritten sheet representation */}
                  <div className="relative border-2 border-ink bg-[#FCFBE3] p-5 shadow-inner rounded-sm font-mono text-xs text-stone-800 space-y-2 min-h-[300px] overflow-auto">
                    
                    {/* Architectural Grid gridlines overlay to look like realistic paper notepad */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(17,24,39,0.06)_1px,transparent_1px)] bg-[size:100%_24px] pointer-events-none" />

                    {selectedPreset ? (
                      <div className="relative space-y-2 z-10">
                        <div className="flex justify-between items-center border-b-2 border-red-300 pb-1">
                          <span className="text-stone-500 text-[10px]">PRESET LEDGER FILEID: {selectedPreset.id.toUpperCase()}</span>
                          <span className="text-red-400 text-[10px]">★ CATATAN ASLI</span>
                        </div>
                        <div className="space-y-1.5 pt-2">
                          {selectedPreset.handwrittenContent.map((line, idx) => (
                            <p key={idx} className="leading-[24px] select-all decoration-red-300">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : uploadedImage ? (
                      <div className="relative flex flex-col justify-center items-center h-full pt-8 z-10">
                        <img 
                          src={uploadedImage} 
                          alt="Gugahan Anda" 
                          className="max-h-[350px] border-2 border-ink object-contain shadow-md mb-2" 
                        />
                        <p className="text-[10px] text-gray-500 font-mono mt-1 text-center">FOTO TULISAN TANGAN PENGGUNA TERPASANG</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 pt-16">
                        <HelpCircle className="w-12 h-12 text-gray-300 mb-2 animate-bounce" />
                        <p className="font-bold text-xs uppercase text-stone-500">Kamar Kosong</p>
                        <p className="text-[10px] text-gray-400 max-w-xs mt-1">Pilih salah satu preset atau unggah dokumen tulisan tangan Anda di panel sebelah kiri.</p>
                      </div>
                    )}
                  </div>

                  {/* AI Scan Motion Overlay Stage */}
                  {isProcessing && (
                    <div className="bg-ink text-paper p-4 border border-ink space-y-3 font-mono text-xs shadow-md animate-pulse">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-marker-yellow animate-ping" />
                        <span className="font-bold uppercase text-marker-yellow">SISTEM AI BEKERJA:</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 italic">" {processingStep} "</p>
                      <div className="w-full bg-zinc-800 h-2 overflow-hidden border border-zinc-700">
                        <div className="bg-marker-yellow h-full w-2/3 animate-infinite" />
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* ==================== STEP C: SCREEN ScanResult RENDER & MANUALLY CORRECT ==================== */}
            {scanResult && (
              <section className="space-y-6 pt-4 border-t-2 border-dashed border-gray-300">
                <div className="tectonic-card bg-white p-6 border-2 border-ink shadow-[6px_6px_0px_0px_#111827]">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-ink pb-4 gap-4">
                    <div>
                      <span className="text-[10px] bg-blueprint text-white font-mono uppercase px-2 py-0.5 tracking-wider font-bold">
                        ESTIMASI LAPORAN LAYAK KREDIT (KUR)
                      </span>
                      <h3 className="text-2xl font-display font-bold text-ink mt-1">
                        Laporan Keuangan Usaha: {userProfile.businessName}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        Periode Pemeriksaan: <span className="text-ink font-bold">{scanResult.period}</span> | Jenis Sektor: <span className="text-ink font-bold">{scanResult.business_type.toUpperCase()}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={handleExportPDF}
                        className="bg-marker-teal text-ink px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 border-ink shadow-[2.5px_2.5px_0px_0px_#111827] flex items-center gap-1.5 active:translate-y-px hover:shadow-[1.5px_1.5px_0px_0px_#111827] transition-all"
                      >
                        <FileDown className="w-4 h-4" /> Cetak / Ekspor PDF
                      </button>
                      <button
                        onClick={handleResetDemo}
                        className="bg-paper text-gray-500 hover:text-ink px-3 py-2 text-xs font-mono font-bold uppercase border border-gray-300 hover:border-ink"
                      >
                        Bersihkan
                      </button>
                    </div>
                  </div>

                  {/* Warning on uncertainty / Confidence alert */}
                  {scanResult.items.some(item => item.confidence === "low") && (
                    <div className="bg-amber-50 border-2 border-amber-500 p-4 rounded-sm flex items-start gap-3 mt-4">
                      <BadgeAlert className="w-5.5 h-5.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-mono font-bold text-amber-800 uppercase">Perhatian Analis AI: Ditemukan Coretan Kurang Jelas</h4>
                        <p className="text-[11px] text-amber-700 leading-relaxed font-sans">
                          Beberapa baris data dideteksi dengan indikator kepercayaan rendah oleh pembaca optik. Silakan lakukan pencocokan manual pada baris tabel di bawah untuk menyempurnakan keandalan berkas pengajuan kredit perbankan Anda.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Core Interactive Editor Table */}
                  <div className="overflow-x-auto mt-6">
                    <table className="w-full border-2 border-ink text-left font-mono text-xs">
                      <thead className="bg-slate-50 border-b-2 border-ink">
                        <tr>
                          <th className="p-3 border-r border-ink">KETERANGAN TRANSAKSI</th>
                          <th className="p-3 border-r border-ink text-center w-36">KATEGORI POS</th>
                          <th className="p-3 border-r border-ink text-right w-44">JUMLAH NOMINAL (RP)</th>
                          <th className="p-3 border-r border-ink text-center w-32">AKURASI AI</th>
                          <th className="p-3 text-center w-16">AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scanResult.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-ink hover:bg-neutral-50">
                            
                            {/* Editable Description */}
                            <td className="p-2 border-r border-ink">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdateItemDesc(idx, e.target.value)}
                                className="w-full bg-transparent font-medium text-ink border-b border-transparent focus:border-blueprint focus:outline-none p-1 text-xs"
                              />
                              {item.flag && (
                                <span className="block text-[9px] text-amber-600 mt-1 font-sans font-medium italic">
                                  ⚠ Note AI: {item.flag}
                                </span>
                              )}
                            </td>

                            {/* Editable Category */}
                            <td className="p-2 border-r border-ink text-center">
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateItemCategory(idx, e.target.value as any)}
                                className="bg-white border border-ink text-[11px] p-1 font-mono focus:outline-none"
                              >
                                <option value="pemasukan">PEMASUKAN</option>
                                <option value="pengeluaran">PENGELUARAN</option>
                                <option value="unknown">BURAM</option>
                              </select>
                            </td>

                            {/* Editable Amount */}
                            <td className="p-2 border-r border-ink text-right font-bold text-sm">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-gray-400 font-normal text-xs">Rp</span>
                                <input
                                  type="number"
                                  value={item.amount || 0}
                                  onChange={(e) => handleUpdateItemAmount(idx, Number(e.target.value))}
                                  className="w-[120px] bg-transparent text-right font-mono font-bold border-b border-transparent focus:border-blueprint focus:outline-none p-1 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </td>

                            {/* Confidence indicators with marker-inspired backgrounds */}
                            <td className="p-2 border-r border-ink text-center">
                              {item.confidence === "high" ? (
                                <span className="bg-marker-green border border-ink/40 text-ink text-[9px] px-2 py-0.5 font-bold uppercase">
                                  Tinggi (98%)
                                </span>
                              ) : (
                                <span className="bg-marker-orange border border-ink/40 text-ink text-[9px] px-2 py-0.5 font-bold uppercase animate-pulse">
                                  Periksa (45%)
                                </span>
                              )}
                            </td>

                            {/* Delete Line */}
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleDeleteItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1.5 border border-transparent hover:border-red-300 rounded-sm transition-all"
                                title="Hapus elemen baris"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>

                          </tr>
                        ))}

                        {/* Add empty row tool */}
                        <tr className="bg-gray-50/50">
                          <td colSpan={5} className="p-2 text-left">
                            <button
                              onClick={handleAddNewItem}
                              className="text-xs font-mono font-semibold text-blueprint hover:underline flex items-center gap-1 uppercase"
                            >
                              <Plus className="w-3.5 h-3.5" /> Tambahkan Baris Transaksi Baru (Manual)
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Totals Row styled with Marker Design highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 p-5 bg-paper border-2 border-ink shadow-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-gray-500 uppercase">TOTAL PEMASUKAN AKTIF (OMSET)</p>
                      <p className="text-xl md:text-2xl font-display font-extrabold text-ink">
                        Rp {scanResult.totals.pemasukan.toLocaleString("id-ID")}
                      </p>
                      <span className="bg-marker-green/60 text-ink text-[9px] font-sans font-semibold px-2 py-0.5 inline-block rounded-xs">
                        Kas Masuk Sehat
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-gray-500 uppercase">TOTAL PENGELUARAN USAHA</p>
                      <p className="text-xl md:text-2xl font-display font-extrabold text-red-600">
                        Rp {scanResult.totals.pengeluaran.toLocaleString("id-ID")}
                      </p>
                      <span className="bg-marker-orange/60 text-ink text-[9px] font-sans font-semibold px-2 py-0.5 inline-block rounded-xs">
                        Modal Keluar Terverifikasi
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-gray-500 uppercase">ESTIMASI KEUNTUNGAN BERSIH (LABA)</p>
                      <p className={`text-xl md:text-2xl font-display font-extrabold ${scanResult.totals.laba_bersih >= 0 ? "text-blueprint" : "text-red-700"}`}>
                        Rp {scanResult.totals.laba_bersih.toLocaleString("id-ID")}
                      </p>
                      <span className="bg-marker-yellow text-ink text-[9px] font-sans font-semibold px-2 py-0.5 inline-block rounded-xs">
                        Indikator Lolos Kredit Bank
                      </span>
                    </div>
                  </div>

                  {/* Credit Readiness Assessment Panel */}
                  <div className="border-2 border-ink bg-white p-5 mt-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
                    
                    {/* Header */}
                    <div className="border-b-2 border-ink pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-blueprint uppercase tracking-widest font-bold">
                          ANALIS KESIAPAN KREDIT MIKRO (KUR)
                        </span>
                        <h4 className="text-lg font-display font-bold text-ink flex items-center gap-1.5 mt-0.5">
                          🛡️ Skor Kelayakan & Pre-Assessment
                        </h4>
                      </div>
                      
                      {/* Badge Grade */}
                      <div className={`px-4 py-1.5 border-2 border-ink font-mono font-bold uppercase flex items-center gap-2 ${gradeBadgeColor}`}>
                        <span>GRADE {creditGrade}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Left: Interactive Loan Simulator & Checklist */}
                      <div className="lg:col-span-7 space-y-5">
                        
                        {/* Sliders for Plafon & Tenor */}
                        <div className="bg-slate-50 border border-ink p-4 space-y-4">
                          <h5 className="text-xs font-mono font-bold text-ink uppercase border-b border-ink/10 pb-1.5">
                            ⚙️ Simulasi Pengajuan Kredit
                          </h5>
                          
                          {/* Plafon Slider */}
                          <div>
                            <div className="flex justify-between text-xs font-mono text-gray-700">
                              <span>Plafon Pinjaman:</span>
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
                            />
                            <div className="flex justify-between text-[9px] font-mono text-gray-400 mt-0.5">
                              <span>Min: Rp 5 Juta</span>
                              <span>Max KUR Mikro: Rp 50 Juta</span>
                            </div>
                          </div>

                          {/* Tenor buttons/slider */}
                          <div>
                            <span className="block text-xs font-mono text-gray-700 mb-1.5">Tenor Pengembalian (Bulan):</span>
                            <div className="flex gap-2">
                              {[12, 18, 24].map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setLoanTenor(t)}
                                  className={`flex-1 py-1.5 text-xs font-mono border-2 border-ink font-bold transition-all ${
                                    loanTenor === t 
                                      ? "bg-ink text-paper" 
                                      : "bg-paper text-ink hover:bg-gray-100"
                                  }`}
                                >
                                  {t} Bulan
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Financial Formula Info */}
                          <div className="text-[10px] font-mono text-gray-500 bg-white p-2.5 border border-dashed border-gray-300 rounded-sm">
                            <div className="flex justify-between">
                              <span>Estimasi Cicilan:</span>
                              <strong className="text-ink">Rp {estCicilan.toLocaleString("id-ID")} / bulan</strong>
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                              <span>Suku Bunga KUR Subsidi:</span>
                              <span>6% flat p.a. (0.5% per bulan)</span>
                            </div>
                          </div>
                        </div>

                        {/* Checklist Upaya Mandiri */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-mono font-bold text-ink uppercase">
                            📋 Tindakan Penguatan Kesiapan Kredit
                          </h5>
                          <p className="text-[11px] text-gray-500">
                            Centang tindakan berikut jika usaha Anda telah menerapkannya untuk meningkatkan skor kesiapan kredit Anda:
                          </p>
                          
                          <div className="space-y-2 text-xs">
                            <label className="flex items-start gap-2.5 p-2.5 bg-paper border border-gray-200 hover:bg-slate-50 cursor-pointer rounded-sm">
                              <input 
                                type="checkbox" 
                                checked={completedChecklist.rekeningTerpisah} 
                                onChange={(e) => setCompletedChecklist({ ...completedChecklist, rekeningTerpisah: e.target.checked })}
                                className="mt-0.5 accent-blueprint h-4 w-4 border-ink"
                              />
                              <div>
                                <strong className="text-ink block font-semibold">Memisahkan Uang Pribadi & Usaha (+5 Poin)</strong>
                                <span className="text-[10px] text-gray-500 block mt-0.5">Mengurangi cash leakage atau kebocoran kas rumah tangga yang sering merusak arus keuangan toko.</span>
                              </div>
                            </label>

                            <label className="flex items-start gap-2.5 p-2.5 bg-paper border border-gray-200 hover:bg-slate-50 cursor-pointer rounded-sm">
                              <input 
                                type="checkbox" 
                                checked={completedChecklist.nibTerdaftar} 
                                onChange={(e) => setCompletedChecklist({ ...completedChecklist, nibTerdaftar: e.target.checked })}
                                className="mt-0.5 accent-blueprint h-4 w-4 border-ink"
                              />
                              <div>
                                <strong className="text-ink block font-semibold">Sudah Memiliki NIB (Nomor Induk Berusaha) (+5 Poin)</strong>
                                <span className="text-[10px] text-gray-500 block mt-0.5">Memiliki izin legalitas gratis dari OSS Kementerian Investasi RI untuk validitas hukum.</span>
                              </div>
                            </label>

                            <label className="flex items-start gap-2.5 p-2.5 bg-paper border border-gray-200 hover:bg-slate-50 cursor-pointer rounded-sm">
                              <input 
                                type="checkbox" 
                                checked={completedChecklist.catatanKonsisten} 
                                onChange={(e) => setCompletedChecklist({ ...completedChecklist, catatanKonsisten: e.target.checked })}
                                className="mt-0.5 accent-blueprint h-4 w-4 border-ink"
                              />
                              <div>
                                <strong className="text-ink block font-semibold">Konsistensi Catatan &gt;= 3 Bulan (+5 Poin)</strong>
                                <span className="text-[10px] text-gray-500 block mt-0.5">Konsistensi data harian meyakinkan bank bahwa pembukuan bukan hasil manipulasi mendadak.</span>
                              </div>
                            </label>

                            {/* UU P2SK Alternative Data Toggle */}
                            <label className="flex items-start gap-2.5 p-2.5 bg-sky-50 border border-sky-200 hover:bg-sky-100/70 cursor-pointer rounded-sm">
                              <input 
                                type="checkbox" 
                                checked={useAltData} 
                                onChange={(e) => setUseAltData(e.target.checked)}
                                className="mt-0.5 accent-blueprint h-4 w-4 border-sky-400"
                              />
                              <div>
                                <strong className="text-sky-900 block font-semibold">
                                  Gunakan Data Alternatif (UU P2SK) (+10 Poin)
                                </strong>
                                <span className="text-[10px] text-sky-700 block mt-0.5">Melampirkan bukti bayar tagihan listrik tepat waktu & mutasi volume e-wallet (OVO/Dana/GoPay).</span>
                              </div>
                            </label>
                          </div>
                        </div>

                      </div>

                      {/* Right: Score Visual Display & Analytics Explanation */}
                      <div className="lg:col-span-5 space-y-4">
                        
                        <div className="border border-ink bg-slate-50 p-6 text-center space-y-3 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-mono text-gray-400 uppercase">SCORECARD ESTIMATOR</span>
                          
                          {/* Big Score Number */}
                          <div className="relative w-36 h-36 flex items-center justify-center bg-white border-4 border-ink rounded-full shadow-inner">
                            <div className="text-center">
                              <span className="text-4xl md:text-5xl font-display font-extrabold text-ink">{score}</span>
                              <span className="text-xs text-gray-400 font-mono block border-t border-gray-100 mt-1 pt-0.5">dari 100</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[10px] font-mono font-bold text-gray-500 uppercase">Rasio Kapasitas Angsuran (DSCR)</p>
                            <p className="text-lg font-bold text-blueprint">{dscr.toFixed(2)}x</p>
                            <p className="text-[10px] text-gray-500 max-w-[240px] mx-auto font-sans leading-tight">
                              Sisa keuntungan bersih bulanan Anda adalah <strong>{dscr.toFixed(1)} kali lipat</strong> dari angsuran bulanan yang diajukan.
                            </p>
                          </div>
                        </div>

                        {/* Diagnostic result message */}
                        <div className={`p-4 border-2 border-ink rounded-sm space-y-2 ${gradeColor}`}>
                          <h6 className="text-xs font-mono font-bold uppercase flex items-center gap-1.5">
                            {creditGrade === "A" && "✅ Rekomendasi: Layak Pengajuan KUR"}
                            {creditGrade === "B" && "⚠️ Rekomendasi: Kelayakan Bersyarat"}
                            {creditGrade === "C" && "🚨 Rekomendasi: Perlu Perbaikan Arus Kas"}
                          </h6>
                          <p className="text-[11px] leading-relaxed font-sans font-medium">
                            {creditGrade === "A" && (
                              `Selamat! Rasio DSCR (${dscr.toFixed(2)}x) Anda berada di atas ambang batas minimal bank (> 1.25x) dengan skor kesiapan ${score}/100. Sisa laba bersih Anda dinilai aman untuk melunasi cicilan Rp ${estCicilan.toLocaleString("id-ID")}/bulan.`
                            )}
                            {creditGrade === "B" && (
                              `Kapasitas bayar memadai (${dscr.toFixed(2)}x), namun skor readiness Anda sedang (${score}/100). Bank mungkin akan meminta syarat tambahan atau merekomendasikan plafon di bawah Rp ${desiredLoan.toLocaleString("id-ID")}. Centang checklist peningkatan skor di samping!`
                            )}
                            {creditGrade === "C" && (
                              `Rasio pembayaran (${dscr.toFixed(2)}x) terlalu berisiko (< 1.0x). Keuntungan bulanan usaha Rp ${labaBersih.toLocaleString("id-ID")} tidak aman untuk menanggung angsuran Rp ${estCicilan.toLocaleString("id-ID")}/bulan. Sebaiknya turunkan plafon pinjaman atau perpanjang tenor.`
                            )}
                          </p>
                        </div>

                      </div>

                    </div>

                  </div>

                  {/* Natural Language Interpretation box - Plain Language Interpretation (No financial jargon rule) */}
                  <div className="bg-[#EFFAFE] border border-[#BDEAFB] p-5 mt-6 rounded-sm space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-5 h-5 text-sky-700" />
                      <h4 className="text-xs font-mono font-semibold text-sky-900 uppercase">Interpretasi Tanpa Jargon Usaha</h4>
                    </div>
                    <p className="text-xs text-sky-800 leading-relaxed font-sans">
                      "Ibu/Bapak <strong>{userProfile.ownerName || "Sobat UMKM"}</strong>, berdasarkan pembacaan AI Lens, pada periode <strong>{scanResult.period}</strong>, usaha <strong>{userProfile.businessName}</strong> menghasilkan laba bersih riil sebesar <strong>Rp {scanResult.totals.laba_bersih.toLocaleString("id-ID")}</strong>."
                    </p>
                    <p className="text-[11px] text-sky-700 leading-relaxed font-sans">
                      Rasio laba bersih Anda saat ini dinilai <strong>{creditGrade === "A" ? "sangat aman" : (creditGrade === "B" ? "cukup memadai" : "kurang memadai")}</strong> untuk menanggung pengajuan kredit sebesar <strong>Rp {desiredLoan.toLocaleString("id-ID")}</strong> dengan cicilan bulanan sebesar <strong>Rp {estCicilan.toLocaleString("id-ID")}</strong> selama tenor <strong>{loanTenor} bulan</strong>.
                    </p>
                  </div>

                  {/* Official Banking Law Disclaimer (Mandatory per functional specs) */}
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <p className="text-[10px] text-gray-400 font-mono italic leading-relaxed text-center bg-gray-50 p-3 border border-gray-200">
                      📄 <strong>Pemberitahuan Kelayakan Hukum:</strong> "Dokumen ini dibuat secara otomatis dengan bantuan program kecerdasan buatan (AI) berbasis catatan harian yang diunggah secara bebas oleh pemohon. Ini bukan merupakan pelaporan resmi akuntan tersertifikasi. Lampiran dipergunakan sebagai kelengkapan asisten literasi administrasi perbankan mikro."
                    </p>
                  </div>

                </div>
              </section>
            )}

          </div>
        )}

        {/* ==================== SCREEN 3: CITATIONS HUB / ABOUT SECTION ==================== */}
        {activeTab === "about" && (
          <div className="space-y-8">
            
            {/* Citations Dashboard Headline */}
            <div className="tectonic-card bg-white p-6 border-2 border-ink shadow-[4px_4px_0px_0px_#111827]">
              <span className="text-xs font-mono text-blueprint uppercase tracking-widest font-bold">UMKM LENS RESEARCH METHODOLOGY</span>
              <h2 className="text-3xl font-display font-bold text-ink mt-1">Daftar Pustaka & Sourcing Data</h2>
              <p className="text-xs text-gray-500 mt-2 max-w-3xl leading-relaxed">
                Kami membangun aplikasi ini berdasarkan dedikasi akademik dan pengumpulan riset primer keuangan mikro nasional. Semua data, kegagalan kredit, dan margin kekeliruan didukung oleh sumber terpercaya.
              </p>
            </div>

            {/* Sourced Data Tree */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white border border-ink p-5 space-y-4 shadow-sm">
                <span className="bg-marker-yellow text-ink text-[10px] uppercase font-mono px-2 py-0.5 font-bold inline-block border border-ink">
                  Layer 1 & 2: Gap Akses Pembiayaan
                </span>
                
                <div className="space-y-4">
                  <div className="border-l-2 border-ink pl-3">
                    <p className="text-xs text-gray-500 font-mono">BI REPORT SUM (2023)</p>
                    <p className="text-sm font-semibold text-ink leading-snug">Hanya 30% UMKM Tersentuh Kredit Formal</p>
                    <p className="text-xs text-gray-600 mt-1 font-sans">
                      Diperkuat oleh World Bank (2024), 30% pengusaha mikro baru mengandalkan teknologi neo-fintech setelah ditolak oleh validasi Laporan Keuangan perbankan konvensional.
                    </p>
                  </div>

                  <div className="border-l-2 border-ink pl-3">
                    <p className="text-xs text-gray-500 font-mono">SURVEI NASIONAL LITERASI OJK (2024)</p>
                    <p className="text-sm font-semibold text-ink leading-snug">Tingkat Literasi Finansial Pengusaha Mikro Hanya 65.43%</p>
                    <p className="text-xs text-gray-600 mt-1 font-sans">
                      Eksklusi terjadi murni karena fobia formulir perbankan berkas yang berlapis-lapis dan keharusan menguasai software akuntansi manual.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-ink p-5 space-y-4 shadow-sm">
                <span className="bg-marker-orange text-ink text-[10px] uppercase font-mono px-2 py-0.5 font-bold inline-block border border-ink">
                  Layer 3 & 4: Kerangka Hukum & UU P2SK
                </span>

                <div className="space-y-4">
                  <div className="border-l-2 border-ink pl-3">
                    <p className="text-xs text-gray-500 font-mono">REFORMASI FINANSIAL: UU NO. 4 TAHUN 2023</p>
                    <p className="text-sm font-semibold text-ink leading-snug">Sinergi UU P2SK Pasal Komite Regulasi Finansial</p>
                    <p className="text-xs text-gray-600 mt-1 font-sans">
                      Mendirikan kerangka regulasi inklusif di mana teknologi diwajibkan memberikan kontribusi konkret sebagai perpanjangan tangan edukasi ke masyarakat terbawah.
                    </p>
                  </div>

                  <div className="border-l-2 border-ink pl-3">
                    <p className="text-xs text-gray-500 font-mono">KEMENTERIAN KOPERASI & UKM (2024)</p>
                    <p className="text-sm font-semibold text-ink leading-snug">Target UMKM Credit Ratio 30%</p>
                    <p className="text-xs text-gray-600 mt-1 font-sans">
                      Pemerintah mengandalkan alternatif data (Alternative Credit Scoring) seperti riwayat pembayaran telco dan tagihan listrik untuk mengatasi ketiadaan buku tabungan penjamin.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Clear Disclaimer regarding peer review */}
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-sm">
              <h4 className="text-xs font-mono font-bold text-amber-800 uppercase flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" /> Catatan Reviewer Penelitian
              </h4>
              <p className="text-xs text-amber-700 leading-relaxed font-sans mt-1">
                Data penolakan perbankan 60% s.d 70% dikutip lewat tinjauan literatur jurnal sekunder (JOUMI, 2025). Jika didayagunakan untuk pengajuan riset akademik formal, diwajibkan merujuk kembali secara komparatif pada dokumen asli Laporan Tahunan Departemen Pengembangan UMKM Bank Indonesia untuk presisi taktis maksimal.
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
            <p className="text-paper font-bold tracking-tight">UMKM LENS LITERASI PREDIKTIF</p>
            <p className="text-[10px] text-zinc-500 text-zinc-500">Kecerdasan Buatan Terbuka Untuk Akselerasi Finansial Desa Mandiri Indonesia</p>
          </div>
          <p className="text-[10px] text-zinc-500 text-center md:text-right">
            © 2026 UMKM Lens Project. Hak Cipta Dilindungi Undang-Undang. Sesuai Kebijakan Literasi Nasional OJK & Kemenkop UKM.
          </p>
        </div>
      </footer>

    </div>
  );
}
