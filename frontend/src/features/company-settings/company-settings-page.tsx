"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState, LoadingState } from "@/components/ui/table";
import { TextField } from "@/components/ui/text-field";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { appToast, getApiErrorMessage } from "@/lib/toast";
import { getCompanySettings, updateCompanySettings } from "./company-settings-service";
import type { CompanySettings, CompanySettingsInput } from "./types";

type FormState = Record<keyof CompanySettingsInput, string>;

export function CompanySettingsPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );

  const settings = useQuery({
    queryKey: ["company-settings", token],
    queryFn: () => getCompanySettings(token ?? ""),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (settings.isError) {
      appToast.error("Não foi possível carregar as configurações da empresa.");
    }
  }, [settings.isError]);

  return (
    <AppLayout maxWidth="wide">
      <PageHeader
        eyebrow="Configurações"
        subtitle="Defina os dados comerciais usados em propostas, PDFs e novos orçamentos."
        title="Configurações da Empresa"
      />

      <Card className="overflow-hidden">
        {settings.isLoading ? (
          <LoadingState text="Carregando configurações da empresa..." />
        ) : null}
        {settings.isError ? (
          <ErrorState text="Não foi possível carregar as configurações da empresa." />
        ) : null}
        {settings.data ? (
          <CompanySettingsForm initialSettings={settings.data} token={token ?? ""} />
        ) : null}
      </Card>
    </AppLayout>
  );
}

function CompanySettingsForm({
  initialSettings,
  token,
}: {
  initialSettings: CompanySettings;
  token: string;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(initialSettings));
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const saveSettings = useMutation({
    mutationFn: (input: CompanySettingsInput) => updateCompanySettings(token, input),
    onSuccess: (data) => {
      setForm(toForm(data));
      appToast.success("Configurações da empresa salvas com sucesso.");
    },
    onError: (error) => {
      appToast.error(
        getApiErrorMessage(error, "Não foi possível salvar as configurações da empresa."),
      );
    },
  });

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate(form);
    setErrors(validation.errors);
    if (!validation.valid) {
      return;
    }
    saveSettings.mutate(toPayload(form));
  }

  return (
    <form className="grid gap-6 p-5" noValidate onSubmit={submit}>
      <Section icon={<Building2 size={18} aria-hidden="true" />} title="Dados comerciais">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <TextField
            error={errors.tradeName}
            label="Nome comercial"
            onChange={(event) => updateField("tradeName", event.target.value)}
            value={form.tradeName}
          />
          <TextField
            label="Razão social"
            onChange={(event) => updateField("legalName", event.target.value)}
            value={form.legalName}
          />
          <TextField
            label="CPF/CNPJ"
            onChange={(event) => updateField("document", event.target.value)}
            value={form.document}
          />
          <TextField
            error={errors.email}
            label="E-mail"
            onChange={(event) => updateField("email", event.target.value)}
            value={form.email}
          />
          <TextField
            label="Telefone"
            onChange={(event) => updateField("phone", event.target.value)}
            value={form.phone}
          />
          <TextField
            label="WhatsApp"
            onChange={(event) => updateField("whatsapp", event.target.value)}
            value={form.whatsapp}
          />
        </div>
      </Section>

      <Section title="Endereço">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextField
            label="Endereço"
            onChange={(event) => updateField("address", event.target.value)}
            value={form.address}
          />
          <TextField
            label="Número"
            onChange={(event) => updateField("addressNumber", event.target.value)}
            value={form.addressNumber}
          />
          <TextField
            label="Complemento"
            onChange={(event) => updateField("addressComplement", event.target.value)}
            value={form.addressComplement}
          />
          <TextField
            label="Bairro"
            onChange={(event) => updateField("neighborhood", event.target.value)}
            value={form.neighborhood}
          />
          <TextField
            label="Cidade"
            onChange={(event) => updateField("city", event.target.value)}
            value={form.city}
          />
          <TextField
            error={errors.state}
            label="Estado"
            maxLength={2}
            onChange={(event) => updateField("state", event.target.value.toUpperCase())}
            value={form.state}
          />
          <TextField
            label="CEP"
            onChange={(event) => updateField("zipCode", event.target.value)}
            value={form.zipCode}
          />
        </div>
      </Section>

      <Section title="Padrões para propostas">
        <div className="grid gap-4 lg:grid-cols-3">
          <TextField
            error={errors.defaultQuoteValidityDays}
            label="Validade padrão do orçamento em dias"
            min={1}
            max={365}
            onChange={(event) => updateField("defaultQuoteValidityDays", event.target.value)}
            type="number"
            value={form.defaultQuoteValidityDays}
          />
          <TextArea
            className="lg:col-span-2"
            label="Condições de pagamento padrão"
            onChange={(event) => updateField("defaultPaymentTerms", event.target.value)}
            value={form.defaultPaymentTerms}
          />
          <TextArea
            className="lg:col-span-3"
            label="Observações padrão da proposta"
            onChange={(event) => updateField("defaultQuoteNotes", event.target.value)}
            value={form.defaultQuoteNotes}
          />
        </div>
      </Section>

      <div className="flex justify-end border-t border-border pt-5">
        <Button disabled={saveSettings.isPending} type="submit">
          <Save size={17} aria-hidden="true" />
          {saveSettings.isPending ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  title: string;
}) {
  return (
    <section className="grid gap-4">
      <CardHeader className="rounded-lg border border-border">
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            {icon}
            {title}
          </span>
        </CardTitle>
      </CardHeader>
      {children}
    </section>
  );
}

