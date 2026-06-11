import React from "react";
import { describe, expect, test, vi } from "vitest";
import RootLayout from "./layout";

vi.mock("sonner", () => ({
  Toaster: (props: { position: string; richColors: boolean }) => (
    <div data-position={props.position} data-rich-colors={String(props.richColors)}>
      toaster
    </div>
  ),
}));

vi.mock("@/components/providers/query-provider", () => ({
  QueryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("RootLayout", () => {
  test("renders the global toast provider", () => {
    const layout = RootLayout({ children: <main>conteúdo</main> }) as React.ReactElement;
    const body = React.Children.toArray(layout.props.children)[0] as React.ReactElement;
    const children = React.Children.toArray(body.props.children);
    const toaster = children[1] as React.ReactElement<{ position: string; richColors: boolean }>;

    expect(toaster.props.position).toBe("top-right");
    expect(toaster.props.richColors).toBe(true);
  });
});
