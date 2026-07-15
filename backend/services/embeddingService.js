import { pipeline } from "@xenova/transformers";

let embedderPromise = null;

// Loads the embedding model once and reuses it across calls (singleton pattern)
function getEmbedder() {
  if (!embedderPromise) {
    console.log("Loading local embedding model (first run downloads ~90MB, then cached)...");
    embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedderPromise;
}

/**
 * Converts a piece of text into a 384-dimension embedding vector.
 */
export async function generateEmbedding(text) {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

/**
 * Batch version — embeds multiple texts sequentially.
 * (Kept simple/sequential for MVP; could parallelize later if speed becomes an issue.)
 */
export async function generateEmbeddings(texts) {
  const embeddings = [];
  for (const text of texts) {
    embeddings.push(await generateEmbedding(text));
  }
  return embeddings;
}