import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";

interface Category { id: number; name: string; }
interface SpendingRow { categoryId: number; spentCents: number; }
interface LimitRow { id: number; categoryId: number; limitCents: number; }

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

interface Props {
  profileId: number;
  year: number;
  month: number;
  categories: Category[];
  /** refresh key — increment to trigger re-fetch after expense changes */
  refreshKey: number;
}

export function CategorySpendingTable({ profileId, year, month, categories, refreshKey }: Props) {
  const [spending, setSpending] = useState<SpendingRow[]>([]);
  const [limits, setLimits] = useState<LimitRow[]>([]);
  const [editingLimitCatId, setEditingLimitCatId] = useState<number | null>(null);
  const [limitInput, setLimitInput] = useState("");

  useEffect(() => {
    trpc.categoryLimit.getCategorySpending.query({ profileId, year, month })
      .then((d) => setSpending(d as SpendingRow[]));
    trpc.categoryLimit.getMonthLimits.query({ profileId, year, month })
      .then((d) => setLimits(d as LimitRow[]));
  }, [profileId, year, month, refreshKey]);

  async function saveLimit(categoryId: number) {
    const limitCents = Math.round(parseFloat(limitInput) * 100);
    if (isNaN(limitCents) || limitCents < 0) return;
    const updated = await trpc.categoryLimit.setLimit.mutate({ profileId, categoryId, year, month, limitCents });
    setLimits((prev) => {
      const exists = prev.find((l) => l.categoryId === categoryId);
      if (exists) return prev.map((l) => l.categoryId === categoryId ? (updated as LimitRow) : l);
      return [...prev, updated as LimitRow];
    });
    setEditingLimitCatId(null);
    setLimitInput("");
  }

  const categoriesWithSpending = categories.map((cat) => {
    const spent = spending.find((s) => s.categoryId === cat.id)?.spentCents ?? 0;
    const limit = limits.find((l) => l.categoryId === cat.id);
    const pct = limit ? Math.round((spent / limit.limitCents) * 100) : null;
    return { ...cat, spent, limit: limit?.limitCents ?? null, pct };
  }).filter((c) => c.spent > 0 || c.limit !== null);

  if (categoriesWithSpending.length === 0) return null;

  return (
    <section>
      <h3 className="mb-4 text-lg font-semibold">Gastos por Categoria</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2">Categoria</th>
            <th className="pb-2 text-right">Gasto</th>
            <th className="pb-2 text-right">Limite</th>
            <th className="pb-2 w-32">Uso</th>
          </tr>
        </thead>
        <tbody>
          {categoriesWithSpending.map((cat) => (
            <tr key={cat.id} className="border-b">
              <td className="py-2">{cat.name}</td>
              <td className="py-2 text-right">{formatBRL(cat.spent)}</td>
              <td className="py-2 text-right">
                {editingLimitCatId === cat.id ? (
                  <span className="flex items-center justify-end gap-1">
                    <input
                      autoFocus
                      value={limitInput}
                      onChange={(e) => setLimitInput(e.target.value)}
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-24 rounded border px-2 py-0.5 text-xs"
                      onKeyDown={(e) => { if (e.key === "Enter") saveLimit(cat.id); if (e.key === "Escape") setEditingLimitCatId(null); }}
                    />
                    <button onClick={() => saveLimit(cat.id)} className="text-xs text-primary underline">OK</button>
                  </span>
                ) : (
                  <button
                    onClick={() => { setEditingLimitCatId(cat.id); setLimitInput(cat.limit !== null ? String(cat.limit / 100) : ""); }}
                    className="text-xs text-muted-foreground underline"
                  >
                    {cat.limit !== null ? formatBRL(cat.limit) : "Definir"}
                  </button>
                )}
              </td>
              <td className="py-2">
                {cat.pct !== null ? (
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${cat.pct > 100 ? "bg-red-500" : "bg-primary"}`}
                        style={{ width: `${Math.min(cat.pct, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs ${cat.pct > 100 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                      {cat.pct}%
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
