import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";
import fs from "fs";
import webpush from "web-push";
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, collection, getDocs, addDoc, query, where, deleteDoc, updateDoc } from "firebase/firestore";

dotenv.config();

// Read Firebase config from file for server-side initialization
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));

// Initialize Firebase SDK on server
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore with database ID support to prevent NOT_FOUND errors
let dbInstance;
try {
  if (firebaseConfig.firestoreDatabaseId) {
    dbInstance = initializeFirestore(firebaseApp, {}, firebaseConfig.firestoreDatabaseId);
  } else {
    dbInstance = getFirestore(firebaseApp);
  }
} catch (error) {
  console.warn("Server: Failed to initialize Firestore with custom database ID, falling back to default:", error);
  dbInstance = getFirestore(firebaseApp);
}

const db = dbInstance;

// Initialize VAPID Keys for Web Push
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.log("No VAPID keys found in environment. Generating a new pair...");
  const generated = webpush.generateVAPIDKeys();
  vapidKeys = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
  };
}

webpush.setVapidDetails(
  "mailto:suporte@sinpa.org.br",
  vapidKeys.publicKey!,
  vapidKeys.privateKey!
);

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

  // API route for Plantão Jurídico classification & routing
  app.post("/api/plantao/classify", async (req, res) => {
    try {
      const { question } = req.body;

      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "Invalid question format. Expected a string." });
      }

      const prompt = `Você é um assessor jurídico especialista para o Sindicato Patronal SINPA (Sindicato das Indústrias Metalúrgicas e Similares do Estado).
      Sua tarefa é analisar e classificar a seguinte dúvida jurídica enviada por um associado ou pelo seu contador.
      
      Dúvida:
      "${question}"
      
      Você deve analisar a pergunta e classificar sob as seguintes chaves de dados:
      1. category: Escolha uma das categorias exatas listadas abaixo:
         - "Trabalhista" (Dúvidas sobre rescisões, horas extras, banco de horas, demissões, contratos de trabalho, convenções trabalhistas em geral)
         - "Previdenciário" (Aposentadorias, auxílio-doença, afastamentos, eSocial previdenciário, saúde ocupacional)
         - "Tributário" (Contribuições sindicais, impostos federais/estaduais/municipais, taxas patronais, REFIS)
         - "CCT & Negociação Coletiva" (Cláusulas da Convenção Coletiva de Trabalho vigente, reajustes salariais acordados, regras de feriados/domingos, homologações)
         - "Geral" (Dúvidas administrativas gerais ou que não se enquadram diretamente nas categorias anteriores)
      
      2. urgency: Escolha um dos três níveis exatos abaixo:
         - "Baixa" (Consultas teóricas ou preventivas, dúvidas conceituais sem prazo crítico)
         - "Média" (Situações operacionais cotidianas, reajuste salarial aplicável na folha, etc.)
         - "Alta" (Ações judiciais iminentes, notificação judicial, greves, fiscalização ativa do Ministério do Trabalho)
         
      3. assignedLawyer e assignedLawyerEmail: Escolha o advogado especialista responsável de acordo com a categoria:
         - Se category for "Trabalhista", atribua a:
           - assignedLawyer: "Dra. Amanda Silva"
           - assignedLawyerEmail: "amanda.silva@sinpa.org.br"
         - Se category for "Tributário", atribua a:
           - assignedLawyer: "Dr. Roberto Santos"
           - assignedLawyerEmail: "roberto.santos@sinpa.org.br"
         - Se category for "Previdenciário" ou "CCT & Negociação Coletiva", atribua a:
           - assignedLawyer: "Dra. Carla Menezes"
           - assignedLawyerEmail: "carla.menezes@sinpa.org.br"
         - Se category for "Geral", atribua a:
           - assignedLawyer: "Dr. Roberto Santos"
           - assignedLawyerEmail: "roberto.santos@sinpa.org.br"
         
      4. aiAnalysis: Gere uma análise jurídica inicial fundamentada, porém apresentada como orientação preliminar ("Análise de Orientação Prévia"). Use referências gerais às boas práticas regulatórias e trabalhistas brasileiras ou regras das Convenções Coletivas. Seja técnico, preciso, educado, e lembre que o parecer oficial definitivo será emitido pelo advogado atribuído. Escreva em português, de forma concisa e muito profissional.
      
      Retorne as informações exatamente como um objeto JSON válido correspondente ao schema especificado.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "A categoria da dúvida jurídica" },
              urgency: { type: Type.STRING, description: "O grau de urgência da dúvida" },
              assignedLawyer: { type: Type.STRING, description: "Nome do advogado responsável atribuído" },
              assignedLawyerEmail: { type: Type.STRING, description: "E-mail de encaminhamento do advogado" },
              aiAnalysis: { type: Type.STRING, description: "Uma breve e refinada análise jurídica prévia do Gemini para auxiliar na resolução" }
            },
            required: ["category", "urgency", "assignedLawyer", "assignedLawyerEmail", "aiAnalysis"]
          }
        }
      });

      const classificationResult = JSON.parse(result.text || "{}");
      res.json(classificationResult);
    } catch (error: any) {
      console.error("Gemini Classify Error:", error);
      res.status(500).json({ error: error.message || "Failed to classify and route legal query" });
    }
  });

  // API route for simulating a formal lawyer response using Gemini
  app.post("/api/plantao/simulate-reply", async (req, res) => {
    try {
      const { question, lawyerName } = req.body;

      if (!question || !lawyerName) {
        return res.status(400).json({ error: "Missing required fields: question or lawyerName." });
      }

      const prompt = `Aja como o(a) advogado(a) especialista do sindicato patronal SINPA, ${lawyerName}. 
      Você deve redigir um parecer jurídico formal, completo, muito polido e definitivo em resposta à seguinte dúvida enviada pelo contador/associado:
      
      Dúvida:
      "${question}"
      
      Regras de redação:
      1. Comece com uma saudação cortês e formal de advogado (ex: "Prezado(a), analisamos com atenção a questão levantada...").
      2. Citação da base legal: Faça referências estruturadas à CLT (Consolidação das Leis do Trabalho) ou às Convenções Coletivas de Trabalho (CCT) do SINPA pertinentes ao assunto.
      3. Seja extremamente claro nas orientações práticas (o que a empresa deve ou não fazer para mitigar riscos).
      4. Conclua se colocando à disposição para reuniões presenciais ou esclarecimentos adicionais na sede do sindicato.
      5. Assine no final de forma profissional: "Cordialmente, ${lawyerName} - Departamento Jurídico SINPA".
      
      Escreva em português, de forma fluida, e sem marcações de formato de saída complexas além de parágrafos limpos.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ replyText: result.text || "Desculpe, falha ao gerar parecer jurídico." });
    } catch (error: any) {
      console.error("Gemini Reply Simulation Error:", error);
      res.status(500).json({ error: error.message || "Failed to simulate lawyer reply" });
    }
  });

  // Web Push API: Get Public VAPID Key
  app.get("/api/push/public-key", (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  // Web Push API: Subscribe to Push
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { subscription, userId } = req.body;
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: "Subscription endpoint is required." });
      }

      // Check if subscription already exists
      const q = query(
        collection(db, "push_subscriptions"),
        where("subscription.endpoint", "==", subscription.endpoint)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        await addDoc(collection(db, "push_subscriptions"), {
          subscription,
          userId: userId || null,
          createdAt: new Date().toISOString(),
        });
      } else {
        const docRef = snap.docs[0].ref;
        await updateDoc(docRef, {
          userId: userId || null,
          updatedAt: new Date().toISOString(),
        });
      }

      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error("Error saving subscription:", error);
      res.status(500).json({ error: error.message || "Failed to subscribe" });
    }
  });

  // Web Push API: Unsubscribe
  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint is required." });
      }

      const q = query(
        collection(db, "push_subscriptions"),
        where("subscription.endpoint", "==", endpoint)
      );
      const snap = await getDocs(q);
      const deletions = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletions);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error unsubscribing:", error);
      res.status(500).json({ error: error.message || "Failed to unsubscribe" });
    }
  });

  // Web Push API: Send Notification (Broadcast or specific User ID)
  app.post("/api/push/send", async (req, res) => {
    try {
      const { title, body, userId, url } = req.body;
      if (!title || !body) {
        return res.status(400).json({ error: "Title and body are required." });
      }

      let q;
      if (userId) {
        q = query(collection(db, "push_subscriptions"), where("userId", "==", userId));
      } else {
        q = collection(db, "push_subscriptions");
      }

      const snap = await getDocs(q);
      const payload = JSON.stringify({ title, body, url: url || "/" });

      const notifications = snap.docs.map(async (docSnap) => {
        const data = docSnap.data() as any;
        try {
          await webpush.sendNotification(data.subscription, payload);
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log("Removing expired push subscription:", data.subscription.endpoint);
            await deleteDoc(docSnap.ref);
          } else {
            console.error("Error sending push:", err);
          }
        }
      });

      await Promise.all(notifications);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error sending push notifications:", error);
      res.status(500).json({ error: error.message || "Failed to send notifications" });
    }
  });

  // Web Push API: Get Active Subscriptions Count
  app.get("/api/push/subscriptions-count", async (req, res) => {
    try {
      const snap = await getDocs(collection(db, "push_subscriptions"));
      res.json({ count: snap.size });
    } catch (error: any) {
      console.error("Error fetching subscriptions count:", error);
      res.status(500).json({ error: error.message || "Failed to get count" });
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
