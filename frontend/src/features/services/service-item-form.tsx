"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/ui/text-field";
import { getToken } from "@/features/auth/auth-storage";
import { appToast, getApiErrorMessage } from "@/lib/toast";
import { createServiceItem, updateServiceItem } from "./service-item-service";
import { serviceItemSchema } from "./schemas";
import type { ServiceItem, ServiceItemFormInput, ServiceItemInput } from "./types";

type ServiceItemFormProps = {
  serviceItem?: ServiceItem;
  onCancel?: () => void;
  onSaved?: (serviceItem: ServiceItem) => void;
};

const emptyValues: ServiceItemFormInput = {
  name: "",
  description: "",
  defaultPrice: "0",
  estimatedCost: "0",
};

export function ServiceItemForm({ onCancel, onSaved, serviceItem }: ServiceItemFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ServiceItemFormInput>({
    defaultValues: serviceItem
      ? {
          name: serviceItem.name,
          description: serviceItem.description ?? "",
          defaultPrice: String(serviceItem.defaultPrice),
          estimatedCost: String(serviceItem.estimatedCost),
        }
      : emptyValues,
  });

  async function onSubmit(input: ServiceItemFormInput) {
    setFormError(null);
    const parsed = serviceItemSchema.safeParse(input);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ServiceItemFormInput;
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
      const payload = normalizeInput(parsed.data);
      const savedServiceItem = serviceItem
        ? await updateServiceItem(token, serviceItem.id, payload)
        : await createServiceItem(token, payload);
      appToast.success(serviceItem ? "Serviço atualizado com sucesso." : "Serviço criado com sucesso.");
      if (onSaved) {
        onSaved(savedServiceItem);
      } else {
        router.push("/services");
        router.refresh();
      }
    } catch (error) {
      const message = getApiErrorMessage(error, "Não foi possível salvar o serviço.");
      setFormError(message);
      appToast.error(message);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <TextField error={errors.name?.message} label="Nome" {...register("name")} />

      <label className="grid gap-1.5" htmlFor="description">
        <span className="text-sm font-medium text-ink">Descrição</span>
        <textarea
          className="min-h-28 rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 dark:placeholder:text-slate-500"
          id="description"
          {...register("description")}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          error={errors.defaultPrice?.message}
          label="Preço padrão"
          step="0.01"
          type="number"
          {...register("defaultPrice")}
        />
        <TextField
          error={errors.estimatedCost?.message}
          label="Custo estimado"
          step="0.01"
          type="number"
          {...register("estimatedCost")}
        />
      </div>

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
            href="/services"
          >
            Cancelar
          </Link>
        )}
        <button
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-400/90"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Salvando..." : "Salvar serviço"}
        </button>
      </div>
    </form>
  );
}

function normalizeInput(input: ServiceItemFormInput): ServiceItemInput {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    defaultPrice: Number(input.defaultPrice),
    estimatedCost: Number(input.estimatedCost),
  };
}
