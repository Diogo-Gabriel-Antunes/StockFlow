import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Link as LinkIcon,
  PackageCheck,
  PawPrint,
  Scissors,
  Send,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const pains = [
  {
    title: "Orçamentos espalhados em planilhas",
    description: "Arquivos soltos dificultam acompanhamento, revisão e envio.",
  },
  {
    title: "Estoque desatualizado",
    description: "A venda acontece em um lugar e a baixa fica para depois.",
  },
  {
    title: "Falta de histórico com clientes",
    description: "Propostas e conversas se perdem entre mensagens e pastas.",
  },
  {
    title: "Propostas pouco profissionais",
    description: "Documentos manuais deixam a negociação menos consistente.",
  },
  {
    title: "Dificuldade para saber o que comprar",
    description: "Sem estoque mínimo claro, a reposição vira trabalho manual.",
  },
];

const flow = [
  "Cadastrar produtos",
  "Criar orçamento",
  "Enviar proposta",
  "Cliente aprova",
  "Estoque atualiza",
];

const features: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: "Clientes",
    description: "Dados comerciais e histórico em uma base organizada.",
    icon: Users,
  },
  {
    title: "Produtos e serviços",
    description: "Catálogo reutilizável para montar propostas com rapidez.",
    icon: PackageCheck,
  },
  {
    title: "Estoque simples",
    description: "Entradas, saídas e mínimos sem a complexidade de um ERP.",
    icon: Boxes,
  },
  {
    title: "Orçamentos",
    description: "Propostas com itens, quantidades, totais e status.",
    icon: ClipboardList,
  },
  {
    title: "Proposta em PDF",
    description: "Documento profissional para enviar ao cliente.",
    icon: FileText,
  },
  {
    title: "Link público",
    description: "Aprovação online sem exigir acesso interno ao sistema.",
    icon: LinkIcon,
  },
  {
    title: "Reposição",
    description: "Produtos abaixo do mínimo visíveis para compra.",
    icon: ShoppingCart,
  },
  {
    title: "Dashboard",
    description: "Indicadores operacionais em uma tela objetiva.",
    icon: BarChart3,
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "R$ 49",
    period: "/mês",
    description: "Para quem está começando a organizar orçamentos e estoque.",
    cta: "Começar no Starter",
    highlighted: false,
    features: [
      "1 usuário",
      "até 100 orçamentos por mês",
      "cadastro de clientes",
      "produtos e serviços",
      "controle de estoque simples",
      "propostas por link",
      "dashboard básico",
    ],
  },
  {
    name: "Pro",
    price: "R$ 89",
    period: "/mês",
    description: "Para pequenos negócios que já fazem orçamentos todos os dias.",
    cta: "Quero o Pro",
    highlighted: true,
    features: [
      "até 3 usuários",
      "orçamentos ilimitados",
      "clientes ilimitados",
      "produtos e serviços ilimitados",
      "proposta em PDF",
      "link público de aprovação",
      "baixa automática de estoque",
      "reposição/compras",
      "dashboard completo",
    ],
  },
  {
    name: "Business",
    price: "R$ 149",
    period: "/mês",
    description: "Para empresas que precisam de mais usuários e controle.",
    cta: "Falar com a gente",
    highlighted: false,
    features: [
      "até 10 usuários",
      "tudo do plano Pro",
      "múltiplos perfis de acesso",
      "suporte prioritário",
      "melhorias sob demanda avaliadas",
      "preparação para integrações futuras",
    ],
  },
];

