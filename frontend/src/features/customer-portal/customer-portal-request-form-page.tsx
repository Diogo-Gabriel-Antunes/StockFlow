"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ClipboardList, FileText, PackageSearch, Plus, Send, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { appToast, getApiErrorMessage } from "@/lib/toast";
import {
  createPortalQuoteRequest,
  getPortalProduct,
  getPortalQuoteRequest,
  searchPortalProducts,
  updatePortalQuoteRequest,
} from "./customer-portal-service";
import { ProductImage } from "./customer-portal-products-page";
import { PublicShell, quoteRequestStatusLabel } from "./customer-portal-page";
import type { PortalProduct, QuoteRequestInput } from "./types";

type ItemForm = {
  product: PortalProduct | null;
  productId: string;
  productQuery: string;
  description: string;
  quantity: string;
  manual: boolean;
};

type FormState = {
  title: string;
  description: string;
  items: ItemForm[];
};

type RequestSummary = {
  catalogItems: number;
  itemCount: number;
  manualItems: number;
  totalUnits: number;
};

const emptyItem: ItemForm = {
  product: null,
  productId: "",
  productQuery: "",
  description: "",
  quantity: "1",
  manual: false,
};

const emptyForm: FormState = {
  title: "",
  description: "",
  items: [emptyItem],
};

const formId = "customer-quote-request-form";

