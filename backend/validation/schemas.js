import { z } from "zod";

// Reusable primitives
const emailField = z.string().trim().min(1).max(254);
const passwordField = z.string().min(1).max(128);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: emailField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const createWebsiteSchema = z.object({
  url: z.string().trim().min(1).max(2048).url(),
  forceRecrawl: z.boolean().optional(),
});

export const testSearchSchema = z.object({
  query: z.string().trim().min(1).max(500),
});

export const askQuestionSchema = z.object({
  question: z.string().trim().min(1).max(1000),
});