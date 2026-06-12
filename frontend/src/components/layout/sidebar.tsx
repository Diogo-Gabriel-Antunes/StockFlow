"use client";

import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  Settings,
  ShoppingCart,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearToken } from "@/features/auth/auth-storage";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Produtos", href: "/products", icon: Boxes },
  { label: "Serviços", href: "/services", icon: Wrench },
  { label: "Movimentações de estoque", href: "/stock/movements", icon: BarChart3 },
  { label: "Estoque baixo", href: "/stock/low", icon: PackageSearch },
  { label: "Reposição / Compras", href: "/stock/replenishment", icon: ShoppingCart },
  { label: "Orçamentos", href: "/quotes", icon: FileText },
  { label: "Solicitações", href: "/quote-requests", icon: Inbox },
  { label: "Notificações", href: "/notifications", icon: Bell },
  { label: "Atividades", href: "/activity-logs", icon: ClipboardList },
  { label: "Configurações", href: "/settings/company", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function logout() {
    clearToken();
    setOpen(false);
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button
        aria-label="Abrir menu"
        className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-panel text-ink shadow-subtle lg:hidden"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {open ? (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 px-4 py-5 text-slate-100 shadow-subtle transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-7 flex items-center justify-between rounded-lg border border-slate-100/10 bg-slate-800/5 px-3 py-3">
          <Link className="grid" href="/dashboard" onClick={() => setOpen(false)}>
            <span className="text-lg font-semibold text-white">StockFlow</span>
            <span className="text-xs text-slate-400">Gestão comercial</span>
          </Link>
          <button
            aria-label="Fechar menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-100/10 text-slate-200 lg:hidden"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="grid gap-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                className={`inline-flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                  active
                    ? "bg-sky-950/40 text-sky-200 ring-1 ring-sky-400/20"
                    : "text-slate-400 hover:bg-slate-800/5 hover:text-white"
                }`}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-slate-100/10 px-2 pt-4">
          <button
            className="inline-flex h-10 w-full items-center gap-2 rounded-md border border-slate-100/10 bg-slate-800/5 px-3 text-sm font-semibold text-slate-200 shadow-subtle transition hover:bg-slate-800/10 hover:text-white"
            onClick={logout}
            type="button"
          >
            <LogOut size={17} aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }
  if (href === "/stock/movements") {
    return pathname === "/stock" || pathname === "/stock/movements";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
