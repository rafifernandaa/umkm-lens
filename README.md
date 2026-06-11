# 🔍 UMKM Lens - Alternative Credit Readiness Detector

> **Empowering millions of Indonesian micro-merchants to bridge the documentation barrier and secure formal bank loans (KUR) utilizing the Google AI Ecosystem.**

---

## 📌 Problem Foundation & Context
In Indonesia, Usaha Mikro, Kecil, dan Menengah (UMKM) contribute **61% to the National GDP** and absorb **97% of the workforce**. However, **60% to 70% of micro-merchant credit applications are rejected by banks** due to the **Documentation Barrier**. 

Most micro-merchants record transactions informally—in notebooks, on torn receipts, or not at all. Banks require standardized Profit & Loss (P&L) statements and formal documents.

**UMKM Lens** acts as a bridge. It converts informal handwritten ledgers, daily notes, or receipts into standardized, bank-ready financial pre-assessment reports and guides merchants on how to qualify for credit.

---

## ⚡ Core Features

1. **Multimodal OCR Ledger Scanning**:
   - Powered by **Gemini 3.5 Flash** via the new `@google/genai` Node.js SDK.
   - Extracts freeform, messy handwriting from ledger photos and structures transactions into valid JSON data.
   
2. **Alternative Credit Feasibility Analysis**:
   - Evaluates key financial ratios like **Debt Service Coverage Ratio (DSCR)** and profit margins.
   - Integrates **Alternative Credit Scoring (UU P2SK)** parameters (utility bills, airtime history, e-wallet turnover, e-commerce rating).

3. **AI Loan Feasibility & Approval Optimizer**:
   - Dynamic acceptance probability meter (High / Medium / Low) calculated in real-time.
   - Custom checklist guiding the merchant on specific actions to take to qualify for their desired loan amount.
   - **Banker Interview Cheat Sheet**: Provides actionable coaching quotes for merchants to confidently present their numbers to bankers.

4. **Official PDF Dossier Exporter**:
   - Exports a professional, 2-page pre-assessment financial dossier and interview guide using `jsPDF`.

---

## ⚙️ Technology Stack

- **AI Model**: Google Gemini 3.5 Flash
- **AI Tooling**: Google AI Studio (Prompt engineering & optimization)
- **API SDK**: `@google/genai` Node.js SDK (utilizing `responseSchema` for guaranteed Structured Output)
- **Frontend**: React 19, Vite, TypeScript, TailwindCSS, Recharts, jsPDF, Motion, Lucide Icons
- **Backend**: Express API Server, tsx (TypeScript Execute)

---

## 🗺️ Data Flow Architecture

```text
[Step 1] Merchant uploads physical ledger photo
   ↓ (Client UI / React)
[Step 2] Convert image to Base64 & Send request payload
   ↓ (Express API /api/analyze-record)
[Step 3] Dispatch payload via @google/genai SDK with responseSchema configuration
   ↓
[Step 4] Multimodal Vision OCR and transaction categorization
   ↓ (Google Gemini 3.5 Flash API)
[Step 5] Return 100% structured JSON response
   ↓ (Express API Server)
[Step 6] Render interactive P&L Dashboard, Recharts, and DSCR analysis
   ↓ (Client UI)
[Step 7] Export official readiness dossier & Banker Cheat Sheet PDF
     (jsPDF Engine)
```

---

## 🚀 Running Locally

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Gemini API Key** (obtainable from [Google AI Studio](https://aistudio.google.com/))

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/rafifernandaa/umkm-lens.git
   cd umkm-lens
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   VITE_API_URL="http://localhost:3000"
   ```

4. **Start the Application**:
   ```bash
   npm run dev
   ```
   *This launches both the frontend dev server and the backend Express server.*

5. **Open in Browser**:
   Navigate to `http://localhost:3000` to view the application.

---

## ⚖️ Legal Alignment (UU P2SK)
Under **Indonesian Law No. 4 of 2023 concerning the Development and Strengthening of the Financial Sector (UU P2SK)**, financial institutions are encouraged to deploy **Alternative Credit Scoring (ACS)** to foster financial inclusion for the 91 million unbanked/underbanked individuals. 

UMKM Lens supports this legislation by integrating non-collateral alternative data points (PLN utility logs, e-wallet velocity) into a standardized assessment tool, educating micro-merchants on how to present their alternative credit profile to banking institutions.

---

*Developed for the APAC GenAI Academy Hackathon.*
