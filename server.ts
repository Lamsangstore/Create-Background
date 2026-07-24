import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Load local secrets (GEMINI_API_KEY, etc.) from .env.local / .env for local dev.
// In AI Studio / production these are injected at runtime, so missing files are fine.
// Existing shell env vars are NOT overridden.
dotenv.config({ path: [".env.local", ".env"], quiet: true });

async function startServer() {
  const app = express();
  // Hosts like Render/Cloud Run inject the port via env; fall back to 3000 locally.
  const PORT = Number(process.env.PORT) || 3000;

  // Allow payload up to 50mb for multi-high-res image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({ status: "ok", hasApiKey: hasKey });
  });

  // AI Studio Product Background Replacement API Endpoint
  app.post("/api/edit-image", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY_MISSING",
          message: "ไม่พบคีย์ GEMINI_API_KEY กรุณาตรวจสอบการตั้งค่า Secrets",
        });
      }

      const {
        imageBase64,
        mimeType = "image/png",
        referenceImageBase64,
        referenceMimeType = "image/png",
        prompt,
        aspectRatio = "1:1",
        imageSize = "1K",
        model = "gemini-3.1-flash-image",
      } = req.body;

      if (!imageBase64 || !prompt) {
        return res.status(400).json({
          error: "INVALID_REQUEST",
          message: "กรุณาระบุภาพต้นแบบและคำสั่งสำหรับ AI",
        });
      }

      // Strip data URI header if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Build the request parts. When a reference image is supplied it is sent as a
      // second image so the model can match its background scene and lighting.
      const parts: any[] = [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType,
          },
        },
      ];

      if (referenceImageBase64) {
        const cleanReference = referenceImageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
        parts.push({
          inlineData: {
            data: cleanReference,
            mimeType: referenceMimeType,
          },
        });
      }

      parts.push({ text: prompt });

      console.log(
        `[API /edit-image] Processing with model=${model}, size=${imageSize}, aspect=${aspectRatio}, reference=${Boolean(referenceImageBase64)}`
      );

      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: parts,
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: imageSize,
          },
        },
      });

      let resultImageData: string | null = null;
      let resultMimeType = "image/png";
      let textFeedback = "";

      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            resultImageData = part.inlineData.data;
            if (part.inlineData.mimeType) {
              resultMimeType = part.inlineData.mimeType;
            }
          } else if (part.text) {
            textFeedback += part.text + " ";
          }
        }
      }

      if (!resultImageData) {
        return res.status(500).json({
          error: "GENERATION_EMPTY",
          message: "AI ไม่ได้คืนค่าไฟล์รูปภาพกลับมา กรุณาลองใหม่อีกครั้งหรือปรับเปลี่ยน Prompt",
          textFeedback: textFeedback.trim(),
        });
      }

      return res.json({
        success: true,
        resultImage: `data:${resultMimeType};base64,${resultImageData}`,
        mimeType: resultMimeType,
        textFeedback: textFeedback.trim(),
      });
    } catch (error: any) {
      console.error("[API Error /edit-image]:", error);

      const errMessageStr = String(error?.message || "");
      const isQuotaError = 
        error?.status === 429 || 
        errMessageStr.includes("429") || 
        errMessageStr.includes("RESOURCE_EXHAUSTED") || 
        errMessageStr.includes("Quota exceeded");

      if (isQuotaError) {
        return res.status(429).json({
          error: "RATE_LIMIT_EXCEEDED",
          isRateLimit: true,
          message: "โควต้าการสร้างรูปภาพ AI ของ Gemini ชั่วคราวเกินขีดจำกัด (Rate Limit 429) กรุณารอประมาณ 30 วินาที แล้วลองใหม่อีกครั้ง",
        });
      }

      return res.status(500).json({
        error: "SERVER_ERROR",
        message: error?.message || "เกิดข้อผิดพลาดในการประมวลผลรูปภาพด้วย AI",
      });
    }
  });

  // Lamsang Listing Studio — text + vision (OCR / translate / copywriting) via Gemini
  app.post("/api/listing", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY_MISSING",
          message: "ไม่พบคีย์ GEMINI_API_KEY กรุณาตรวจสอบการตั้งค่า Secrets",
        });
      }

      const {
        images = [],
        prompt,
        model = "gemini-3.6-flash",
        maxOutputTokens = 8192,
      } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "INVALID_REQUEST", message: "กรุณาระบุคำสั่ง (prompt)" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } },
      });

      const parts: any[] = [];
      for (const img of Array.isArray(images) ? images : []) {
        if (!img?.data) continue;
        const clean = String(img.data).replace(/^data:image\/[a-zA-Z]+;base64,/, "");
        parts.push({ inlineData: { data: clean, mimeType: img.mimeType || "image/jpeg" } });
      }
      parts.push({ text: prompt });

      console.log(`[API /listing] model=${model}, images=${parts.length - 1}`);

      // Gemini 3 keeps "thinking" on; give a generous output budget so the thinking
      // tokens don't starve the actual answer (these responses are otherwise moderate).
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: { maxOutputTokens },
      });

      let text = "";
      const outParts = response.candidates?.[0]?.content?.parts;
      if (outParts) for (const p of outParts) if (p.text) text += p.text;

      return res.json({ success: true, text: text.trim() });
    } catch (error: any) {
      console.error("[API Error /listing]:", error);
      const errMessageStr = String(error?.message || "");
      const isQuotaError =
        error?.status === 429 ||
        errMessageStr.includes("429") ||
        errMessageStr.includes("RESOURCE_EXHAUSTED") ||
        errMessageStr.includes("Quota exceeded");
      if (isQuotaError) {
        return res.status(429).json({
          error: "RATE_LIMIT_EXCEEDED",
          isRateLimit: true,
          message: "โควต้า Gemini ชั่วคราวเกินขีดจำกัด (Rate Limit 429) กรุณารอสักครู่แล้วลองใหม่",
        });
      }
      return res.status(500).json({
        error: "SERVER_ERROR",
        message: error?.message || "เกิดข้อผิดพลาดในการประมวลผลข้อความด้วย AI",
      });
    }
  });

  // Serve Vite in dev, static files in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
