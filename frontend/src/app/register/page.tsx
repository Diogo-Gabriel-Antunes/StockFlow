"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { TextField } from "@/components/ui/text-field";
import { register as registerAccount } from "@/features/auth/auth-service";
import { storeToken } from "@/features/auth/auth-storage";
import { registerSchema } from "@/features/auth/schemas";
import type { RegisterInput } from "@/features/auth/types";
import { appToast, getApiErrorMessage } from "@/lib/toast";

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterInput>({
    defaultValues: {
      companyName: "",
      companyDocument: "",
      companyEmail: "",
      companyPhone: "",
      ownerName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(input: RegisterInput) {
    setFormError(null);
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterInput;
        setError(field, { message: issue.message });
      });
      return;
    }

    try {
      const response = await registerAccount(parsed.data);
      storeToken(response.token);
      appToast.success("Conta criada com sucesso.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message = getApiErrorMessage(error, "Não foi possível criar a conta com esses dados.");
      setFormError(message);
      appToast.error(message);
    }
  }

  return (
    <AuthShell title="Cadastrar empresa" subtitle="Crie o primeiro usuário OWNER.">
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            error={errors.companyName?.message}
            label="Empresa"
            {...register("companyName")}
          />
          <TextField
            error={errors.companyDocument?.message}
            label="CPF/CNPJ"
            {...register("companyDocument")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            error={errors.companyEmail?.message}
            label="E-mail da empresa"
            type="email"
            {...register("companyEmail")}
          />
          <TextField
            error={errors.companyPhone?.message}
            label="Telefone"
            {...register("companyPhone")}
          />
        </div>
        <TextField
          autoComplete="name"
          error={errors.ownerName?.message}
          label="Seu nome"
          {...register("ownerName")}
        />
        <TextField
          autoComplete="email"
          error={errors.email?.message}
          label="E-mail de acesso"
          type="email"
          {...register("email")}
        />
        <TextField
          autoComplete="new-password"
          error={errors.password?.message}
          label="Senha"
          type="password"
          {...register("password")}
        />
        {formError ? (
          <div className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm font-medium text-red-300">
            {formError}
          </div>
        ) : null}
        <button
          className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Criando..." : "Criar conta"}
        </button>
        <p className="text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link className="font-semibold text-primary" href="/login">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
