import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cron from "node-cron";
import os from "os";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Vite needs this disabled for dev
  }));
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  // 2. Scheduled Tasks (Simulation of backend worker)
  cron.schedule("*/5 * * * *", () => {
    console.log(`[Worker] Running periodic maintenance task at ${new Date().toISOString()}`);
  });

  // 3. API Routes
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLang } = req.body;
      if (!text || !targetLang) {
        return res.status(400).json({ error: "Text and targetLang are required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Translate the following text to ${targetLang}. Return ONLY the translated text, no extra commentary: \n\n${text}`,
      });

      res.json({ translatedText: response.text });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Failed to translate" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "online",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      version: "2.5.0"
    });
  });

  app.get("/api/stats", (req, res) => {
    res.json({
      activeUsers: Math.floor(Math.random() * 100) + 50,
      totalTrades: 1240,
      systemLoad: os.loadavg()[0].toFixed(2),
      memoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
    });
  });

  app.get("/api/server-info", (req, res) => {
    res.json({
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpus: 1, // Simulated for cloud run
      region: "europe-west1"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // In production, serve from the 'dist' directory
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Core running on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Worker active monitoring started`);
  });
}

startServer();
