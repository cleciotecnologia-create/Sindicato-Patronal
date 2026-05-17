import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Initialization
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API route for FAQ generation
  app.post("/api/faq/analyze", async (req, res) => {
    try {
      const { queries } = req.body;

      if (!queries || !Array.isArray(queries)) {
        return res.status(400).json({ error: "Invalid queries format. Expected an array of strings." });
      }

      if (queries.length === 0) {
        return res.json({ faq: [] });
      }

      const prompt = `Analyze these user queries and suggestions for a Patronal Union (Sindicato Patronal).
      Generate a list of frequently asked questions (FAQ) based on these queries.
      Each FAQ item must have a category, a question, and a clear, professional answer based on general labor laws and CCT (Convenção Coletiva de Trabalho) principles.
      
      User queries:
      ${queries.join('\n')}
      
      Return the output as a valid JSON array of objects.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, description: "Category of the question (e.g., Legal, Finance, Benefits)" },
                question: { type: Type.STRING, description: "The summarized frequent question" },
                answer: { type: Type.STRING, description: "Professional answer based on CCT/Law" },
                relevance: { type: Type.NUMBER, description: "Relevance score from 1 to 10 based on frequency" }
              },
              required: ["category", "question", "answer"]
            }
          }
        }
      });

      const faq = JSON.parse(result.text || "[]");
      res.json({ faq });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate FAQ" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
