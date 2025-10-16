import { Worker } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";
const QDRANT_COLLECTION =
  process.env.QDRANT_COLLECTION ?? "langchainjs-gemini-embeddings";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    console.log("📄 New Job:", job.data);
    const data = typeof job.data === "string" ? JSON.parse(job.data) : job.data;

    try {
      // --- Fix Windows path ---
      const fixedPath = path.resolve(data.path).replace(/\\/g, "/");
      console.log("📁 Fixed path:", fixedPath);

      // --- Load PDF with proper configuration ---
      const loader = new PDFLoader(fixedPath, {
        splitPages: true, // Split into pages
      });
      
      const rawDocs = await loader.load();
      console.log(`📄 Loaded ${rawDocs.length} page(s) from PDF`);

      if (rawDocs.length === 0) {
        console.warn("⚠️ No content found in PDF! Skipping upload to Qdrant.");
        return;
      }

      // --- Split documents into smaller chunks ---
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const docs = await textSplitter.splitDocuments(rawDocs);
      console.log(`✂️ Split into ${docs.length} chunk(s)`);

      if (docs.length === 0) {
        console.warn("⚠️ No content after splitting! Skipping upload to Qdrant.");
        return;
      }

      // --- Gemini embeddings for documents (ingestion) ---
      const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",           // 768-dim
        taskType: TaskType.RETRIEVAL_DOCUMENT, // doc mode
        title: data?.filename ?? "document",
        apiKey: process.env.GOOGLE_API_KEY,
        maxConcurrency: 2,
        maxRetries: 8,
      });

      // Create/append to the collection (768-dim)
      await QdrantVectorStore.fromDocuments(docs, embeddings, {
        url: QDRANT_URL,
        collectionName: QDRANT_COLLECTION,
      });

      console.log("✅ Document successfully added to Qdrant!");
    } catch (error) {
      console.error("❌ Error processing job:", error);
    }
  },
  {
    concurrency: 2, // keep low; raise slowly if stable
    connection: { host: "localhost", port: 6379 },
  }
);
