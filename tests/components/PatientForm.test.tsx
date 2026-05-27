import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PatientForm } from "@/components/features/PatientForm";

describe("PatientForm", () => {
  test("submits with valid input", async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValue({ ok: true, data: { id: "x", name: "Ana" } });
    render(<PatientForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/nome/i), "Ana Ribeiro");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ana Ribeiro", modality: "online" }),
    );
  });

  test("shows server-side fieldErrors", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      ok: false,
      error: "Dados inválidos.",
      fieldErrors: { name: ["Nome muito curto"] },
    });
    render(<PatientForm onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/nome/i), "X");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(await screen.findByText("Nome muito curto")).toBeInTheDocument();
  });
});