const niches: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: "Fornecedores pet",
    description: "Produtos recorrentes, kits, pedidos e reposição no mesmo fluxo.",
    icon: PawPrint,
  },
  {
    title: "Pequenas confecções",
    description: "Peças, serviços e personalizações organizados por proposta.",
    icon: Scissors,
  },
  {
    title: "Pequenos distribuidores",
    description: "Catálogo, disponibilidade e necessidade de compra mais visíveis.",
    icon: Store,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <Header />
      <Hero />
      <PainSection />
      <FlowSection />
      <FeatureSection />
      <PricingSection />
      <NicheSection />
      <InstitutionalSection />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-[#f6f9ff]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
        <a className="flex items-center gap-3" href="#top" aria-label="StockFlow">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/30">
            <PackageCheck size={22} aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold text-slate-950">StockFlow</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          <a className="transition hover:text-blue-700" href="#como-funciona">
            Como funciona
          </a>
          <a className="transition hover:text-blue-700" href="#funcionalidades">
            Funcionalidades
          </a>
          <a className="transition hover:text-blue-700" href="#precos">
            Preços
          </a>
          <a className="transition hover:text-blue-700" href="#sobre">
            Sobre
          </a>
        </nav>

        <Link
          className="inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          href="/login"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden" id="top">
      <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_18%_10%,rgba(37,99,235,0.18),transparent_30%),radial-gradient(circle_at_78%_8%,rgba(14,165,233,0.16),transparent_28%)]" />
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-12 px-6 pb-20 pt-16 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:px-12 lg:pb-24 lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
            <CheckCircle2 size={16} aria-hidden="true" />
            Plataforma B2B para orçamento e estoque
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Controle seus orçamentos e estoque em um só lugar.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Com o StockFlow, pequenos fornecedores criam propostas profissionais,
            acompanham aprovações e sabem exatamente quando repor produtos.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
              href="#contato"
            >
              Solicitar demonstração
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700"
              href="/login"
            >
              Entrar no sistema
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <HeroSignal label="Proposta por link" />
            <HeroSignal label="PDF profissional" />
            <HeroSignal label="Reposição visível" />
          </div>
        </div>

        <ProductMockup />
      </div>
    </section>
  );
}

function HeroSignal({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-700">
        <CheckCircle2 size={15} aria-hidden="true" />
      </span>
      {label}
    </div>
  );
}

function ProductMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-lg bg-blue-200/40 blur-3xl" />
      <div className="rounded-lg border border-blue-100 bg-white p-3 shadow-2xl shadow-blue-950/15 lg:p-4">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-300" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200">
              StockFlow Cloud
            </span>
          </div>

          <div className="grid bg-[#eef5ff] p-3 lg:grid-cols-[13.5rem_1fr] lg:p-4">
            <aside className="hidden rounded-l-lg border border-r-0 border-slate-200 bg-white p-4 lg:block">
              <p className="text-sm font-semibold text-slate-950">StockFlow</p>
              <div className="mt-6 grid gap-2">
                {["Dashboard", "Clientes", "Produtos", "Orçamentos"].map(
                  (item, index) => (
                    <div
                      className={`rounded-md px-3 py-2 text-sm ${
                        index === 0
                          ? "bg-blue-600 font-semibold text-white shadow-sm"
                          : "text-slate-500"
                      }`}
                      key={item}
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </aside>

            <section className="rounded-lg border border-slate-200 bg-white p-4 lg:rounded-l-none lg:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-700">Painel</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                    Orçamentos e estoque conectados
                  </h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Operação ativa
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <MockupTile title="Proposta" value="Pronta para envio" tone="blue" />
                <MockupTile title="Aprovação" value="Link público" tone="cyan" />
                <MockupTile title="Estoque" value="Reposição sinalizada" tone="amber" />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_17rem]">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-950">
                      Orçamento em montagem
                    </h3>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      Rascunho
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <MockupLine label="Cliente selecionado" value="Cadastro vinculado" />
                    <MockupLine label="Itens adicionados" value="Produtos e serviços" />
                    <MockupLine label="Próxima etapa" value="Enviar proposta" />
                  </div>
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <ShoppingCart className="text-blue-700" size={24} aria-hidden="true" />
                  <p className="mt-4 text-sm font-semibold text-slate-950">
                    Reposição sem adivinhação
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    O estoque mínimo aparece no fluxo antes da próxima compra.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockupTile({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "blue" | "cyan" | "amber";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    cyan: "bg-cyan-50 text-cyan-700",
    amber: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
      <p className={`mt-2 rounded-md px-2 py-1 text-sm font-semibold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function MockupLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 rounded-md bg-white px-3 py-3 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function PainSection() {
  return (
    <Section
      eyebrow="Dores do dia a dia"
      title="Quando proposta e estoque ficam separados, a operação perde controle."
      description="O StockFlow troca improviso por um processo claro, do cadastro ao acompanhamento da aprovação."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {pains.map((pain, index) => (
          <article
            className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/10"
            key={pain.title}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-blue-600 opacity-0 transition group-hover:opacity-100" />
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white transition group-hover:bg-blue-600">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-5 text-base font-semibold leading-6 text-slate-950">
              {pain.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{pain.description}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function FlowSection() {
  return (
    <section className="bg-white px-6 py-20 sm:px-8 lg:px-12" id="como-funciona">
      <div className="mx-auto w-full max-w-[1440px] rounded-lg border border-blue-100 bg-[#f6f9ff] p-6 shadow-sm lg:p-10">
        <SectionHeader
          eyebrow="Como funciona"
          title="Um caminho direto entre orçamento, aprovação e estoque."
          description="A operação segue uma sequência simples, fácil de explicar e fácil de executar."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-5">
          {flow.map((step, index) => (
            <div className="relative" key={step}>
              <div className="flex h-full items-center gap-4 rounded-lg border border-blue-100 bg-white p-4 shadow-sm md:min-h-36 md:flex-col md:items-start md:justify-between">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="text-base font-semibold text-slate-950">{step}</p>
              </div>
              {index < flow.length - 1 ? (
                <ChevronRight
                  className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white text-blue-300 md:block"
                  size={24}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureSection() {
  return (
    <Section
      eyebrow="Funcionalidades"
      title="O essencial para vender, aprovar e repor com mais organização."
      description="Módulos enxutos, integrados e pensados para quem precisa operar sem burocracia."
      id="funcionalidades"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </Section>
  );
}

function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/10">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Icon size={23} aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function PricingSection() {
  return (
    <section className="bg-white px-6 py-20 sm:px-8 lg:px-12" id="precos">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionHeader
            eyebrow="Preços"
            title="Planos simples para começar"
            description="Comece com um plano acessível para organizar seus orçamentos, produtos e estoque sem a complexidade de um ERP tradicional."
          />
          <FounderOffer />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderOffer() {
  return (
    <article className="rounded-lg border border-blue-200 bg-blue-600 p-6 text-white shadow-xl shadow-blue-600/20">
      <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-blue-50">
        Preço fundador
      </span>
      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h3 className="text-2xl font-semibold">
            Preço fundador para os primeiros clientes
          </h3>
          <p className="mt-3 text-sm leading-7 text-blue-50">
            Os primeiros clientes terão acesso antecipado ao StockFlow com suporte
            direto e participação na evolução do produto.
          </p>
        </div>
        <div className="md:text-right">
          <p className="text-3xl font-semibold">R$ 39/mês</p>
          <p className="mt-1 text-sm font-medium text-blue-100">
            nos 3 primeiros meses
          </p>
          <a
            className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
            href="#contato"
          >
            Quero ser cliente fundador
          </a>
        </div>
      </div>
    </article>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  cta,
  highlighted,
  features,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  highlighted: boolean;
  features: string[];
}) {
  return (
    <article
      className={`relative flex h-full flex-col rounded-lg border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10 ${
        highlighted ? "border-blue-500 ring-4 ring-blue-100" : "border-slate-200"
      }`}
    >
      {highlighted ? (
        <span className="absolute right-5 top-5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
          Mais indicado
        </span>
      ) : null}

      <div>
        <h3 className="text-xl font-semibold text-slate-950">{name}</h3>
        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex items-end gap-1">
          <span className="text-4xl font-semibold text-slate-950">{price}</span>
          <span className="pb-1 text-sm font-semibold text-slate-500">{period}</span>
        </div>
      </div>

      <a
        className={`mt-6 inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition ${
          highlighted
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            : "border border-slate-300 bg-white text-slate-950 hover:border-blue-300 hover:text-blue-700"
        }`}
        href="#contato"
      >
        {cta}
      </a>

      <ul className="mt-6 grid gap-3 text-sm text-slate-700">
        {features.map((feature) => (
          <li className="flex gap-3" key={feature}>
            <CheckCircle2
              className="mt-0.5 shrink-0 text-blue-600"
              size={17}
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function NicheSection() {
  return (
    <section className="bg-slate-950 px-6 py-20 text-white sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-[1440px]">
        <SectionHeader
          eyebrow="Nichos atendidos"
          title="Projetado para negócios que fazem orçamento antes de vender."
          description="Pet, confecção e distribuição têm rotinas diferentes, mas compartilham a mesma necessidade: proposta clara e estoque sob controle."
          inverted
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {niches.map(({ title, description, icon: Icon }) => (
            <article
              className="rounded-lg border border-white/10 bg-white/5 p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white/10"
              key={title}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InstitutionalSection() {
  return (
    <section className="bg-white px-6 py-20 sm:px-8 lg:px-12" id="sobre">
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 rounded-lg border border-slate-200 bg-[#f6f9ff] p-6 shadow-sm lg:grid-cols-[0.82fr_1.18fr] lg:p-10">
        <div>
          <p className="text-sm font-semibold uppercase text-blue-700">
            Sobre o StockFlow
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
            Simples o bastante para começar, organizado o bastante para crescer.
          </h2>
        </div>
        <p className="text-base leading-8 text-slate-600">
          StockFlow nasceu para simplificar a rotina de pequenos negócios que
          vendem produtos, criam orçamentos e precisam manter o estoque sob
          controle. A proposta é entregar uma ferramenta simples, objetiva e
          acessível, sem a complexidade de um ERP tradicional.
        </p>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-6 py-20 sm:px-8 lg:px-12" id="contato">
      <div className="mx-auto w-full max-w-[1320px] overflow-hidden rounded-lg bg-slate-950 text-white shadow-2xl shadow-slate-950/20">
        <div className="relative grid gap-10 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
          <div className="absolute right-0 top-0 h-40 w-40 bg-blue-500/20 blur-3xl" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1 text-sm font-semibold text-blue-200">
              <Send size={15} aria-hidden="true" />
              Próximo passo
            </p>
            <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
              Pare de perder tempo com planilhas e propostas manuais.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Veja como o StockFlow pode transformar orçamento, aprovação e
              estoque em uma rotina mais clara.
            </p>
          </div>
          <div className="relative flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
              href="#contato"
            >
              Quero uma demonstração
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              href="/login"
            >
              Acessar sistema
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-blue-100 bg-white px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-950">StockFlow</p>
          <p className="mt-2 text-sm text-slate-600">
            Sistema de orçamento com estoque integrado.
          </p>
        </div>
        <nav className="flex flex-wrap gap-5 text-sm font-semibold text-slate-600">
          <a className="transition hover:text-blue-700" href="#como-funciona">
            Como funciona
          </a>
          <a className="transition hover:text-blue-700" href="#funcionalidades">
            Funcionalidades
          </a>
          <a className="transition hover:text-blue-700" href="#precos">
            Preços
          </a>
          <a className="transition hover:text-blue-700" href="#sobre">
            Sobre
          </a>
          <a className="transition hover:text-blue-700" href="#contato">
            Contato
          </a>
        </nav>
      </div>
    </footer>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
  id,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="px-6 py-20 sm:px-8 lg:px-12" id={id}>
      <div className="mx-auto w-full max-w-[1440px]">
        <SectionHeader eyebrow={eyebrow} title={title} description={description} />
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  inverted = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  inverted?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p
        className={`text-sm font-semibold uppercase ${
          inverted ? "text-blue-300" : "text-blue-700"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-3xl font-semibold leading-tight sm:text-4xl ${
          inverted ? "text-white" : "text-slate-950"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-4 text-base leading-7 ${
          inverted ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {description}
      </p>
    </div>
  );
}
