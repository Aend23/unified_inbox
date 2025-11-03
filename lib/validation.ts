// src/lib/validation.ts
import { z } from "zod";

export const sendMessageSchema = z.object({
  to: z.string().min(4),
  body: z.string().min(1),
  channel: z.enum(["sms", "whatsapp", "email"]).optional(),
  mediaUrl: z.string().url().optional(),
});

export const contactCreateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(4).optional(),
  email: z.string().email().optional(),
});

export const noteCreateSchema = z.object({
  contactId: z.string().cuid(),
  body: z.string().min(1),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
});

export const scheduleMessageSchema = z.object({
  contactId: z.string().cuid(),
  body: z.string().min(1),
  channel: z.enum(["SMS", "WHATSAPP", "EMAIL"]),
  scheduledAt: z.string().datetime(),
});
