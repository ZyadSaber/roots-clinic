import { z } from "zod";

export const specialtySchema = z.object({
  english_name: z.string().trim().min(1, "English name is required"),
  arabic_name: z.string().trim().min(1, "Arabic name is required"),
  globalError: z.string().nullable().optional(),
  editingId: z.string().nullable().optional(),
  id: z.string().nullable().optional(),
  isNew: z.boolean(),
});
