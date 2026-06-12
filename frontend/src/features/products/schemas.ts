import { z } from "zod";

const nonNegativeNumberString = z
  .string()
  .trim()
  .min(1, "Campo obrigatório.")
  .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
    message: "Informe um valor maior ou igual a zero.",
  });

export const productSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(160),
  sku: z.string().trim().max(80).optional(),
  category: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  barcode: z.string().trim().max(80).optional(),
  referenceCode: z.string().trim().max(120).optional(),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
      message: "Informe uma URL iniciando com http:// ou https://.",
    }),
  costPrice: nonNegativeNumberString,
  salePrice: nonNegativeNumberString,
  unit: z.string().trim().min(1, "Unidade é obrigatória.").max(20),
  stockQuantity: nonNegativeNumberString,
  minimumStock: nonNegativeNumberString,
  active: z.boolean().optional(),
});
