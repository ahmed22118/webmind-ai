import { generateEmbedding } from "../services/embeddingService.js";
import { upsertChunks, queryChunks } from "../services/vectorStore.js";
import Chunk from "../models/Chunk.js";
import { processHtmlIntoChunks } from "../services/contentProcessor.js";
import { assertSafeCrawlTarget } from "../utils/ssrfGuard.js";
import Website from "../models/Website.js";
import Page from "../models/Page.js";
import { crawlWebsite } from "../services/crawler.js";

export async function createWebsite(req, res) {
  try {
    const { url, forceRecrawl } = req.body;
    if (!url) return res.status(400).json({ message: "URL is required" });

    let parsed;
    try {
      await assertSafeCrawlTarget(url);
      parsed = new URL(url);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    // Normalize for comparison so trailing slashes / casing don't cause
    // false "new" entries for a URL the user already analyzed.
    const normalizedRootUrl = url.trim().replace(/\/+$/, "").toLowerCase();

    if (!forceRecrawl) {
      const existingMatch = await Website.findOne({
        owner: req.user._id,
         status: "completed",
        rrootUrl: new RegExp(`^${normalizedRootUrl}/?$`, "i"),
      });

      if (existingMatch) {
        return res.status(200).json({ website: existingMatch, reused: true });
      }
    }

    const website = await Website.create({
      owner: req.user._id,
      rootUrl: url,
      domain: parsed.hostname,
      status: "crawling",
    });

    const maxPages = parseInt(process.env.MAX_CRAWL_PAGES, 10) || 25;

    // Synchronous for MVP: request waits until the crawl finishes
    try {
      const savedPages = [];

      const pagesCrawled = await crawlWebsite(url, maxPages, async ({ url, title, html }) => {
        const page = await Page.create({ website: website._id, url, title, rawHtml: html });
        savedPages.push(page);
      });

      // Clean + chunk every crawled page, then embed and store vectors
      let totalChunks = 0;
      for (const page of savedPages) {
        const chunks = processHtmlIntoChunks(page.rawHtml, page.url);
        if (chunks.length === 0) continue;

        const savedChunks = await Chunk.insertMany(
          chunks.map((c) => ({
            website: website._id,
            page: page._id,
            pageUrl: page.url,
            pageTitle: page.title,
            chunkIndex: c.chunkIndex,
            content: c.content,
            wordCount: c.wordCount,
          }))
        );

        // Generate an embedding for each chunk and push to ChromaDB
        const vectorChunks = [];
        for (const chunk of savedChunks) {
          // Strip inline "(https://...)" links before embedding — they're noise for
// semantic search, even though we keep them in the stored content for the
// LLM to cite. This keeps retrieval quality high while still preserving links.
const textForEmbedding = chunk.content.replace(/\s*\(https?:\/\/[^)]+\)/g, "");
const embedding = await generateEmbedding(textForEmbedding || chunk.content);
          vectorChunks.push({
            id: chunk._id.toString(),
            embedding,
            content: chunk.content,
            websiteId: website._id.toString(),
            pageUrl: chunk.pageUrl,
            pageTitle: chunk.pageTitle,
            chunkIndex: chunk.chunkIndex,
          });
        }
        await upsertChunks(vectorChunks);

        await Page.updateOne({ _id: page._id }, { $unset: { rawHtml: "" } });
      }

      website.status = "completed";
      website.pagesCrawled = pagesCrawled;
      website.chunksCreated = totalChunks;
      website.crawledAt = new Date();
      await website.save();
    } catch (err) {
      website.status = "failed";
      website.error = err.message;
      await website.save();
    }

    res.status(201).json({ website });
  } catch (err) {
    return sendError(res, 500, "Failed to start crawl. Please try again.", err, "createWebsite");
  }
}

export async function getMyWebsites(req, res) {
  const websites = await Website.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ websites });
}

export async function getWebsiteById(req, res) {
  const website = await Website.findOne({ _id: req.params.id, owner: req.user._id });
  if (!website) return res.status(404).json({ message: "Website not found" });

  const pages = await Page.find({ website: website._id }).select("url title createdAt");
  res.status(200).json({ website, pages });
}

export async function getWebsiteChunks(req, res) {
  const website = await Website.findOne({ _id: req.params.id, owner: req.user._id });
  if (!website) return res.status(404).json({ message: "Website not found" });

  const chunks = await Chunk.find({ website: website._id }).sort({ pageUrl: 1, chunkIndex: 1 });
  res.status(200).json({ website: website.rootUrl, totalChunks: chunks.length, chunks });
}

export async function testSearch(req, res) {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ message: "query is required" });
    }
    if (query.length > 500) {
      return res.status(400).json({ message: "Query is too long (max 500 characters)" });
    }

    const website = await Website.findOne({ _id: req.params.id, owner: req.user._id });
    if (!website) return res.status(404).json({ message: "Website not found" });

    const queryEmbedding = await generateEmbedding(query);
    const results = await queryChunks(queryEmbedding, website._id.toString(), 5);

    res.status(200).json({ query, results });
  } catch (err) {
    return sendError(res, 500, "Failed to start crawl. Please try again.", err, "createWebsite");
  }
}