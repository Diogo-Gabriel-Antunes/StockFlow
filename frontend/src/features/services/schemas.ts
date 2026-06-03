import { z } from "zod";

const nonNegativeNumberString = z
  .string()
  .trim()
  .min(1, "Campo obrigatório.")
  .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
    message: "Informe um valor maior ou igual a zero.",
  });

export const serviceItemSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(160),
  description: z.string().trim().max(1000).optional(),
  defaultPrice: nonNegativeNumberString,
  estimatedCost: nonNegativeNumberString,
});