function TextArea({
  className,
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={`grid gap-1.5 ${className ?? ""}`}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        className="min-h-28 rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 dark:placeholder:text-slate-500"
        {...props}
      />
    </label>
  );
}

function toForm(settings: CompanySettings): FormState {
  return {
    tradeName: settings.tradeName ?? "",
    legalName: settings.legalName ?? "",
    document: settings.document ?? "",
    email: settings.email ?? "",
    phone: settings.phone ?? "",
    whatsapp: settings.whatsapp ?? "",
    address: settings.address ?? "",
    addressNumber: settings.addressNumber ?? "",
    addressComplement: settings.addressComplement ?? "",
    neighborhood: settings.neighborhood ?? "",
    city: settings.city ?? "",
    state: settings.state ?? "",
    zipCode: settings.zipCode ?? "",
    defaultQuoteNotes: settings.defaultQuoteNotes ?? "",
    defaultPaymentTerms: settings.defaultPaymentTerms ?? "",
    defaultQuoteValidityDays:
      settings.defaultQuoteValidityDays == null ? "" : String(settings.defaultQuoteValidityDays),
  };
}

function toPayload(form: FormState): CompanySettingsInput {
  return {
    tradeName: form.tradeName.trim(),
    legalName: optional(form.legalName),
    document: optional(form.document),
    email: optional(form.email),
    phone: optional(form.phone),
    whatsapp: optional(form.whatsapp),
    address: optional(form.address),
    addressNumber: optional(form.addressNumber),
    addressComplement: optional(form.addressComplement),
    neighborhood: optional(form.neighborhood),
    city: optional(form.city),
    state: optional(form.state),
    zipCode: optional(form.zipCode),
    defaultQuoteNotes: optional(form.defaultQuoteNotes),
    defaultPaymentTerms: optional(form.defaultPaymentTerms),
    defaultQuoteValidityDays: form.defaultQuoteValidityDays
      ? Number(form.defaultQuoteValidityDays)
      : undefined,
  };
}

function validate(form: FormState) {
  const errors: Partial<FormState> = {};
  if (!form.tradeName.trim()) {
    errors.tradeName = "Informe o nome comercial.";
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }
  if (form.state.trim().length > 2) {
    errors.state = "Use no máximo 2 caracteres.";
  }
  if (form.defaultQuoteValidityDays.trim()) {
    const days = Number(form.defaultQuoteValidityDays);
    if (!Number.isInteger(days) || days <= 0) {
      errors.defaultQuoteValidityDays = "Informe um valor maior que zero.";
    } else if (days > 365) {
      errors.defaultQuoteValidityDays = "Informe um valor até 365.";
    }
  }
  return { errors, valid: Object.keys(errors).length === 0 };
}

function optional(value: string) {
  return value.trim() || undefined;
}
