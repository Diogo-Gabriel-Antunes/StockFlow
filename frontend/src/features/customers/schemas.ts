import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(160),
  type: z.enum(["PERSON", "COMPANY"]),
  document: z.string().trim().max(32).optional(),
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .max(160)
    .or(z.literal(""))
    .optional(),
  phone: z.string().trim().max(32).optional(),
  whatsapp: z.string().trim().max(32).optional(),
  city: z.string().trim().max(120).optional(),
  state: z
    .string()
    .trim()
    .length(2, "UF deve ter 2 letras.")
    .or(z.literal(""))
    .optional(),
  notes: z.string().trim().max(1000).optional(),
});
