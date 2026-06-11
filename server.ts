import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Set up large JSON payload handling for image base64 data
app.use(express.json({ limit: "15mb" }));

// Lazy init for Google Gen AI
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please configure it in the Secrets panel of AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST Route for financial record extraction from receipt photos / handwriting images
app.post("/api/analyze-record", async (req, res) => {
  try {
    const { image, businessType, period, recordType, lang } = req.body;

    if (!image) {
      res.status(400).json({ error: "Missing image payload. Please capture or upload a photo." });
      return;
    }

    // Clean base64 string
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const ai = getAiClient();

    const promptText = `
      You are UMKM Lens, an advanced AI Credit Readiness Agent specialized in analyzing handwritten notebook logs, supplier receipts, loose slips, and business memos belonging to Indonesian micro operations (Warung, Kerajinan, Makanan Rumahan).
      
      Look closely at this image. Extract all monetary transactions, financial logs, items, and figures.
      
      CRITICAL INSTRUCTIONS:
      1. Business Type Context: The user's business is currently registered as "${businessType || "umum/lainnya"}".
      2. Record Period: The log is for "${period || "Bulan ini"}".
      3. Classification:
         - Classify each item category as "pemasukan" (income/revenue) or "pengeluaran" (expense/costs). Use standard context to infer this.
         - Normalize currency shorthands (e.g., '10rb' -> 10000, '5k' -> 5000, '1juta' -> 1000000, '25.000' -> 25000, 'Rp. 150.000' -> 150000).
         - Resolve Indonesian and local Javanese/Sunda slang or abbreviations where possible (e.g., 'pesen' -> order, 'bks' -> bungkus, 'modal' -> initial cash or expense context, 'telor' -> eggs, etc.).
      4. Ambiguity / Lower Confidence:
         - If any item name is blurry, has unreadable numbers, or is cut off, assign a confidence level of "low".
         - Provide a helpful flag message suggesting how they might double-check or rewrite (in ${lang === "en" ? "English" : "Bahasa Indonesia"}).
         - If highly readable, set confidence to "high".
      5. Output Language: Use clear, jargon-free ${lang === "en" ? "English" : "Bahasa Indonesia"} for item descriptions and flag warnings. Keep categories as "pemasukan", "pengeluaran", or "unknown" and keys as "pemasukan", "pengeluaran", "laba_bersih" in totals to preserve data structures.
      
      Return a response strictly matching the schema below.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        },
        {
          text: promptText,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["period", "business_type", "items", "totals"],
          properties: {
            period: {
              type: Type.STRING,
              description: "The period specified by user or deduced, e.g., 'Mei 2026'",
            },
            business_type: {
              type: Type.STRING,
              description: "E.g., 'makanan', 'kerajinan', 'jasa', etc.",
            },
            items: {
              type: Type.ARRAY,
              description: "List of items extracted from the ledger",
              items: {
                type: Type.OBJECT,
                required: ["description", "category", "amount", "confidence"],
                properties: {
                  description: {
                    type: Type.STRING,
                    description: "Item name, activity, or transaction description in Bahasa Indonesia",
                  },
                  category: {
                    type: Type.STRING,
                    description: "pemasukan, pengeluaran, or unknown",
                  },
                  amount: {
                    type: Type.INTEGER,
                    description: "Calculated numeric value in IDR",
                  },
                  confidence: {
                    type: Type.STRING,
                    description: "high or low",
                  },
                  flag: {
                    type: Type.STRING,
                    description: "If confidence is low, details why (e.g. 'Slightly blur' or 'Tulisan kurang jelas')",
                  },
                },
              },
            },
            totals: {
              type: Type.OBJECT,
              required: ["pemasukan", "pengeluaran", "laba_bersih"],
              properties: {
                pemasukan: {
                  type: Type.INTEGER,
                  description: "Sum of all pemasukan item amounts",
                },
                pengeluaran: {
                  type: Type.INTEGER,
                  description: "Sum of all pengeluaran item amounts",
                },
                laba_bersih: {
                  type: Type.INTEGER,
                  description: "Total net profit: pemasukan minus pengeluaran",
                },
              },
            },
          },
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("AI processing failure:", error);
    res.status(500).json({
      error: error.message || "Gagal memproses gambar. Pastikan API Key diatur dengan benar dan gambar valid.",
    });
  }
});

// Configure Vite middleware in development mode
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from compiled dist directory
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[UMKM Lens Server] listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Express initialization failed:", err);
});
