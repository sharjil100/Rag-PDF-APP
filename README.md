# 📚 RAG-PDF-APP  
> Full-Stack AI Retrieval-Augmented Generation System — built with **LangChain**, **Qdrant**, **Next.js**, and **Python**

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.0-06B6D4?logo=tailwindcss"/>
  <img src="https://img.shields.io/badge/Qdrant-VectorDB-FF6B6B?logo=qdrant"/>
  <img src="https://img.shields.io/badge/LangChain-Framework-10B981?logo=chainlink"/>
  <img src="https://img.shields.io/badge/License-MIT-lightgrey"/>
</p>

---

## 🎥 Live Demo

🚀 **Live App:** [ragpdf.vercel.app](https://ragpdf.vercel.app)  
🧠 **API Endpoint:** [api.ragpdf.app/docs](https://api.ragpdf.app/docs)

*(Note: Replace the links above with your actual deployment URLs.)*

---

## 🌟 Overview

**RAG-PDF-APP** is an intelligent full-stack application that lets users **upload PDF files** and **converse with them** using AI.  
It leverages **Retrieval-Augmented Generation (RAG)** to generate responses grounded in your documents — **no hallucinations, only context-based answers**.

> 💡 *"Turning your PDFs into conversational knowledge graphs."*

---

## 🧠 Core Concept

Traditional LLMs “guess” answers from their parameters.  
RAG systems **retrieve** relevant context from your documents before generating a response — combining *memory + reasoning*.

### 🔍 Retrieval + 🧩 Generation = 💬 RAG Intelligence

---

## 🧩 Tech Stack

| Layer | Technology | Purpose |
|:--|:--|:--|
| **Frontend** | [Next.js 14](https://nextjs.org/) + [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Dynamic UI & chat interface |
| **Auth** | [Clerk](https://clerk.com/) | User authentication & session |
| **Backend API** | [FastAPI](https://fastapi.tiangolo.com/) | RESTful document and query endpoints |
| **AI Layer** | [LangChain](https://www.langchain.com/) | LLM orchestration and RAG pipeline |
| **Vector Store** | [Qdrant](https://qdrant.tech/) | High-speed semantic search |
| **LLM** | OpenAI / Anthropic / Ollama | Context-aware answer generation |

---

# 🧭 Architecture

```mermaid
graph TD
    A[User Uploads PDF] --> B[FastAPI Backend]
    B --> C[LangChain Pipeline]
    C --> D[Text Chunking & Embeddings]
    D --> E[Qdrant Vector Store]
    E --> F[Context Retrieval]
    F --> G[LLM &#40;GPT • Claude • Ollama&#41;]
    G --> H[Next.js Chat Interface]


