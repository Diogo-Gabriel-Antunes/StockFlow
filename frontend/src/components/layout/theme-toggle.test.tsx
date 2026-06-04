import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: vi.fn(() => storage.clear()),
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        removeItem: vi.fn((key: string) => storage.delete(key)),
        setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      },
    });
  });

  afterEach(() => {
    document.documentElement.classList.remove("dark");
    window.localStorage.clear();
  });

  test("switches between light and dark mode", () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: "Ativar modo escuro" });
    fireEvent.click(button);

    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("stockflow_theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Ativar modo claro" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ativar modo claro" }));

    expect(document.documentElement).not.toHaveClass("dark");
    expect(window.localStorage.getItem("stockflow_theme")).toBe("light");
  });
});
