"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { TextField } from "@/components/ui/text-field";
import { getToken } from "@/features/auth/auth-storage";
import { listCustomers } from "@/features/customers/customer-service";
import { listProducts } from "@/features/products/product-service";
import { listServiceItems } from "@/features/services/service-item-service";
import { createQuote, updateQuote } from "./quote-service";
import { quoteSchema } from "./schemas";
import type { Quote, QuoteFormInput, QuoteInput } from "./types";
import { currency } from "./quotes-page";

type QuoteFormProps = {
  quote?: Quote;
  onCancel?: () => void;
  onSaved?: (quote: Quote) => void;
};

const emptyItem = {
  itemType: "PRODUCT" as const,
  productId: "",
  serviceId: "",
  description: "",
  quantity: "1",
  unitPrice: "0",
  discount: "0",
};

export function QuoteForm({ onCancel, onSaved, quote }: QuoteFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<QuoteFormInput>({
    defaultValues: quote
      ? {
          customerId: quote.customerId,
          validUntil: quote.validUntil ?? "",
          discount: String(quote.discount),
          shipping: String(quote.shipping),
          notes: quote.notes ?? "",
          paymentTerms: quote.paymentTerms ?? "",
          items: quote.items.map((item) => ({
            itemType: item.itemType,
            productId: item.productId ?? "",
            serviceId: item.serviceId ?? "",
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            discount: String(item.discount),
          })),
        }
      : {
          customerId: "",
          validUntil: "",
          discount: "0",
          shipping: "0",
          notes: "",
          paymentTerms: "",
          items: [emptyItem],
        },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" }) ?? [];
  const watchedDiscount = useWatch({ control, name: "discount" }) ?? "0";
  const watchedShipping = useWatch({ control, name: "shipping" }) ?? "0";

  const customers = useQuery({
    queryKey: ["customers", "quote-options", token],
    queryFn: () => listCustomers(token ?? "", { size: 100 }),
    enabled: Boolean(token),
  });
  const products = useQuery({
    queryKey: ["products", "quote-options", token],
    queryFn: () => listProducts(token ?? "", { size: 100 }),
    enabled: Boolean(token),
  });
  const services = useQuery({
    queryKey: ["services", "quote-options", token],
    queryFn: () => listServiceItems(token ?? "", { size: 100 }),
    enabled: Boolean(token),
  });

  const preview = calculatePreview(watchedItems, watchedDiscount, watchedShipping);

  async function onSubmit(input: QuoteFormInput) {
    setFormError(null);
    const parsed = quoteSchema.safeParse(input);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path.join(".") as keyof QuoteFormInput;
        setError(field, { message: issue.message });
      });
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const payload = normalizeInput(parsed.data);
      const saved = quote
        ? await updateQuote(token, quote.id, payload)
        : await createQuote(token, payload);
      if (onSaved) {
        onSaved(saved);
      } else {
        router.push(`/quotes/${saved.id}`);
        router.refresh();
      }
    } catch {
      setFormError("Não foi possível salvar o orçamento.");
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5" htmlFor="customerId">
          <span className="text-sm font-medium text-ink">Cliente</span>
          <select
            className="h-11 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100"
            id="customerId"
            {...register("customerId")}
          >
            <option value="">Selecione</option>
            {customers.data?.items.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          {errors.customerId?.message ? (
            <span className="text-xs font-medium text-red-700">{errors.customerId.message}</span>
          ) : null}
        </label>
        <TextField label="Validade" type="date" {...register("validUntil")} />
      </div>

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Itens</h2>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
            onClick={() => append(emptyItem)}
            type="button"
          >
            <Plus size={16} aria-hidden="true" />
            Adicionar item
          </button>
        </div>

        {fields.map((field, index) => {
          const itemType = watchedItems[index]?.itemType ?? "PRODUCT";
          return (
            <div className="grid gap-3 rounded-lg border border-border bg-slate-50 p-4" key={field.id}>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-ink">Tipo</span>
                  <select
                    className="h-11 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100"
                    {...register(`items.${index}.itemType`)}
                  >
                    <option value="PRODUCT">Produto</option>
                    <option value="SERVICE">Serviço</option>
                  </select>
                </label>

                {itemType === "PRODUCT" ? (
                  <label className="grid gap-1.5 md:col-span-2">
                    <span className="text-sm font-medium text-ink">Produto</span>
                    <select
                      className="h-11 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100"
                      {...register(`items.${index}.productId`)}
                      onChange={(event) => {
                        const product = products.data?.items.find((item) => item.id === event.target.value);
                        setValue(`items.${index}.productId`, event.target.value);
                        if (product) {
                          setValue(`items.${index}.description`, product.name);
                          setValue(`items.${index}.unitPrice`, String(product.salePrice));
                        }
                      }}
                    >
                      <option value="">Selecione</option>
                      {products.data?.items.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="grid gap-1.5 md:col-span-2">
                    <span className="text-sm font-medium text-ink">Serviço</span>
                    <select
                      className="h-11 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100"
                      {...register(`items.${index}.serviceId`)}
                      onChange={(event) => {
                        const service = services.data?.items.find((item) => item.id === event.target.value);
                        setValue(`items.${index}.serviceId`, event.target.value);
                        if (service) {
                          setValue(`items.${index}.description`, service.name);
                          setValue(`items.${index}.unitPrice`, String(service.defaultPrice));
                        }
                      }}
                    >
                      <option value="">Selecione</option>
                      {services.data?.items.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <TextField label="Descrição" {...register(`items.${index}.description`)} />
                <TextField label="Quantidade" step="0.001" type="number" {...register(`items.${index}.quantity`)} />
                <TextField label="Preço unitário" step="0.01" type="number" {...register(`items.${index}.unitPrice`)} />
                <TextField label="Desconto do item" step="0.01" type="number" {...register(`items.${index}.discount`)} />
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">
                  Total do item: {currency(lineTotal(watchedItems[index]))}
                </p>
                <button
                  aria-label="Remover item"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-red-700 transition hover:bg-red-50"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  type="button"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Desconto geral" step="0.01" type="number" {...register("discount")} />
        <TextField label="Frete" step="0.01" type="number" {...register("shipping")} />
        <TextField label="Condições de pagamento" {...register("paymentTerms")} />
        <TextField label="Observações" {...register("notes")} />
      </div>

      <div className="grid gap-2 rounded-lg border border-border bg-slate-50 p-4 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><strong>{currency(preview.subtotal)}</strong></div>
        <div className="flex justify-between"><span>Desconto</span><strong>{currency(preview.discount)}</strong></div>
        <div className="flex justify-between"><span>Frete</span><strong>{currency(preview.shipping)}</strong></div>
        <div className="flex justify-between text-base text-ink"><span>Total</span><strong>{currency(preview.total)}</strong></div>
      </div>

      {formError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {formError}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel ? (
          <button
            className="inline-flex h-10 items-center rounded-md border border-border bg-panel px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
        ) : (
          <Link
            className="inline-flex h-10 items-center rounded-md border border-border bg-panel px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50"
            href="/quotes"
          >
            Cancelar
          </Link>
        )}
        <button
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Salvando..." : "Salvar orçamento"}
        </button>
      </div>
    </form>
  );
}

function normalizeInput(input: QuoteFormInput): QuoteInput {
  return {
    customerId: input.customerId,
    validUntil: input.validUntil || undefined,
    discount: Number(input.discount),
    shipping: Number(input.shipping),
    notes: input.notes?.trim() || undefined,
    paymentTerms: input.paymentTerms?.trim() || undefined,
    items: input.items.map((item) => ({
      itemType: item.itemType,
      productId: item.itemType === "PRODUCT" ? item.productId : undefined,
      serviceId: item.itemType === "SERVICE" ? item.serviceId : undefined,
      description: item.description?.trim() || undefined,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
    })),
  };
}

function calculatePreview(items: QuoteFormInput["items"], discount: string, shipping: string) {
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const discountValue = Number(discount) || 0;
  const shippingValue = Number(shipping) || 0;
  return {
    subtotal,
    discount: discountValue,
    shipping: shippingValue,
    total: Math.max(subtotal - discountValue + shippingValue, 0),
  };
}

function lineTotal(item?: QuoteFormInput["items"][number]) {
  if (!item) {
    return 0;
  }
  return Math.max((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0), 0);
}
