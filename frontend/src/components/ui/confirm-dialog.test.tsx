import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  test("renders when open", () => {
    render(
      <ConfirmDialog
        description="Confirme a ação."
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        title="Excluir registro"
      />,
    );

    expect(screen.getByRole("dialog", { name: "Excluir registro" })).toBeInTheDocument();
    expect(screen.getByText("Confirme a ação.")).toBeInTheDocument();
  });

  test("does not render when closed", () => {
    render(
      <ConfirmDialog
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open={false}
        title="Excluir registro"
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("calls cancel and confirm handlers", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        confirmLabel="Excluir"
        onCancel={onCancel}
        onConfirm={onConfirm}
        open
        title="Excluir registro"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();
  });

  test("disables actions and shows loading label while loading", () => {
    render(
      <ConfirmDialog
        confirmLabel="Excluir"
        loading
        loadingLabel="Excluindo..."
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        open
        title="Excluir registro"
      />,
    );

    expect(screen.getByRole("button", { name: "Excluindo..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});
