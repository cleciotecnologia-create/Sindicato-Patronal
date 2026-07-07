import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";
import fs from "fs";
import webpush from "web-push";
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, collection, getDocs, addDoc, query, where, deleteDoc, updateDoc, collectionGroup } from "firebase/firestore";
import admin from "firebase-admin";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

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

// Initialize Firebase Admin SDK for admin tasks (to bypass Firestore rules on public endpoints)
let adminDbInstance;
try {
  let adminApp;
  if (admin.apps.length === 0) {
    adminApp = admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } else {
    adminApp = admin.apps[0];
  }
  
  // Use imported getFirestore for proper custom database ID initialization with admin SDK
  if (firebaseConfig.firestoreDatabaseId) {
    adminDbInstance = getAdminFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
  } else {
    adminDbInstance = getAdminFirestore(adminApp);
  }
} catch (error) {
  console.warn("Server: Failed to initialize Firebase Admin SDK:", error);
}
const adminDb = adminDbInstance || db;

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

  // API route for financial behavior analysis using Gemini
  app.post("/api/finance/analyze-behavior", async (req, res) => {
    try {
      const { member, billings } = req.body;

      if (!member) {
        return res.status(400).json({ error: "Dados do associado são obrigatórios." });
      }

      const prompt = `Você é um analista financeiro sênior e estrategista de retenção para o Sindicato Patronal SINPA.
      Sua tarefa é analisar o comportamento financeiro do associado abaixo com base no seu cadastro e histórico de mensalidades/boletos.
      A partir disso, diagnostique seu perfil, nível de risco de cancelamento/desfiliação (churn) ou inadimplência, e forneça uma análise qualitativa técnica detalhada e ações recomendadas personalizadas (seja cobrança amigável/negociação, seja fidelização/retenção).
      
      DADOS DO ASSOCIADO:
      - Razão Social: ${member.name}
      - CNPJ: ${member.cnpj || "N/A"}
      - E-mail: ${member.email || "N/A"}
      - Telefone/WhatsApp: ${member.phone || "N/A"}
      - Representante Legal: ${member.representative || "N/A"}
      - Nível de Associação: ${member.level || "Bronze"}
      - Status Cadastral: ${member.status || "Ativo"}
      
      HISTÓRICO FINANCEIRO (MENSALIDADES/BOLETOS):
      ${JSON.stringify(billings || [], null, 2)}
      
      Por favor, analise cuidadosamente as datas de vencimento, valores e o status (se pago/liquidado ou pendente/atrasado). Considere a data atual real: 6 de julho de 2026.
      Gere um parecer estruturado contendo:
      1. profile: Resumo do perfil financeiro (ex: "Adimplente Exemplar", "Inadimplência Recorrente", "Atrasos Esporádicos", "Risco de Churn").
      2. riskLevel: Grau de risco de inadimplência/churn ("Baixo", "Médio", "Alto", "Crítico").
      3. analysis: Uma análise de texto explicando o comportamento observado (ex: taxa de pontualidade, quantidade de boletos em atraso, sazonalidade).
      4. retentionStrategy: Proposta estratégica de retenção ou abordagem de negociação conforme a situação do associado.
      5. suggestedActions: Uma lista (array de strings) de 2 a 4 ações imediatas sugeridas que o financeiro/relacionamento do sindicato deve tomar.
      6. personalizedMessage: Um modelo/template personalizado de mensagem (em tom altamente profissional, cortês e adaptado à situação atual do associado) para envio por WhatsApp ou e-mail, citando os dados dele se pertinente (sem dados fictícios adicionais).

      Retorne as informações exatamente como um objeto JSON válido correspondente ao schema especificado.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              profile: { type: Type.STRING, description: "O perfil de comportamento financeiro identificado." },
              riskLevel: { type: Type.STRING, description: "O nível de risco estimado (Baixo, Médio, Alto, Crítico)." },
              analysis: { type: Type.STRING, description: "A análise qualitativa e quantitativa detalhada do histórico de boletos." },
              retentionStrategy: { type: Type.STRING, description: "A estratégia recomendada para retenção ou cobrança." },
              suggestedActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de ações práticas a serem tomadas pelo sindicato."
              },
              personalizedMessage: { type: Type.STRING, description: "Modelo pronto de mensagem personalizada e de alta conversão para o associado." }
            },
            required: ["profile", "riskLevel", "analysis", "retentionStrategy", "suggestedActions", "personalizedMessage"]
          }
        }
      });

      const analysisResult = JSON.parse(result.text || "{}");
      res.json(analysisResult);
    } catch (error: any) {
      console.error("Gemini Finance Analysis Error:", error);
      res.status(500).json({ error: error.message || "Falha ao analisar comportamento financeiro com Gemini" });
    }
  });

  // Public stats endpoint for landing page (to show real database counts)
  app.get("/api/public/stats", async (req, res) => {
    try {
      const isAdminDb = adminDbInstance && typeof (adminDbInstance as any).collection === "function";
      
      let membersCount = 0;
      let totalPaidAmount = 0;
      let totalPendingAmount = 0;
      let totalBoletos = 0;

      if (isAdminDb) {
        // Use administrative SDK to bypass client-side security rules for public dashboard stats
        const membersSnap = await (adminDb as any).collection("members").get();
        membersCount = membersSnap.size;

        const boletosSnap = await (adminDb as any).collectionGroup("boletos").get();
        boletosSnap.forEach((doc: any) => {
          const data = doc.data();
          const amt = Number(data.amount) || 0;
          totalBoletos++;
          if (data.status === "paid") {
            totalPaidAmount += amt;
          } else {
            totalPendingAmount += amt;
          }
        });
      } else {
        // Fallback to client SDK if Admin SDK is unavailable (may encounter rules restrictions but avoids crash)
        const membersSnap = await getDocs(collection(db, "members"));
        membersCount = membersSnap.size;

        const boletosSnap = await getDocs(collectionGroup(db, "boletos"));
        boletosSnap.forEach((doc) => {
          const data = doc.data();
          const amt = Number(data.amount) || 0;
          totalBoletos++;
          if (data.status === "paid") {
            totalPaidAmount += amt;
          } else {
            totalPendingAmount += amt;
          }
        });
      }

      res.json({
        membersCount,
        totalPaidAmount,
        totalPendingAmount,
        totalBoletos,
        approvalRate: 98
      });
    } catch (error: any) {
      console.error("Error fetching public stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Public member search by CNPJ or Name (to show real database matches)
  app.get("/api/public/search-member", async (req, res) => {
    try {
      const { term } = req.query;
      if (!term || typeof term !== "string") {
        return res.status(400).json({ error: "Termo de busca é obrigatório." });
      }

      const normalizedTerm = term.trim().toLowerCase();
      if (normalizedTerm.length < 3) {
        return res.json({ members: [] });
      }

      const foundMembers: any[] = [];
      const isAdminDb = adminDbInstance && typeof (adminDbInstance as any).collection === "function";

      if (isAdminDb) {
        // Use administrative SDK to bypass client-side security rules for public search
        const membersSnap = await (adminDb as any).collection("members").get();
        membersSnap.forEach((docSnap: any) => {
          const data = docSnap.data();
          const name = (data.name || "").toLowerCase();
          const cnpj = (data.cnpj || "").replace(/[^\d]/g, ""); // strip non-digits
          const searchCnpj = normalizedTerm.replace(/[^\d]/g, "");

          const isNameMatch = name.includes(normalizedTerm);
          const isCnpjMatch = searchCnpj && cnpj.includes(searchCnpj);

          if (isNameMatch || isCnpjMatch) {
            foundMembers.push({
              id: docSnap.id,
              name: data.name,
              cnpj: data.cnpj,
              status: data.status || "active",
              createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
              representative: data.representative || "",
              email: data.email || "",
            });
          }
        });
      } else {
        // Fallback to client SDK if Admin SDK is unavailable
        const membersSnap = await getDocs(collection(db, "members"));
        membersSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const name = (data.name || "").toLowerCase();
          const cnpj = (data.cnpj || "").replace(/[^\d]/g, ""); // strip non-digits
          const searchCnpj = normalizedTerm.replace(/[^\d]/g, "");

          const isNameMatch = name.includes(normalizedTerm);
          const isCnpjMatch = searchCnpj && cnpj.includes(searchCnpj);

          if (isNameMatch || isCnpjMatch) {
            foundMembers.push({
              id: docSnap.id,
              name: data.name,
              cnpj: data.cnpj,
              status: data.status || "active",
              createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
              representative: data.representative || "",
              email: data.email || "",
            });
          }
        });
      }

      res.json({ members: foundMembers });
    } catch (error: any) {
      console.error("Error searching public members:", error);
      res.status(500).json({ error: error.message });
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
