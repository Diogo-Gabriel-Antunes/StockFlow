import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const registerSchema = z.object({
  companyName: z.string().min(1, "Informe o nome da empresa.").max(160),
  companyDocument: z.string().max(32).optional(),
  companyEmail: z.string().email("Informe um e-mail válido.").optional().or(z.literal("")),
  companyPhone: z.string().max(32).optional(),
  ownerName: z.string().min(1, "Informe seu nome.").max(160),
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(8, "Use pelo menos 8 caracteres.").max(120),
});
