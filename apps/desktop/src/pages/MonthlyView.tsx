import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { useProfile } from "../context/profile";

interface IncomeEntry {
  id: number;
  profileId: number;
  year: number;
  month: number;
  name: string;
  amountCents: number;
}

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function parseBRL(value: string): number {
  const numeric = value.replace(/[^\d]/g, "");
  return parseInt(numeric || "0", 10);
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function MonthlyView() {
  const { activeProfile } = useProfile();
  const profileId = activeProfile!.id;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [newIncomeName, setNewIncomeName] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    trpc.income.list.query({ profileId, year, month }).then((data) =>
      setIncomeEntries(data as IncomeEntry[])
    );
  }, [profileId, year, month]);

  function navigate(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  }

  async function addIncome(e: React.FormEvent) {
    e.preventDefault();
    if (!newIncomeName.trim() || !newIncomeAmount) return;
    const amountCents = parseBRL(newIncomeAmount);
    const entry = await trpc.income.create.mutate({
      profileId, year, month,
      name: newIncomeName.trim(),
      amountCents,
    });
    setIncomeEntries((prev) => [...prev, entry as IncomeEntry]);
    setNewIncomeName("");
    setNewIncomeAmount("");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId === null) return;
    const updated = await trpc.income.update.mutate({
      id: editingId,
      name: editName,
      amountCents: parseBRL(editAmount),
    });
    setIncomeEntries((prev) =>
      prev.map((e) => (e.id === editingId ? (updated as IncomeEntry) : e))
    );
    setEditingId(null);
  }

  async function deleteEntry(id: number) {
    await trpc.income.delete.mutate({ id });
    setIncomeEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleteId(null);
  }

  const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amountCents, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          ← Anterior
        </button>
        <h2 className="text-xl font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <button onClick={() => navigate(1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          Próximo →
        </button>
      </div>

      {/* Income section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Receitas</h3>
          <span className="text-sm font-medium text-green-600">{formatBRL(totalIncome)}</span>
        </div>

        <ul className="space-y-2">
          {incomeEntries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between rounded-md border px-4 py-2">
              <span>{entry.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">{formatBRL(entry.amountCents)}</span>
                <button
                  onClick={() => { setEditingId(entry.id); setEditName(entry.name); setEditAmount(String(entry.amountCents)); }}
                  className="text-xs text-muted-foreground underline"
                >
                  Editar
                </button>
                <button onClick={() => setDeleteId(entry.id)} className="text-xs text-destructive underline">
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={addIncome} className="mt-4 flex gap-2">
          <input
            value={newIncomeName}
            onChange={(e) => setNewIncomeName(e.target.value)}
            placeholder="Descrição"
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <input
            value={newIncomeAmount}
            onChange={(e) => setNewIncomeAmount(e.target.value)}
            placeholder="Valor (centavos)"
            type="number"
            min="0"
            className="w-36 rounded-md border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Adicionar
          </button>
        </form>
      </section>

      {/* Edit dialog */}
      {editingId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <form onSubmit={saveEdit} className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Editar receita</h2>
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            />
            <input
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              type="number"
              min="0"
              className="rounded-md border px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir receita?</h2>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => deleteEntry(deleteId)} className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
