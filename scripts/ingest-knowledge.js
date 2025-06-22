require("dotenv").config();
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { getJson } = require("serpapi");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");

// Initialize Firebase
let firebaseCredentials;
let db;

try {
  const base64 = process.env.FIREBASE_CREDENTIALS;
  const decoded = Buffer.from(base64, "base64").toString("utf-8");
  firebaseCredentials = JSON.parse(decoded);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseCredentials),
    });
  }
  db = admin.firestore();
  console.log("✅ Firebase initialized successfully");
} catch (err) {
  console.error("❌ Firebase init failed:", err.message);
  console.log("⚠️  This is likely a local development issue with Firebase credentials");
  console.log("💡 The script will continue but won't save to Firestore");
  console.log("🚀 For deployment, this should work fine with proper credentials");
  
  // Create a mock db object for local development
  db = {
    collection: () => ({
      doc: () => ({
        set: async () => console.log("   📝 [MOCK] Would save chunk to Firestore"),
      }),
      get: async () => ({ empty: true, docs: [] }),
    }),
    batch: () => ({
      set: () => {},
      delete: () => {},
      commit: async () => console.log("   📝 [MOCK] Would commit batch to Firestore"),
    }),
  };
}

// Function to chunk text into smaller pieces
function chunkText(text, maxChunkSize = 1000) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = "";
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        // If a single sentence is too long, split it
        chunks.push(trimmedSentence.substring(0, maxChunkSize));
        currentChunk = trimmedSentence.substring(maxChunkSize);
      }
    } else {
      currentChunk += (currentChunk ? ". " : "") + trimmedSentence;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Function to create embedding using OpenAI API
async function createEmbedding(text) {
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text
      })
    });

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error("Invalid embedding response");
    }
    
    return data.data[0].embedding;
  } catch (error) {
    console.error("❌ Failed to create embedding:", error.message);
    throw error;
  }
}

// Function to process a single file
async function processFile(filePath) {
  const fileName = path.basename(filePath, '.txt');
  console.log(`📖 Processing: ${fileName}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const chunks = chunkText(content);
    
    console.log(`   📝 Created ${chunks.length} chunks`);
    
    const batch = db.batch();
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await createEmbedding(chunk);
      
      const docRef = db.collection('knowledge_chunks').doc();
      batch.set(docRef, {
        source_file: fileName,
        chunk_index: i,
        content: chunk,
        embedding: embedding,
        created_at: new Date()
      });
      
      console.log(`   ✅ Chunk ${i + 1}/${chunks.length} processed`);
    }
    
    await batch.commit();
    console.log(`   🎉 All chunks for ${fileName} saved to Firestore`);
    
  } catch (error) {
    console.error(`❌ Failed to process ${fileName}:`, error.message);
  }
}

// Main function
async function main() {
  console.log("🚀 Starting knowledge base ingestion...");
  
  const knowledgeBasePath = path.join(__dirname, '..', 'knowledge_base');
  
  if (!fs.existsSync(knowledgeBasePath)) {
    console.error("❌ knowledge_base directory not found");
    process.exit(1);
  }
  
  const files = fs.readdirSync(knowledgeBasePath)
    .filter(file => file.endsWith('.txt'))
    .map(file => path.join(knowledgeBasePath, file));
  
  if (files.length === 0) {
    console.log("📭 No .txt files found in knowledge_base directory");
    process.exit(0);
  }
  
  console.log(`📁 Found ${files.length} files to process`);
  
  // Clear existing knowledge chunks one by one to avoid transaction limits
  console.log("🧹 Clearing existing knowledge chunks...");
  const existingChunks = await db.collection('knowledge_chunks').get();
  if (!existingChunks.empty) {
    for (const doc of existingChunks.docs) {
      await doc.ref.delete();
    }
    console.log(`🗑️  Deleted ${existingChunks.size} existing chunks`);
  }
  
  // Process each file
  for (const file of files) {
    await processFile(file);
    console.log(""); // Empty line for readability
  }
  
  console.log("🎉 Knowledge base ingestion complete!");
  console.log("💡 You can now use the knowledge base in your AI responses");
}

// Run the script
main().catch(console.error); 