"use client";

import {
  BarChart3,
  Boxes,
  FileText,
  LayoutDashboard,
  Menu,
  PackageSearch,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/customers", icon: Users },
  { label: "Produtos", href: "/products", icon: Boxes },
  { label: "Serviços", href: "/services", icon: Wrench },
  { label: "Estoque", href: "/stock", icon: BarChart3 },
  { label: "Reposição / Compras", href: "/stock/low", icon: PackageSearch },
  { label: "Orçamentos", href: "/quotes", icon: FileText },
  { label: "Configurações", href: "/settings/company", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-panel px-4 py-5 shadow-subtle transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <Link className="grid" href="/dashboard" onClick={() => setOpen(false)}>
            <span className="text-lg font-semibold text-ink">StockFlow</span>
            <span className="text-xs text-muted">Gestão comercial</span>
          </Link>
          <button
            aria-label="Fechar menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-ink lg:hidden"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="grid gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                className={`inline-flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                  active
                    ? "bg-teal-50 text-primary"
                    : "text-slate-600 hover:bg-slate-50 hover:text-ink"
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

        <div className="mt-auto border-t border-border px-2 pt-4">
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }
  if (href === "/stock") {
    return pathname === "/stock";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
