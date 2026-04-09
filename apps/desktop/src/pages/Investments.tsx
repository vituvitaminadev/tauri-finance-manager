import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { useProfile } from "../context/profile";

interface Goal { id: number; name: string; targetCents: number | null; archived: boolean; }
interface Contribution { id: number; goalId: number; year: number; month: number; amountCents: number; note: string | null; }
interface GoalTotal { goalId: number; totalCents: number; }

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function InvestmentsPage() {
  const { activeProfile } = useProfile();
  const profileId = activeProfile!.id;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [totals, setTotals] = useState<GoalTotal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);

  const [newContribAmount, setNewContribAmount] = useState("");
  const [newContribNote, setNewContribNote] = useState("");
  const now = new Date();
  const [contribYear, setContribYear] = useState(now.getFullYear());
  const [contribMonth, setContribMonth] = useState(now.getMonth() + 1);

  const [deleteContribId, setDeleteContribId] = useState<number | null>(null);
  const [editContribId, setEditContribId] = useState<number | null>(null);
  const [editContribAmount, setEditContribAmount] = useState("");
  const [editContribNote, setEditContribNote] = useState("");

  useEffect(() => {
    loadGoals();
  }, [profileId]);

  useEffect(() => {
    if (selectedGoalId !== null) {
      trpc.investment.listContributions.query({ goalId: selectedGoalId }).then((d) => setContributions(d as Contribution[]));
    }
  }, [selectedGoalId]);

  async function loadGoals() {
    const [g, t] = await Promise.all([
      trpc.investment.listGoals.query({ profileId }),
      trpc.investment.getGoalTotals.query({ profileId }),
    ]);
    setGoals(g as Goal[]);
    setTotals(t as GoalTotal[]);
  }

  async function createGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newGoalName.trim()) return;
    await trpc.investment.createGoal.mutate({
      profileId,
      name: newGoalName.trim(),
      targetCents: newGoalTarget ? Number(newGoalTarget) : undefined,
    });
    setNewGoalName(""); setNewGoalTarget(""); setAddingGoal(false);
    loadGoals();
  }

  async function archiveGoal(id: number) {
    await trpc.investment.archiveGoal.mutate({ id });
    setGoals((prev) => prev.filter((g) => g.id !== id));
    if (selectedGoalId === id) setSelectedGoalId(null);
  }

  async function addContribution(e: React.FormEvent) {
    e.preventDefault();
    if (!newContribAmount || selectedGoalId === null) return;
    const c = await trpc.investment.addContribution.mutate({
      goalId: selectedGoalId,
      year: contribYear,
      month: contribMonth,
      amountCents: Number(newContribAmount),
      note: newContribNote || undefined,
    });
    setContributions((prev) => [...prev, c as Contribution]);
    setNewContribAmount(""); setNewContribNote("");
    loadGoals(); // refresh totals
  }

  async function saveEditContrib(e: React.FormEvent) {
    e.preventDefault();
    if (editContribId === null) return;
    const updated = await trpc.investment.updateContribution.mutate({ id: editContribId, amountCents: Number(editContribAmount), note: editContribNote || null });
    setContributions((prev) => prev.map((c) => c.id === editContribId ? (updated as Contribution) : c));
    setEditContribId(null);
    loadGoals();
  }

  async function deleteContrib(id: number) {
    await trpc.investment.deleteContribution.mutate({ id });
    setContributions((prev) => prev.filter((c) => c.id !== id));
    setDeleteContribId(null);
    loadGoals();
  }

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);
  const selectedTotal = totals.find((t) => t.goalId === selectedGoalId)?.totalCents ?? 0;

  return (
    <div className="flex h-full">
      {/* Goal list */}
      <div className="w-72 border-r p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Investimentos</h2>
          <button onClick={() => setAddingGoal(true)} className="text-xs text-primary underline">+ Meta</button>
        </div>

        <ul className="space-y-2">
          {goals.map((goal) => {
            const total = totals.find((t) => t.goalId === goal.id)?.totalCents ?? 0;
            const pct = goal.targetCents ? Math.min(Math.round((total / goal.targetCents) * 100), 100) : null;
            return (
              <li
                key={goal.id}
                className={`cursor-pointer rounded-lg border p-3 hover:bg-accent ${selectedGoalId === goal.id ? "border-primary bg-accent" : ""}`}
                onClick={() => setSelectedGoalId(goal.id)}
              >
                <div className="font-medium">{goal.name}</div>
                <div className="text-sm text-muted-foreground">{formatBRL(total)}</div>
                {goal.targetCents && (
                  <div className="mt-1">
                    <div className="mb-0.5 flex justify-between text-xs text-muted-foreground">
                      <span>{formatBRL(goal.targetCents)}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {addingGoal && (
          <form onSubmit={createGoal} className="mt-4 space-y-2">
            <input autoFocus value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} placeholder="Nome da meta" className="w-full rounded-md border px-3 py-2 text-sm" />
            <input value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} placeholder="Meta (centavos, opcional)" type="number" min="0" className="w-full rounded-md border px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setAddingGoal(false)} className="flex-1 px-3 py-2 text-sm">Cancelar</button>
              <button type="submit" className="flex-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Criar</button>
            </div>
          </form>
        )}
      </div>

      {/* Contributions panel */}
      <div className="flex-1 p-6">
        {selectedGoal ? (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{selectedGoal.name}</h3>
                <p className="text-sm text-muted-foreground">Total: {formatBRL(selectedTotal)}</p>
              </div>
              <button onClick={() => archiveGoal(selectedGoal.id)} className="text-xs text-muted-foreground underline">Arquivar meta</button>
            </div>

            {/* Contributions list */}
            <ul className="mb-6 space-y-2">
              {contributions.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-md border px-4 py-2">
                  <div>
                    <div>{formatBRL(c.amountCents)}</div>
                    <div className="text-xs text-muted-foreground">{MONTH_NAMES[c.month - 1]}/{c.year}{c.note && ` · ${c.note}`}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditContribId(c.id); setEditContribAmount(String(c.amountCents)); setEditContribNote(c.note ?? ""); }} className="text-xs text-muted-foreground underline">Editar</button>
                    <button onClick={() => setDeleteContribId(c.id)} className="text-xs text-destructive underline">Excluir</button>
                  </div>
                </li>
              ))}
              {contributions.length === 0 && <p className="text-sm text-muted-foreground">Nenhum aporte ainda.</p>}
            </ul>

            {/* Add contribution form */}
            <form onSubmit={addContribution} className="space-y-2">
              <h4 className="text-sm font-medium">Novo aporte</h4>
              <div className="flex gap-2">
                <input value={newContribAmount} onChange={(e) => setNewContribAmount(e.target.value)} placeholder="Valor (centavos)" type="number" min="0" className="flex-1 rounded-md border px-3 py-2 text-sm" />
                <select value={contribMonth} onChange={(e) => setContribMonth(Number(e.target.value))} className="rounded-md border px-3 py-2 text-sm">
                  {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
                <input value={contribYear} onChange={(e) => setContribYear(Number(e.target.value))} type="number" min="2020" className="w-24 rounded-md border px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <input value={newContribNote} onChange={(e) => setNewContribNote(e.target.value)} placeholder="Nota (opcional)" className="flex-1 rounded-md border px-3 py-2 text-sm" />
                <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Adicionar</button>
              </div>
            </form>
          </>
        ) : (
          <p className="text-muted-foreground">Selecione uma meta para ver os aportes.</p>
        )}
      </div>

      {/* Edit contribution dialog */}
      {editContribId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <form onSubmit={saveEditContrib} className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Editar aporte</h2>
            <input autoFocus value={editContribAmount} onChange={(e) => setEditContribAmount(e.target.value)} type="number" min="0" className="rounded-md border px-3 py-2 text-sm" />
            <input value={editContribNote} onChange={(e) => setEditContribNote(e.target.value)} placeholder="Nota (opcional)" className="rounded-md border px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditContribId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete contribution dialog */}
      {deleteContribId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir aporte?</h2>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteContribId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => deleteContrib(deleteContribId)} className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
