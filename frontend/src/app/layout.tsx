import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "StockFlow",
  description: "Sistema de orçamento com estoque integrado para pequenos negócios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="dark" lang="pt-BR">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster richColors position="top-right" theme="dark" />
      </body>
    </html>
  );
}
