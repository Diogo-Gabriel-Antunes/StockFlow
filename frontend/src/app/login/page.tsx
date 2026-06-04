"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AuthShell } from "@/components/layout/auth-shell";
import { TextField } from "@/components/ui/text-field";
import { login } from "@/features/auth/auth-service";
import { storeToken } from "@/features/auth/auth-storage";
import { loginSchema } from "@/features/auth/schemas";
import type { LoginInput } from "@/features/auth/types";

export default function LoginPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : window.sessionStorage.getItem("stockflow_session_message"),
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (window.sessionStorage.getItem("stockflow_session_message")) {
      window.sessionStorage.removeItem("stockflow_session_message");
    }
  }, []);

  async function onSubmit(input: LoginInput) {
    setFormError(null);
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginInput;
        setError(field, { message: issue.message });
      });
      return;
    }

    try {
      const response = await login(parsed.data);
      storeToken(response.token);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("E-mail ou senha inválidos.");
    }
  }

  return (
    <AuthShell title="Entrar" subtitle="Acesse o painel da sua empresa.">
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          autoComplete="email"
          error={errors.email?.message}
          label="E-mail"
          type="email"
          {...register("email")}
        />
        <TextField
          autoComplete="current-password"
          error={errors.password?.message}
          label="Senha"
          type="password"
          {...register("password")}
        />
        {formError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
            {formError}
          </div>
        ) : null}
        <button
          className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
        <p className="text-center text-sm text-muted">
          Ainda não tem conta?{" "}
          <Link className="font-semibold text-primary" href="/register">
            Cadastrar empresa
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
