"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { TextField } from "@/components/ui/text-field";
import { getToken } from "@/features/auth/auth-storage";
import { appToast, getApiErrorMessage } from "@/lib/toast";
import { createProduct, updateProduct } from "./product-service";
import { productSchema } from "./schemas";
import type { Product, ProductFormInput, ProductInput } from "./types";

type ProductFormProps = {
  product?: Product;
  onCancel?: () => void;
  onSaved?: (product: Product) => void;
};

const emptyValues: ProductFormInput = {
  name: "",
  sku: "",
  category: "",
  description: "",
  barcode: "",
  referenceCode: "",
  imageUrl: "",
  costPrice: "0",
  salePrice: "0",
  unit: "UN",
  stockQuantity: "0",
  minimumStock: "0",
  active: true,
};

export function ProductForm({ onCancel, onSaved, product }: ProductFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    control,
  } = useForm<ProductFormInput>({
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku ?? "",
          category: product.category ?? "",
          description: product.description ?? "",
          barcode: product.barcode ?? "",
          referenceCode: product.referenceCode ?? "",
          imageUrl: product.imageUrl ?? "",
          costPrice: String(product.costPrice),
          salePrice: String(product.salePrice),
          unit: product.unit,
          stockQuantity: String(product.stockQuantity),
          minimumStock: String(product.minimumStock),
          active: product.active,
        }
      : emptyValues,
  });
  const imageUrl = useWatch({ control, name: "imageUrl" });
  const [imageFailed, setImageFailed] = useState(false);

  async function onSubmit(input: ProductFormInput) {
    setFormError(null);
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ProductFormInput;
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
      const savedProduct = product
        ? await updateProduct(token, product.id, payload)
        : await createProduct(token, payload);
      appToast.success(product ? "Produto atualizado com sucesso." : "Produto criado com sucesso.");
      if (onSaved) {
        onSaved(savedProduct);
      } else {
        router.push("/products");
        router.refresh();
      }
    } catch (error) {
      const message = getApiErrorMessage(error, "Não foi possível salvar o produto.");
      setFormError(message);
      appToast.error(message);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField error={errors.name?.message} label="Nome" {...register("name")} />
        <TextField label="SKU" {...register("sku")} />
        <TextField label="Categoria" {...register("category")} />
        <TextField label="Código de barras" {...register("barcode")} />
        <TextField label="Código de referência" {...register("referenceCode")} />
        <TextField error={errors.unit?.message} label="Unidade" {...register("unit")} />
      </div>

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-ink">Descrição</span>
        <textarea
          className="min-h-24 rounded-md border border-border bg-slate-950/40 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
          {...register("description")}
        />
        {errors.description?.message ? (
          <span className="text-xs font-medium text-red-300">{errors.description.message}</span>
        ) : null}
      </label>

      <div className="grid gap-4 lg:grid-cols-[1fr_12rem]">
        <TextField
          error={errors.imageUrl?.message}
          label="URL da imagem"
          placeholder="https://exemplo.com/imagem-produto.jpg"
          {...register("imageUrl", { onChange: () => setImageFailed(false) })}
        />
        <div className="grid gap-1.5">
          <span className="text-sm font-medium text-ink">Preview</span>
          <div className="flex h-28 items-center justify-center overflow-hidden rounded-md border border-border bg-slate-950/40 text-xs text-muted">
            {imageUrl && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Preview do produto"
                className="h-full w-full object-cover"
                onError={() => setImageFailed(true)}
                src={imageUrl}
              />
            ) : (
              <span>Sem imagem</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          error={errors.costPrice?.message}
          label="Preço de custo"
          step="0.01"
          type="number"
          {...register("costPrice")}
        />
        <TextField
          error={errors.salePrice?.message}
          label="Preço de venda"
          step="0.01"
          type="number"
          {...register("salePrice")}
        />
        <TextField
          error={errors.stockQuantity?.message}
          label="Estoque atual"
          step="0.001"
          type="number"
          {...register("stockQuantity")}
        />
        <TextField
          error={errors.minimumStock?.message}
          label="Estoque mínimo"
          step="0.001"
          type="number"
          {...register("minimumStock")}
        />
      </div>

      <label className="flex items-center gap-2 rounded-md border border-border bg-slate-950/30 px-3 py-2 text-sm font-medium text-ink">
        <input className="h-4 w-4 accent-primary" type="checkbox" {...register("active")} />
        Produto ativo
      </label>

      {formError ? (
        <div className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm font-medium text-red-300 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {formError}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel ? (
          <button
            className="inline-flex h-10 items-center rounded-md border border-border bg-panel px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-900 dark:hover:bg-slate-800"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
        ) : (
          <Link
            className="inline-flex h-10 items-center rounded-md border border-border bg-panel px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-900 dark:hover:bg-slate-800"
            href="/products"
          >
            Cancelar
          </Link>
        )}
        <button
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-400/90"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Salvando..." : "Salvar produto"}
        </button>
      </div>
    </form>
  );
}

function normalizeInput(input: ProductFormInput): ProductInput {
  return {
    name: input.name.trim(),
    sku: input.sku?.trim() || undefined,
    category: input.category?.trim() || undefined,
    description: input.description?.trim() || undefined,
    barcode: input.barcode?.trim() || undefined,
    referenceCode: input.referenceCode?.trim() || undefined,
    imageUrl: input.imageUrl?.trim() || undefined,
    costPrice: Number(input.costPrice),
    salePrice: Number(input.salePrice),
    unit: input.unit.trim(),
    stockQuantity: Number(input.stockQuantity),
    minimumStock: Number(input.minimumStock),
    active: input.active ?? true,
  };
}
