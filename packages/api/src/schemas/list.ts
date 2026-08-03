import { z } from "zod";

// ─── list.create ─────────────────────────────────────────────
export const listCreateResponseSchema = z.object({
  publicId: z.string(),
  name: z.string(),
  color: z.string().nullable().optional(),
});

// ─── list.update / list.reorder ──────────────────────────────
export const listUpdateResponseSchema = z.object({
  publicId: z.string(),
  name: z.string().optional(),
  color: z.string().nullable().optional(),
});
