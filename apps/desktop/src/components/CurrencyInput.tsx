import { InputHTMLAttributes } from "react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | undefined;
  onChange: (cents: number | undefined) => void;
}

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function CurrencyInput({ value, onChange, ...rest }: Props) {
  const displayValue = value ? formatBRL(value) : "";

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const current = value ?? 0;
      const next = Math.floor(current / 10);
      onChange(next === 0 ? undefined : next);
      return;
    }

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    const digit = parseInt(e.key, 10);
    const current = value ?? 0;
    const next = current * 10 + digit;
    onChange(next);
  }

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={() => {}}
      onKeyDown={handleKeyDown}
    />
  );
}
