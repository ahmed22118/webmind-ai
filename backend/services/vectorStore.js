import { ChromaClient } from "chromadb";

const client = new ChromaClient({ path: process.env.CHROMA_URL || "http://localhost:8000" });
const COLLECTION_NAME = "webmind_chunks";

let collectionPromise = null;

function getCollection() {
  if (!collectionPromise) {
    collectionPromise = client.getOrCreateCollection({ name: COLLECTION_NAME });
  }
  return collectionPromise;
}

/**
 * Stores chunks + their embeddings in ChromaDB, tagged with metadata
 * so we can filter by website later during retrieval.
 */
export async function upsertChunks(chunks) {
  if (chunks.length === 0) return;
  const collection = await getCollection();

  await collection.add({
    ids: chunks.map((c) => c.id),
    embeddings: chunks.map((c) => c.embedding),
    documents: chunks.map((c) => c.content),
    metadatas: chunks.map((c) => ({
      websiteId: c.websiteId,
      pageUrl: c.pageUrl,
      pageTitle: c.pageTitle,
      chunkIndex: c.chunkIndex,
    })),
  });
}

/**
 * Finds the top-K most similar chunks to a query embedding, scoped to one website.
 */
export async function queryChunks(queryEmbedding, websiteId, topK = 5) {
  const collection = await getCollection();

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: { websiteId },
  });

  const documents = results.documents?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];
  const distances = results.distances?.[0] || [];

  return documents.map((doc, i) => ({
    content: doc,
    ...metadatas[i],
    distance: distances[i],
  }));
}