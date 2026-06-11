import { describe, expect, test, vi } from "vitest";
import { appToast, getApiErrorMessage } from "./toast";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe("appToast", () => {
  test("delegates notification variants to sonner", () => {
    appToast.success("Sucesso");
    appToast.error("Erro");
    appToast.warning("Aviso");
    appToast.info("Info");

    expect(toast.success).toHaveBeenCalledWith("Sucesso");
    expect(toast.error).toHaveBeenCalledWith("Erro");
    expect(toast.warning).toHaveBeenCalledWith("Aviso");
    expect(toast.info).toHaveBeenCalledWith("Info");
  });

  test("sanitizes technical html errors", () => {
    expect(getApiErrorMessage(new Error("<html>erro</html>"), "Falha")).toBe("Falha");
    expect(getApiErrorMessage(new Error("Mensagem útil"), "Falha")).toBe("Mensagem útil");
  });
});
