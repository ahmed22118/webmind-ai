import Website from "../models/Website.js";
import Conversation from "../models/Conversation.js";
import { generateEmbedding } from "../services/embeddingService.js";
import { queryChunks } from "../services/vectorStore.js";
import { buildRagPrompt, generateAnswer } from "../services/llmService.js";
import { sendError } from "../utils/errorResponse.js";

export async function askQuestion(req, res) {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ message: "question is required" });
    }
    if (question.length > 1000) {
      return res.status(400).json({ message: "Question is too long (max 1000 characters)" });
    }

    const website = await Website.findOne({ _id: req.params.id, owner: req.user._id });
    if (!website) return res.status(404).json({ message: "Website not found" });

    if (website.status !== "completed") {
      return res.status(400).json({ message: `Website is not ready yet (status: ${website.status})` });
    }

    const questionEmbedding = await generateEmbedding(question);
    const topChunks = await queryChunks(questionEmbedding, website._id.toString(), 20);

    if (topChunks.length === 0) {
      const fallbackAnswer = "I couldn't find any relevant content on this website to answer that question.";
      const conversation = await Conversation.create({
        website: website._id,
        user: req.user._id,
        question,
        answer: fallbackAnswer,
        sources: [],
      });
      return res.status(200).json({
        question,
        answer: fallbackAnswer,
        sources: [],
        conversationId: conversation._id,
      });
    }

    const messages = buildRagPrompt(question, topChunks);
    const answer = await generateAnswer(messages);

    const sourceMap = new Map();
    topChunks.forEach((c) => {
      if (!sourceMap.has(c.pageUrl)) {
        sourceMap.set(c.pageUrl, { url: c.pageUrl, title: c.pageTitle });
      }
    });
    const sources = Array.from(sourceMap.values());

    const conversation = await Conversation.create({
      website: website._id,
      user: req.user._id,
      question,
      answer,
      sources,
    });

    res.status(200).json({
      question,
      answer,
      sources,
      conversationId: conversation._id,
    });
 } catch (err) {
    return sendError(res, 500, "Failed to generate an answer. Please try again shortly.", err, "askQuestion");
  }
}

export async function getConversationHistory(req, res) {
  try {
    const website = await Website.findOne({ _id: req.params.id, owner: req.user._id });
    if (!website) return res.status(404).json({ message: "Website not found" });

    const conversations = await Conversation.find({
      website: website._id,
      user: req.user._id,
    }).sort({ createdAt: 1 });

    res.status(200).json({ conversations });
  } catch (err) {
    return sendError(res, 500, "Failed to fetch conversation history.", err, "getConversationHistory");
  }
}

export async function clearConversationHistory(req, res) {
  try {
    const website = await Website.findOne({ _id: req.params.id, owner: req.user._id });
    if (!website) return res.status(404).json({ message: "Website not found" });

    await Conversation.deleteMany({ website: website._id, user: req.user._id });
    res.status(200).json({ message: "Conversation history cleared" });
  } catch (err) {
    return sendError(res, 500, "Failed to clear conversation history.", err, "clearConversationHistory");
  }
}