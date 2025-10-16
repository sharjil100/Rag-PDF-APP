import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";
import { Queue } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ✅ load env first
dotenv.config();

// ✅ init Gemini client correctly (no object arg)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// you can switch to "gemini-1.5-pro" later if you want
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const QDRANT_COLLECTION =
  process.env.QDRANT_COLLECTION ?? "langchainjs-gemini-embeddings";

const app = express();
app.use(cors());

// ---- BullMQ queue (producer) ----
const queue = new Queue("file-upload-queue", {
  connection: { host: process.env.REDIS_HOST ?? "localhost", port: +(process.env.REDIS_PORT ?? 6379) },
});

// ---- File uploads ----
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "./uploads");
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage });

app.get("/", (_req, res) => {
  res.json({ Status: "All Good!!" });
});

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    await queue.add(
      "file-upload-queue",
      JSON.stringify({
        filename: req.file.originalname,
        destination: req.file.destination,
        path: req.file.path, // worker will normalize slashes
      })
    );

    res.json({ message: "PDF uploaded successfully", queued: true });
  } catch (e) {
    console.error("enqueue failed:", e);
    res.status(500).json({ error: "Failed to enqueue job" });
  }
});

// ---- Simple retrieval route: query existing Qdrant collection ----
app.get("/chat", async (_req, res) => {
  try {
    const userQuery = req.query.message;

    // Embeddings for queries
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      taskType: TaskType.RETRIEVAL_QUERY, // query mode
      apiKey: process.env.GOOGLE_API_KEY,
      maxConcurrency: 2,
      maxRetries: 8,
    });

    // Connect to existing collection (created by the worker)
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: QDRANT_URL,
      collectionName: QDRANT_COLLECTION,
    });

    const retriever = vectorStore.asRetriever({ k: 2 });
    const result = await retriever.invoke(userQuery);

    const SYSTEM_PROMPT = `You are a helpful AI assistant. Answer the user query using ONLY the context from the PDF files. If the answer is not in the context, say you don't know.

Context:
${JSON.stringify(result, null, 2)}
`;

    // ✅ Use Gemini properly (no .chat.completions)
    const prompt = `${SYSTEM_PROMPT}\nUser question: ${userQuery}`;
    const chatResult = await chatModel.generateContent(prompt);
    const answerText = chatResult.response.text();

    return res.json({
      message: answerText,
      docs: result,
    });
  } catch (e) {
    console.error("chat error:", e);
    res.status(500).json({ error: "Retrieval failed" });
  }
});

app.listen(8000, () => console.log(`Server is running on port: 8000`));
