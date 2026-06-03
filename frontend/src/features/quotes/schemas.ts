import { z } from "zod";

const moneyString = z.string().refine((value) => Number(value) >= 0, {
  message: "Informe um valor maior ou igual a zero.",
});

export const quoteItemSchema = z
  .object({
    itemType: z.enum(["PRODUCT", "SERVICE"]),
    productId: z.string().optional(),
    serviceId: z.string().optional(),
    description: z.string().max(500).optional(),
    quantity: z.string().refine((value) => Number(value) > 0, {
      message: "Informe uma quantidade maior que zero.",
    }),
    unitPrice: moneyString,
    discount: moneyString,
  })
  .superRefine((item, context) => {
    if (item.itemType === "PRODUCT" && !item.productId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione um produto.",
        path: ["productId"],
      });
    }
    if (item.itemType === "SERVICE" && !item.serviceId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione um serviço.",
        path: ["serviceId"],
      });
    }
  });

export const quoteSchema = z.object({
  customerId: z.string().min(1, "Cliente é obrigatório."),
  validUntil: z.string().optional(),
  discount: moneyString,
  shipping: moneyString,
  notes: z.string().max(1000).optional(),
  paymentTerms: z.string().max(500).optional(),
  items: z.array(quoteItemSchema).min(1, "Adicione pelo menos um item."),
});
