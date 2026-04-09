import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { useProfile } from "../context/profile";
import { CategorySpendingTable } from "../components/CategorySpendingTable";

interface IncomeEntry {
  id: number;
  profileId: number;
  year: number;
  month: number;
  name: string;
  amountCents: number;
  recurringIncomeId?: number | null;
}

interface ExpenseEntry {
  id: number;
  profileId: number;
  year: number;
  month: number;
  name: string;
  amountCents: number;
  paymentMethod: string;
  categoryId: number | null;
  creditCardId: number | null;
  fixedExpenseId?: number | null;
}

interface Category { id: number; name: string; }
interface CreditCard { id: number; name: string; }

type PaymentMethod = "debit" | "pix" | "boleto" | "cash" | "credit_card";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  debit: "Débito",
  pix: "PIX",
  boleto: "Boleto",
  cash: "Dinheiro",
  credit_card: "Cartão de Crédito",
};

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
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

  const [spendingRefreshKey, setSpendingRefreshKey] = useState(0);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  // Income form state
  const [newIncomeName, setNewIncomeName] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  const [editIncomeId, setEditIncomeId] = useState<number | null>(null);
  const [editIncomeName, setEditIncomeName] = useState("");
  const [editIncomeAmount, setEditIncomeAmount] = useState("");
  const [deleteIncomeId, setDeleteIncomeId] = useState<number | null>(null);

  // Expense form state
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseMethod, setNewExpenseMethod] = useState<PaymentMethod>("debit");
  const [newExpenseCatId, setNewExpenseCatId] = useState<number | null>(null);
  const [newExpenseCardId, setNewExpenseCardId] = useState<number | null>(null);
  const [editExpenseId, setEditExpenseId] = useState<number | null>(null);
  const [editExpenseName, setEditExpenseName] = useState("");
  const [editExpenseAmount, setEditExpenseAmount] = useState("");
  const [editExpenseMethod, setEditExpenseMethod] = useState<PaymentMethod>("debit");
  const [editExpenseCatId, setEditExpenseCatId] = useState<number | null>(null);
  const [editExpenseCardId, setEditExpenseCardId] = useState<number | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<number | null>(null);

  useEffect(() => {
    trpc.category.list.query({ profileId }).then((d) => setCategories(d as Category[]));
    trpc.creditCard.list.query({ profileId }).then((d) => setCreditCards(d as CreditCard[]));
  }, [profileId]);

  useEffect(() => {
    // Auto-launch templates for this month, then load entries
    trpc.autoLaunch.initMonth.mutate({ profileId, year, month }).then(() => {
      trpc.income.list.query({ profileId, year, month }).then((d) => setIncomeEntries(d as IncomeEntry[]));
      trpc.expense.list.query({ profileId, year, month }).then((d) => setExpenseEntries(d as ExpenseEntry[]));
    });
  }, [profileId, year, month]);

  function navigate(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  }

  // Income handlers
  async function addIncome(e: React.FormEvent) {
    e.preventDefault();
    if (!newIncomeName.trim() || !newIncomeAmount) return;
    const entry = await trpc.income.create.mutate({ profileId, year, month, name: newIncomeName.trim(), amountCents: Number(newIncomeAmount) });
    setIncomeEntries((prev) => [...prev, entry as IncomeEntry]);
    setNewIncomeName(""); setNewIncomeAmount("");
  }

  async function saveIncomeEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editIncomeId === null) return;
    const updated = await trpc.income.update.mutate({ id: editIncomeId, name: editIncomeName, amountCents: Number(editIncomeAmount) });
    setIncomeEntries((prev) => prev.map((e) => (e.id === editIncomeId ? (updated as IncomeEntry) : e)));
    setEditIncomeId(null);
  }

  async function deleteIncome(id: number) {
    await trpc.income.delete.mutate({ id });
    setIncomeEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleteIncomeId(null);
  }

  // Expense handlers
  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!newExpenseName.trim() || !newExpenseAmount) return;
    const entry = await trpc.expense.create.mutate({
      profileId, year, month,
      name: newExpenseName.trim(),
      amountCents: Number(newExpenseAmount),
      paymentMethod: newExpenseMethod,
      categoryId: newExpenseCatId,
      creditCardId: newExpenseMethod === "credit_card" ? newExpenseCardId : null,
    });
    setExpenseEntries((prev) => [...prev, entry as ExpenseEntry]);
    setNewExpenseName(""); setNewExpenseAmount(""); setNewExpenseMethod("debit"); setNewExpenseCatId(null); setNewExpenseCardId(null);
    setSpendingRefreshKey((k) => k + 1);
  }

  async function saveExpenseEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editExpenseId === null) return;
    const updated = await trpc.expense.update.mutate({
      id: editExpenseId,
      name: editExpenseName,
      amountCents: Number(editExpenseAmount),
      paymentMethod: editExpenseMethod,
      categoryId: editExpenseCatId,
      creditCardId: editExpenseMethod === "credit_card" ? editExpenseCardId : null,
    });
    setExpenseEntries((prev) => prev.map((e) => (e.id === editExpenseId ? (updated as ExpenseEntry) : e)));
    setEditExpenseId(null);
    setSpendingRefreshKey((k) => k + 1);
  }

  async function deleteExpense(id: number) {
    await trpc.expense.delete.mutate({ id });
    setExpenseEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleteExpenseId(null);
    setSpendingRefreshKey((k) => k + 1);
  }

  const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amountCents, 0);
  const totalExpenses = expenseEntries.reduce((sum, e) => sum + e.amountCents, 0);
  const balance = totalIncome - totalExpenses;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">← Anterior</button>
        <h2 className="text-xl font-semibold">{MONTH_NAMES[month - 1]} {year}</h2>
        <button onClick={() => navigate(1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Próximo →</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 rounded-lg border p-4 text-center text-sm">
        <div><div className="text-muted-foreground">Receitas</div><div className="text-lg font-semibold text-green-600">{formatBRL(totalIncome)}</div></div>
        <div><div className="text-muted-foreground">Despesas</div><div className="text-lg font-semibold text-red-600">{formatBRL(totalExpenses)}</div></div>
        <div><div className="text-muted-foreground">Saldo</div><div className={`text-lg font-semibold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>{formatBRL(balance)}</div></div>
      </div>

      {/* Income section */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Receitas</h3>
        <ul className="space-y-2">
          {incomeEntries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between rounded-md border px-4 py-2">
              <span className="flex items-center gap-2">
                {entry.name}
                {entry.recurringIncomeId && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">↺ Recorrente</span>}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-green-600">{formatBRL(entry.amountCents)}</span>
                <button onClick={() => { setEditIncomeId(entry.id); setEditIncomeName(entry.name); setEditIncomeAmount(String(entry.amountCents)); }} className="text-xs text-muted-foreground underline">Editar</button>
                <button onClick={() => setDeleteIncomeId(entry.id)} className="text-xs text-destructive underline">Excluir</button>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={addIncome} className="mt-4 flex gap-2">
          <input value={newIncomeName} onChange={(e) => setNewIncomeName(e.target.value)} placeholder="Descrição" className="flex-1 rounded-md border px-3 py-2 text-sm" />
          <input value={newIncomeAmount} onChange={(e) => setNewIncomeAmount(e.target.value)} placeholder="Centavos" type="number" min="0" className="w-32 rounded-md border px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Adicionar</button>
        </form>
      </section>

      {/* Expense section */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Despesas</h3>
        <ul className="space-y-2">
          {expenseEntries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between rounded-md border px-4 py-2">
              <div>
                <div className="flex items-center gap-2">
                  {entry.name}
                  {entry.fixedExpenseId && <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">↺ Fixo</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {PAYMENT_LABELS[entry.paymentMethod as PaymentMethod]}
                  {entry.categoryId && ` · ${categories.find((c) => c.id === entry.categoryId)?.name}`}
                  {entry.creditCardId && ` · ${creditCards.find((c) => c.id === entry.creditCardId)?.name}`}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-red-600">{formatBRL(entry.amountCents)}</span>
                <button onClick={() => {
                  setEditExpenseId(entry.id); setEditExpenseName(entry.name); setEditExpenseAmount(String(entry.amountCents));
                  setEditExpenseMethod(entry.paymentMethod as PaymentMethod); setEditExpenseCatId(entry.categoryId); setEditExpenseCardId(entry.creditCardId);
                }} className="text-xs text-muted-foreground underline">Editar</button>
                <button onClick={() => setDeleteExpenseId(entry.id)} className="text-xs text-destructive underline">Excluir</button>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={addExpense} className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input value={newExpenseName} onChange={(e) => setNewExpenseName(e.target.value)} placeholder="Descrição" className="flex-1 rounded-md border px-3 py-2 text-sm" />
            <input value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} placeholder="Centavos" type="number" min="0" className="w-32 rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <select value={newExpenseMethod} onChange={(e) => setNewExpenseMethod(e.target.value as PaymentMethod)} className="flex-1 rounded-md border px-3 py-2 text-sm">
              {Object.entries(PAYMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={newExpenseCatId ?? ""} onChange={(e) => setNewExpenseCatId(e.target.value ? Number(e.target.value) : null)} className="flex-1 rounded-md border px-3 py-2 text-sm">
              <option value="">Categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {newExpenseMethod === "credit_card" && (
              <select value={newExpenseCardId ?? ""} onChange={(e) => setNewExpenseCardId(e.target.value ? Number(e.target.value) : null)} className="flex-1 rounded-md border px-3 py-2 text-sm">
                <option value="">Cartão</option>
                {creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Adicionar</button>
          </div>
        </form>
      </section>

      {/* Category spending table */}
      <CategorySpendingTable
        profileId={profileId}
        year={year}
        month={month}
        categories={categories}
        refreshKey={spendingRefreshKey}
      />

      {/* Income dialogs */}
      {editIncomeId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <form onSubmit={saveIncomeEdit} className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Editar receita</h2>
            <input autoFocus value={editIncomeName} onChange={(e) => setEditIncomeName(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
            <input value={editIncomeAmount} onChange={(e) => setEditIncomeAmount(e.target.value)} type="number" min="0" className="rounded-md border px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditIncomeId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Salvar</button>
            </div>
          </form>
        </div>
      )}
      {deleteIncomeId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir receita?</h2>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteIncomeId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => deleteIncome(deleteIncomeId)} className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Expense dialogs */}
      {editExpenseId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <form onSubmit={saveExpenseEdit} className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Editar despesa</h2>
            <input autoFocus value={editExpenseName} onChange={(e) => setEditExpenseName(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
            <input value={editExpenseAmount} onChange={(e) => setEditExpenseAmount(e.target.value)} type="number" min="0" className="rounded-md border px-3 py-2 text-sm" />
            <select value={editExpenseMethod} onChange={(e) => setEditExpenseMethod(e.target.value as PaymentMethod)} className="rounded-md border px-3 py-2 text-sm">
              {Object.entries(PAYMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={editExpenseCatId ?? ""} onChange={(e) => setEditExpenseCatId(e.target.value ? Number(e.target.value) : null)} className="rounded-md border px-3 py-2 text-sm">
              <option value="">Categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {editExpenseMethod === "credit_card" && (
              <select value={editExpenseCardId ?? ""} onChange={(e) => setEditExpenseCardId(e.target.value ? Number(e.target.value) : null)} className="rounded-md border px-3 py-2 text-sm">
                <option value="">Cartão</option>
                {creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditExpenseId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Salvar</button>
            </div>
          </form>
        </div>
      )}
      {deleteExpenseId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir despesa?</h2>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteExpenseId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => deleteExpense(deleteExpenseId)} className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
