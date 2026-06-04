"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/ui/text-field";
import { getToken } from "@/features/auth/auth-storage";
import { createCustomer, updateCustomer } from "./customer-service";
import { customerSchema } from "./schemas";
import type { Customer, CustomerInput } from "./types";

type CustomerFormProps = {
  customer?: Customer;
  onCancel?: () => void;
  onSaved?: (customer: Customer) => void;
};

const emptyValues: CustomerInput = {
  name: "",
  type: "PERSON",
  document: "",
  email: "",
  phone: "",
  whatsapp: "",
  city: "",
  state: "",
  notes: "",
};

export function CustomerForm({ customer, onCancel, onSaved }: CustomerFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CustomerInput>({
    defaultValues: customer
      ? {
          name: customer.name,
          type: customer.type,
          document: customer.document ?? "",
          email: customer.email ?? "",
          phone: customer.phone ?? "",
          whatsapp: customer.whatsapp ?? "",
          city: customer.city ?? "",
          state: customer.state ?? "",
          notes: customer.notes ?? "",
        }
      : emptyValues,
  });

  async function onSubmit(input: CustomerInput) {
    setFormError(null);
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CustomerInput;
        setError(field, { message: issue.message });
      });
      return;
    }

    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const savedCustomer = customer
        ? await updateCustomer(token, customer.id, normalizeInput(parsed.data))
        : await createCustomer(token, normalizeInput(parsed.data));
      if (onSaved) {
        onSaved(savedCustomer);
      } else {
        router.push("/customers");
        router.refresh();
      }
    } catch {
      setFormError("Não foi possível salvar o cliente.");
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          error={errors.name?.message}
          label="Nome"
          {...register("name")}
        />
        <label className="grid gap-1.5" htmlFor="type">
          <span className="text-sm font-medium text-ink">Tipo</span>
          <select
            className="h-11 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40"
            id="type"
            {...register("type")}
          >
            <option value="PERSON">Pessoa física</option>
            <option value="COMPANY">Empresa</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="CPF/CNPJ" {...register("document")} />
        <TextField
          error={errors.email?.message}
          label="E-mail"
          type="email"
          {...register("email")}
        />
        <TextField label="Telefone" {...register("phone")} />
        <TextField label="WhatsApp" {...register("whatsapp")} />
        <TextField label="Cidade" {...register("city")} />
        <TextField
          error={errors.state?.message}
          label="UF"
          maxLength={2}
          {...register("state")}
        />
      </div>

      <label className="grid gap-1.5" htmlFor="notes">
        <span className="text-sm font-medium text-ink">Observações</span>
        <textarea
          className="min-h-28 rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 dark:placeholder:text-slate-500"
          id="notes"
          {...register("notes")}
        />
      </label>

      {formError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {formError}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel ? (
          <button
            className="inline-flex h-10 items-center rounded-md border border-border bg-panel px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
        ) : (
          <Link
            className="inline-flex h-10 items-center rounded-md border border-border bg-panel px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50 dark:hover:bg-slate-800"
            href="/customers"
          >
            Cancelar
          </Link>
        )}
        <button
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-400/90"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Salvando..." : "Salvar cliente"}
        </button>
      </div>
    </form>
  );
}

function normalizeInput(input: CustomerInput): CustomerInput {
  return {
    ...input,
    state: input.state?.toUpperCase(),
  };
}
