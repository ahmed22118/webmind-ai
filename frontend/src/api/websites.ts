import api from "./axios";

export interface Website {
  _id: string;
  rootUrl: string;
  domain: string;
  status: "pending" | "crawling" | "completed" | "failed";
  pagesCrawled: number;
  chunksCreated?: number;
  error: string | null;
  createdAt: string;
}

export interface Source {
  url: string;
  title: string;
}

export interface Conversation {
  _id: string;
  question: string;
  answer: string;
  sources: Source[];
  createdAt: string;
}

export interface Page {
  _id: string;
  url: string;
  title: string;
  createdAt: string;
}

export async function createWebsite(url: string): Promise<Website> {
  const res = await api.post("/websites", { url });
  return res.data.website;
}

export async function getMyWebsites(): Promise<Website[]> {
  const res = await api.get("/websites");
  return res.data.websites;
}

export async function getWebsiteById(id: string): Promise<{ website: Website; pages: Page[] }> {
  const res = await api.get(`/websites/${id}`);
  return res.data;
}

export async function askQuestion(
  websiteId: string,
  question: string
): Promise<{ question: string; answer: string; sources: Source[] }> {
  const res = await api.post(`/websites/${websiteId}/ask`, { question });
  return res.data;
}

export async function getConversationHistory(websiteId: string): Promise<Conversation[]> {
  const res = await api.get(`/websites/${websiteId}/conversations`);
  return res.data.conversations;
}

export async function clearConversationHistory(websiteId: string): Promise<void> {
  await api.delete(`/websites/${websiteId}/conversations`);
}