export function CustomerPortalRequestFormPage({
  initialProductId,
  requestId,
  token,
}: {
  initialProductId?: string;
  requestId?: string;
  token: string;
}) {
  const router = useRouter();
  const productIdFromCatalog = requestId ? undefined : initialProductId;
  const existing = useQuery({
    queryKey: ["customer-portal-request", token, requestId],
    queryFn: () => getPortalQuoteRequest(token, requestId ?? ""),
    enabled: Boolean(token && requestId),
    retry: false,
  });
  const initialProduct = useQuery({
    queryKey: ["customer-portal-product", token, productIdFromCatalog],
    queryFn: () => getPortalProduct(token, productIdFromCatalog ?? ""),
    enabled: Boolean(token && productIdFromCatalog),
    retry: false,
  });
  const [draft, setDraft] = useState<FormState | null>(null);
  const form = draft ?? (existing.data ? toForm(existing.data) : toInitialForm(initialProduct.data));
  const readonly = Boolean(existing.data && !existing.data.canEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const summary = useMemo(() => requestSummary(form), [form]);

  const save = useMutation({
    mutationFn: (input: QuoteRequestInput) =>
      requestId ? updatePortalQuoteRequest(token, requestId, input) : createPortalQuoteRequest(token, input),
    onSuccess: () => {
      appToast.success(requestId ? "Solicitação atualizada com sucesso." : "Solicitação enviada com sucesso.");
      router.push(`/customer-portal/${token}`);
    },
    onError: (error) =>
      appToast.error(getApiErrorMessage(error, "Não foi possível salvar a solicitação.")),
  });

  if (existing.isLoading || initialProduct.isLoading) {
    return <PublicShell><p className="text-sm text-muted">Carregando solicitação...</p></PublicShell>;
  }

  if (existing.isError || initialProduct.isError) {
    return (
      <PublicShell>
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-6 text-red-300">
          <h1 className="text-lg font-semibold">Não foi possível carregar a tela de solicitação.</h1>
          <p className="mt-2 text-sm">Link inválido ou expirado.</p>
        </div>
      </PublicShell>
    );
  }

  function update(next: FormState) {
    setDraft(next);
  }

  function updateItem(index: number, nextItem: ItemForm) {
    update({
      ...form,
      items: form.items.map((item, currentIndex) => (currentIndex === index ? nextItem : item)),
    });
  }

  function addItem() {
    update({ ...form, items: [...form.items, { ...emptyItem }] });
  }

  function removeItem(index: number) {
    update({ ...form, items: form.items.filter((_, currentIndex) => currentIndex !== index) });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate(form);
    setErrors(validation.errors);
    if (!validation.valid) {
      appToast.error("Revise os campos obrigatórios antes de enviar.");
      return;
    }
    save.mutate(toPayload(form));
  }

  return (
    <PublicShell>
      <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Solicitação de orçamento</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">
            {requestId ? "Editar solicitação" : "Nova solicitação"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Conte para a empresa quais produtos ou serviços você precisa.
          </p>
          {existing.data ? (
            <p className="mt-2 text-sm text-muted">{quoteRequestStatusLabel(existing.data.status)}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          <ButtonLink className="w-full sm:w-auto" href={`/customer-portal/${token}/products`} variant="secondary">
            Catálogo
          </ButtonLink>
          <ButtonLink className="w-full sm:w-auto" href={`/customer-portal/${token}`} variant="secondary">
            Voltar ao portal
          </ButtonLink>
        </div>
      </header>

      {readonly ? (
        <div className="rounded-lg border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm font-medium text-amber-300">
          Esta solicitação não pode mais ser editada.
        </div>
      ) : null}

      <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" id={formId} noValidate onSubmit={submit}>
        <div className="grid gap-6">
          <section className="rounded-xl border border-border bg-panel p-5 shadow-subtle">
            <SectionHeader
              description="Informe um título e uma observação geral para ajudar a empresa a entender seu pedido."
              icon={<FileText size={18} aria-hidden="true" />}
              title="Dados da solicitação"
            />
            <div className="mt-5 grid gap-4">
              <TextField
                disabled={readonly}
                error={errors.title}
                id="quote-request-title"
                label="Título da solicitação"
                onChange={(event) => update({ ...form, title: event.target.value })}
                placeholder="Ex: Pedido de reposição para loja"
                value={form.title}
              />
              <LabeledTextarea
                disabled={readonly}
                id="quote-request-description"
                label="Observação geral"
                minHeight="min-h-[120px]"
                onChange={(event) => update({ ...form, description: event.target.value })}
                placeholder="Descreva detalhes importantes, prazos, preferências ou qualquer observação sobre esta solicitação."
                value={form.description}
              />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-panel p-5 shadow-subtle">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeader
                description="Adicione produtos do catálogo ou descreva manualmente o que você precisa."
                icon={<ClipboardList size={18} aria-hidden="true" />}
                title="Itens solicitados"
              />
              {!readonly ? (
                <Button className="w-full sm:w-auto" onClick={addItem} size="sm" type="button" variant="secondary">
                  <Plus size={15} aria-hidden="true" />
                  Adicionar item
                </Button>
              ) : null}
            </div>
            {errors.items ? <p className="mt-4 text-sm font-medium text-red-300">{errors.items}</p> : null}
            <div className="mt-5 grid gap-4">
              {form.items.map((item, index) => (
                <QuoteRequestItemEditor
                  disabled={readonly}
                  errors={errors}
                  index={index}
                  item={item}
                  key={index}
                  onChange={(nextItem) => updateItem(index, nextItem)}
                  onRemove={() => removeItem(index)}
                  removable={form.items.length > 1}
                  token={token}
                />
              ))}
            </div>
          </section>
        </div>

        <RequestSummaryCard
          readonly={readonly}
          saving={save.isPending}
          summary={summary}
          token={token}
        />
      </form>
    </PublicShell>
  );
}

function SectionHeader({
  description,
  icon,
  title,
}: {
  description: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-slate-950/40 text-primary">
        {icon}
      </div>
      <div>
        <h2 className="font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
    </div>
  );
}

function RequestSummaryCard({
  readonly,
  saving,
  summary,
  token,
}: {
  readonly: boolean;
  saving: boolean;
  summary: RequestSummary;
  token: string;
}) {
  return (
    <aside className="h-fit rounded-xl border border-border bg-panel p-5 shadow-subtle lg:sticky lg:top-6">
      <h2 className="font-semibold text-ink">Resumo</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Após enviar, a empresa analisará sua solicitação e poderá gerar uma proposta oficial.
      </p>
      <dl className="mt-5 grid gap-3">
        <SummaryRow label="Itens" value={summary.itemCount} />
        <SummaryRow label="Unidades" value={formatUnits(summary.totalUnits)} />
        <SummaryRow label="Produtos do catálogo" value={summary.catalogItems} />
        <SummaryRow label="Itens manuais" value={summary.manualItems} />
      </dl>
      {!readonly ? (
        <div className="mt-6 grid gap-3">
          <Button className="w-full" disabled={saving} form={formId} type="submit">
            <Send size={16} aria-hidden="true" />
            {saving ? "Salvando..." : "Salvar solicitação"}
          </Button>
          <ButtonLink className="w-full" href={`/customer-portal/${token}`} variant="secondary">
            Voltar ao portal
          </ButtonLink>
        </div>
      ) : null}
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-slate-950/35 px-3 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

function QuoteRequestItemEditor({
  disabled,
  errors,
  index,
  item,
  onChange,
  onRemove,
  removable,
  token,
}: {
  disabled: boolean;
  errors: Record<string, string>;
  index: number;
  item: ItemForm;
  onChange: (item: ItemForm) => void;
  onRemove: () => void;
  removable: boolean;
  token: string;
}) {
  const [debouncedQuery, setDebouncedQuery] = useState(item.productQuery);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(item.productQuery.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [item.productQuery]);

  const products = useQuery({
    queryKey: ["customer-portal-product-search", token, debouncedQuery],
    queryFn: () => searchPortalProducts(token, debouncedQuery),
    enabled: !disabled && !item.manual && !item.product && debouncedQuery.length >= 3,
  });

  function selectProduct(product: PortalProduct) {
    onChange({
      ...item,
      product,
      productId: product.id,
      productQuery: product.name,
      description: "",
      manual: false,
    });
  }

  function clearProduct() {
    onChange({ ...item, product: null, productId: "", productQuery: "", manual: false });
  }

  function toggleManual() {
    onChange({
      ...item,
      manual: !item.manual,
      product: null,
      productId: "",
      productQuery: "",
      description: "",
    });
  }

  return (
    <article className="rounded-xl border border-border bg-slate-950/35 p-4">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Item {index + 1}</p>
          <p className="mt-1 text-xs text-muted">
            {item.manual ? "Descreva o item manualmente." : "Busque um produto cadastrado ou alterne para item manual."}
          </p>
        </div>
        {!disabled ? (
          <Button
            className="w-full sm:w-auto"
            disabled={!removable}
            onClick={onRemove}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Trash2 size={15} aria-hidden="true" />
            Remover item
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4">
        {item.manual ? (
          <LabeledTextarea
            disabled={disabled}
            error={errors[`items.${index}.description`]}
            id={`quote-request-item-${index}-description`}
            label="Descrição do item"
            minHeight="min-h-[96px]"
            onChange={(event) => onChange({ ...item, description: event.target.value })}
            placeholder="Ex: Produto personalizado, modelo especial, variação não encontrada..."
            value={item.description}
          />
        ) : (
          <ProductAutocomplete
            disabled={disabled}
            error={errors[`items.${index}.product`]}
            index={index}
            item={item}
            onChange={onChange}
            onClear={clearProduct}
            onSelect={selectProduct}
            products={products.data ?? []}
            query={debouncedQuery}
            searchError={products.isError}
            searching={products.isLoading}
          />
        )}

        {!disabled ? (
          <button
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:text-cyan-300"
            onClick={toggleManual}
            type="button"
          >
            <PackageSearch size={15} aria-hidden="true" />
            {item.manual ? "Selecionar produto do catálogo" : "Não encontrei o produto? Descrever manualmente"}
          </button>
        ) : null}

        <div className="grid gap-4 sm:max-w-40">
          <TextField
            disabled={disabled}
            error={errors[`items.${index}.quantity`]}
            id={`quote-request-item-${index}-quantity`}
            label="Quantidade"
            min={1}
            onChange={(event) => onChange({ ...item, quantity: event.target.value })}
            type="number"
            value={item.quantity}
          />
        </div>
      </div>
    </article>
  );
}

function ProductAutocomplete({
  disabled,
  error,
  index,
  item,
  onChange,
  onClear,
  onSelect,
  products,
  query,
  searchError,
  searching,
}: {
  disabled: boolean;
  error?: string;
  index: number;
  item: ItemForm;
  onChange: (item: ItemForm) => void;
  onClear: () => void;
  onSelect: (product: PortalProduct) => void;
  products: PortalProduct[];
  query: string;
  searchError: boolean;
  searching: boolean;
}) {
  return (
    <div className="relative grid gap-1.5">
      <label className="text-sm font-medium text-ink" htmlFor={`quote-request-product-search-${index}`}>
        Produto cadastrado
      </label>
      {item.product ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-slate-950/60 p-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border">
            <ProductImage imageUrl={item.product.imageUrl} name={item.product.name} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{item.product.name}</p>
            <p className="truncate text-xs text-muted">{productMeta(item.product)}</p>
          </div>
          {!disabled ? (
            <button
              aria-label="Limpar produto selecionado"
              className="rounded-md p-2 text-muted hover:bg-slate-800 hover:text-ink"
              onClick={onClear}
              type="button"
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <input
            className="h-11 rounded-md border border-border bg-slate-950/60 px-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
            disabled={disabled}
            id={`quote-request-product-search-${index}`}
            onChange={(event) => onChange({ ...item, productQuery: event.target.value })}
            placeholder="Digite pelo menos 3 letras para buscar um produto..."
            value={item.productQuery}
          />
          {query.length < 3 ? (
            <p className="text-xs text-muted">Digite pelo menos 3 letras...</p>
          ) : null}
          {error ? <p className="text-xs font-medium text-red-300">{error}</p> : null}
          {query.length >= 3 ? (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-md border border-border bg-panel shadow-2xl">
              {searching ? <p className="p-3 text-sm text-muted">Buscando produtos...</p> : null}
              {searchError ? <p className="p-3 text-sm text-red-300">Não foi possível buscar produtos.</p> : null}
              {!searching && !searchError && products.length === 0 ? (
                <p className="p-3 text-sm text-muted">Nenhum produto encontrado.</p>
              ) : null}
              {products.map((product) => (
                <button
                  className="flex w-full items-center gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-slate-900"
                  key={product.id}
                  onClick={() => onSelect(product)}
                  type="button"
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border">
                    <ProductImage imageUrl={product.imageUrl} name={product.name} />
                  </div>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{product.name}</span>
                    <span className="block truncate text-xs text-muted">{productMeta(product)}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function LabeledTextarea({
  error,
  id,
  label,
  minHeight,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
  id: string;
  label: string;
  minHeight: string;
}) {
  return (
    <label className="grid gap-1.5" htmlFor={id}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        className={`${minHeight} w-full rounded-md border border-border bg-slate-950/60 px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-60`}
        id={id}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-red-300">{error}</span> : null}
    </label>
  );
}

function toInitialForm(product?: PortalProduct): FormState {
  return {
    ...emptyForm,
    items: [
      product
        ? {
            ...emptyItem,
            product,
            productId: product.id,
            productQuery: product.name,
          }
        : { ...emptyItem },
    ],
  };
}

function toForm(request: {
  description: string | null;
  items: Array<{
    description: string | null;
    productId: string | null;
    productImageUrlSnapshot: string | null;
    productNameSnapshot: string | null;
    productReferenceSnapshot: string | null;
    productSkuSnapshot: string | null;
    quantity: number;
  }>;
  title: string;
}): FormState {
  return {
    title: request.title,
    description: request.description ?? "",
    items: request.items.map((item) => {
      const product = item.productId && item.productNameSnapshot
        ? {
            id: item.productId,
            name: item.productNameSnapshot,
            description: null,
            sku: item.productSkuSnapshot,
            referenceCode: item.productReferenceSnapshot,
            imageUrl: item.productImageUrlSnapshot,
          }
        : null;
      return {
        product,
        productId: item.productId ?? "",
        productQuery: product?.name ?? "",
        description: item.description ?? "",
        quantity: String(item.quantity),
        manual: !item.productId,
      };
    }),
  };
}

function validate(form: FormState) {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) {
    errors.title = "Informe o título da solicitação.";
  }
  if (form.items.length === 0) {
    errors.items = "Adicione pelo menos um item.";
  }
  form.items.forEach((item, index) => {
    if (!item.productId && !item.description.trim()) {
      errors[`items.${index}.product`] = "Selecione um produto ou descreva o item manualmente.";
      errors[`items.${index}.description`] = "Selecione um produto ou descreva o item manualmente.";
    }
    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors[`items.${index}.quantity`] = "Informe uma quantidade maior que zero.";
    }
  });
  return { errors, valid: Object.keys(errors).length === 0 };
}

function toPayload(form: FormState): QuoteRequestInput {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    items: form.items.map((item) => ({
      productId: item.productId || undefined,
      description: item.productId ? item.description.trim() || undefined : item.description.trim(),
      quantity: Number(item.quantity),
    })),
  };
}

function requestSummary(form: FormState): RequestSummary {
  return form.items.reduce<RequestSummary>(
    (summary, item) => {
      const quantity = Number(item.quantity);
      return {
        itemCount: summary.itemCount + 1,
        totalUnits: summary.totalUnits + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0),
        catalogItems: summary.catalogItems + (item.productId ? 1 : 0),
        manualItems: summary.manualItems + (item.productId ? 0 : 1),
      };
    },
    { catalogItems: 0, itemCount: 0, manualItems: 0, totalUnits: 0 },
  );
}

function formatUnits(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);
}

function productMeta(product: PortalProduct) {
  const meta = [product.sku ? `SKU ${product.sku}` : null, product.referenceCode ? `Ref. ${product.referenceCode}` : null]
    .filter(Boolean);
  return meta.length > 0 ? meta.join(" · ") : "Produto cadastrado";
}
