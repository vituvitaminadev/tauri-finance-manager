import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CurrencyInput } from "./CurrencyInput";

describe("CurrencyInput", () => {
  it("renders an empty text input with placeholder", () => {
    render(<CurrencyInput value={undefined} onChange={vi.fn()} placeholder="R$ 0,00" />);
    const input = screen.getByPlaceholderText("R$ 0,00");
    expect(input).toBeDefined();
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("typing a digit appends to cents (1 → R$ 0,01)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencyInput value={undefined} onChange={onChange} placeholder="R$ 0,00" />);
    const input = screen.getByPlaceholderText("R$ 0,00");
    await user.click(input);
    await user.keyboard("1");
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("subsequent digit shifts left (1 then 5 → 15 cents = R$ 0,15)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<CurrencyInput value={undefined} onChange={onChange} placeholder="R$ 0,00" />);
    const input = screen.getByPlaceholderText("R$ 0,00");
    await user.click(input);
    await user.keyboard("1");
    rerender(<CurrencyInput value={1} onChange={onChange} placeholder="R$ 0,00" />);
    await user.keyboard("5");
    expect(onChange).toHaveBeenLastCalledWith(15);
  });

  it("displays formatted BRL value when value is provided", () => {
    render(<CurrencyInput value={150000} onChange={vi.fn()} data-testid="ci" />);
    const input = screen.getByTestId("ci") as HTMLInputElement;
    expect(input.value).toMatch(/1\.500,00/);
  });

  it("backspace removes last digit (150 → 15)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencyInput value={150} onChange={onChange} data-testid="ci" />);
    const input = screen.getByTestId("ci");
    await user.click(input);
    await user.keyboard("{Backspace}");
    expect(onChange).toHaveBeenCalledWith(15);
  });

  it("backspace on single digit returns undefined (1 → undefined)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencyInput value={1} onChange={onChange} data-testid="ci" />);
    await user.click(screen.getByTestId("ci"));
    await user.keyboard("{Backspace}");
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("non-digit keys are ignored", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CurrencyInput value={undefined} onChange={onChange} placeholder="R$ 0,00" />);
    await user.click(screen.getByPlaceholderText("R$ 0,00"));
    await user.keyboard("abc.,- ");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("passes through className and other HTML props", () => {
    render(<CurrencyInput value={undefined} onChange={vi.fn()} className="my-class" data-testid="ci" />);
    const input = screen.getByTestId("ci");
    expect((input as HTMLInputElement).className).toContain("my-class");
  });
});
