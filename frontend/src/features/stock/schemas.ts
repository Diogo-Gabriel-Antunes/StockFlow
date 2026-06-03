import { z } from "zod";

const nonNegativeNumberString = z
  .string()
  .trim()
  .min(1, "Campo obrigatório.")
  .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
    message: "Informe um valor maior ou igual a zero.",
  });

const positiveNumberString = z
  .string()
  .trim()
  .min(1, "Campo obrigatório.")
  .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
    message: "Informe um valor maior que zero.",
  });

export const stockActionSchema = z
  .object({
    action: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    productId: z.string().trim().min(1, "Produto é obrigatório."),
    quantity: positiveNumberString,
    newQuantity: nonNegativeNumberString,
    reason: z.string().trim().max(500).optional(),
  })
  .superRefine((value, context) => {
    if (value.action === "ADJUSTMENT") {
      return;
    }
    if (!value.quantity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quantidade é obrigatória.",
        path: ["quantity"],
      });
    }
  });

export type StockActionFormInput = z.input<typeof stockActionSchema>;
