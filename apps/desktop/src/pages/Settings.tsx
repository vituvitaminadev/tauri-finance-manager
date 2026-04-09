import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { useProfile } from "../context/profile";

interface Category { id: number; name: string; }
interface CreditCard { id: number; name: string; }
interface CategoryItem { id: number; profileId: number; name: string; }
interface CreditCardItem { id: number; profileId: number; name: string; }
interface RecurringIncomeTemplate { id: number; name: string; amountCents: number; active: boolean; }
interface FixedExpenseTemplate { id: number; name: string; amountCents: number; paymentMethod: string; categoryId: number | null; creditCardId: number | null; active: boolean; }

type PaymentMethod = "debit" | "pix" | "boleto" | "cash" | "credit_card";
const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  debit: "Débito", pix: "PIX", boleto: "Boleto", cash: "Dinheiro", credit_card: "Cartão de Crédito",
};

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function SettingsPage() {
  const { activeProfile } = useProfile();
  const profileId = activeProfile!.id;

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardItem[]>([]);
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncomeTemplate[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseTemplate[]>([]);

  // Category state
  const [newCatName, setNewCatName] = useState("");
  const [renameCatId, setRenameCatId] = useState<number | null>(null);
  const [renameCatName, setRenameCatName] = useState("");
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null);

  // Credit card state
  const [newCardName, setNewCardName] = useState("");
  const [renameCardId, setRenameCardId] = useState<number | null>(null);
  const [renameCardName, setRenameCardName] = useState("");
  const [deleteCardId, setDeleteCardId] = useState<number | null>(null);

  // Recurring income state
  const [newRIName, setNewRIName] = useState("");
  const [newRIAmount, setNewRIAmount] = useState("");
  const [deleteRIId, setDeleteRIId] = useState<number | null>(null);

  // Fixed expense state
  const [newFEName, setNewFEName] = useState("");
  const [newFEAmount, setNewFEAmount] = useState("");
  const [newFEMethod, setNewFEMethod] = useState<PaymentMethod>("debit");
  const [newFECatId, setNewFECatId] = useState<number | null>(null);
  const [newFECardId, setNewFECardId] = useState<number | null>(null);
  const [deleteFEId, setDeleteFEId] = useState<number | null>(null);

  useEffect(() => {
    trpc.category.list.query({ profileId }).then((d) => setCategories(d as CategoryItem[]));
    trpc.creditCard.list.query({ profileId }).then((d) => setCreditCards(d as CreditCardItem[]));
    trpc.recurringIncome.list.query({ profileId }).then((d) => setRecurringIncomes(d as RecurringIncomeTemplate[]));
    trpc.fixedExpense.list.query({ profileId }).then((d) => setFixedExpenses(d as FixedExpenseTemplate[]));
  }, [profileId]);

  // Category handlers
  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const cat = await trpc.category.create.mutate({ profileId, name: newCatName.trim() });
    setCategories((prev) => [...prev, cat as CategoryItem]);
    setNewCatName("");
  }
  async function renameCategory(e: React.FormEvent) {
    e.preventDefault();
    if (renameCatId === null) return;
    const updated = await trpc.category.rename.mutate({ id: renameCatId, name: renameCatName });
    setCategories((prev) => prev.map((c) => (c.id === renameCatId ? (updated as CategoryItem) : c)));
    setRenameCatId(null);
  }
  async function deleteCategory(id: number) {
    await trpc.category.delete.mutate({ id });
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteCatId(null);
  }

  // Credit card handlers
  async function createCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newCardName.trim()) return;
    const card = await trpc.creditCard.create.mutate({ profileId, name: newCardName.trim() });
    setCreditCards((prev) => [...prev, card as CreditCardItem]);
    setNewCardName("");
  }
  async function renameCard(e: React.FormEvent) {
    e.preventDefault();
    if (renameCardId === null) return;
    const updated = await trpc.creditCard.rename.mutate({ id: renameCardId, name: renameCardName });
    setCreditCards((prev) => prev.map((c) => (c.id === renameCardId ? (updated as CreditCardItem) : c)));
    setRenameCardId(null);
  }
  async function deleteCard(id: number) {
    await trpc.creditCard.delete.mutate({ id });
    setCreditCards((prev) => prev.filter((c) => c.id !== id));
    setDeleteCardId(null);
  }

  // Recurring income handlers
  async function createRI(e: React.FormEvent) {
    e.preventDefault();
    if (!newRIName.trim() || !newRIAmount) return;
    const t = await trpc.recurringIncome.create.mutate({ profileId, name: newRIName.trim(), amountCents: Number(newRIAmount) });
    setRecurringIncomes((prev) => [...prev, t as RecurringIncomeTemplate]);
    setNewRIName(""); setNewRIAmount("");
  }
  async function deactivateRI(id: number) {
    const updated = await trpc.recurringIncome.deactivate.mutate({ id });
    setRecurringIncomes((prev) => prev.map((t) => t.id === id ? (updated as RecurringIncomeTemplate) : t));
  }
  async function deleteRI(id: number) {
    await trpc.recurringIncome.delete.mutate({ id });
    setRecurringIncomes((prev) => prev.filter((t) => t.id !== id));
    setDeleteRIId(null);
  }

  // Fixed expense handlers
  async function createFE(e: React.FormEvent) {
    e.preventDefault();
    if (!newFEName.trim() || !newFEAmount) return;
    const t = await trpc.fixedExpense.create.mutate({ profileId, name: newFEName.trim(), amountCents: Number(newFEAmount), paymentMethod: newFEMethod, categoryId: newFECatId });
    setFixedExpenses((prev) => [...prev, t as FixedExpenseTemplate]);
    setNewFEName(""); setNewFEAmount(""); setNewFEMethod("debit"); setNewFECatId(null); setNewFECardId(null);
  }
  async function deactivateFE(id: number) {
    const updated = await trpc.fixedExpense.deactivate.mutate({ id });
    setFixedExpenses((prev) => prev.map((t) => t.id === id ? (updated as FixedExpenseTemplate) : t));
  }
  async function deleteFE(id: number) {
    await trpc.fixedExpense.delete.mutate({ id });
    setFixedExpenses((prev) => prev.filter((t) => t.id !== id));
    setDeleteFEId(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10 p-8">
      <h2 className="text-2xl font-bold">Configurações</h2>

      {/* Categories */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Categorias</h3>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between rounded-md border px-4 py-2">
              <span>{cat.name}</span>
              <div className="flex gap-2">
                <button onClick={() => { setRenameCatId(cat.id); setRenameCatName(cat.name); }} className="text-xs text-muted-foreground underline">Renomear</button>
                <button onClick={() => setDeleteCatId(cat.id)} className="text-xs text-destructive underline">Excluir</button>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={createCategory} className="mt-4 flex gap-2">
          <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nova categoria" className="flex-1 rounded-md border px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Adicionar</button>
        </form>
      </section>

      {/* Credit Cards */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Cartões de Crédito</h3>
        <ul className="space-y-2">
          {creditCards.map((card) => (
            <li key={card.id} className="flex items-center justify-between rounded-md border px-4 py-2">
              <span>{card.name}</span>
              <div className="flex gap-2">
                <button onClick={() => { setRenameCardId(card.id); setRenameCardName(card.name); }} className="text-xs text-muted-foreground underline">Renomear</button>
                <button onClick={() => setDeleteCardId(card.id)} className="text-xs text-destructive underline">Excluir</button>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={createCard} className="mt-4 flex gap-2">
          <input value={newCardName} onChange={(e) => setNewCardName(e.target.value)} placeholder="Novo cartão" className="flex-1 rounded-md border px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Adicionar</button>
        </form>
      </section>

      {/* Recurring Income */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Entradas Recorrentes</h3>
        <ul className="space-y-2">
          {recurringIncomes.map((t) => (
            <li key={t.id} className={`flex items-center justify-between rounded-md border px-4 py-2 ${!t.active ? "opacity-50" : ""}`}>
              <div>
                <div>{t.name}</div>
                <div className="text-xs text-muted-foreground">{formatBRL(t.amountCents)} {!t.active && "· Inativo"}</div>
              </div>
              <div className="flex gap-2">
                {t.active && <button onClick={() => deactivateRI(t.id)} className="text-xs text-muted-foreground underline">Desativar</button>}
                <button onClick={() => setDeleteRIId(t.id)} className="text-xs text-destructive underline">Excluir</button>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={createRI} className="mt-4 flex gap-2">
          <input value={newRIName} onChange={(e) => setNewRIName(e.target.value)} placeholder="Nome" className="flex-1 rounded-md border px-3 py-2 text-sm" />
          <input value={newRIAmount} onChange={(e) => setNewRIAmount(e.target.value)} placeholder="Centavos" type="number" min="0" className="w-32 rounded-md border px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Adicionar</button>
        </form>
      </section>

      {/* Fixed Expenses */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Despesas Fixas</h3>
        <ul className="space-y-2">
          {fixedExpenses.map((t) => (
            <li key={t.id} className={`flex items-center justify-between rounded-md border px-4 py-2 ${!t.active ? "opacity-50" : ""}`}>
              <div>
                <div>{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatBRL(t.amountCents)} · {PAYMENT_LABELS[t.paymentMethod as PaymentMethod]}
                  {t.categoryId && ` · ${categories.find((c) => c.id === t.categoryId)?.name}`}
                  {!t.active && " · Inativo"}
                </div>
              </div>
              <div className="flex gap-2">
                {t.active && <button onClick={() => deactivateFE(t.id)} className="text-xs text-muted-foreground underline">Desativar</button>}
                <button onClick={() => setDeleteFEId(t.id)} className="text-xs text-destructive underline">Excluir</button>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={createFE} className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input value={newFEName} onChange={(e) => setNewFEName(e.target.value)} placeholder="Nome" className="flex-1 rounded-md border px-3 py-2 text-sm" />
            <input value={newFEAmount} onChange={(e) => setNewFEAmount(e.target.value)} placeholder="Centavos" type="number" min="0" className="w-32 rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <select value={newFEMethod} onChange={(e) => setNewFEMethod(e.target.value as PaymentMethod)} className="flex-1 rounded-md border px-3 py-2 text-sm">
              {Object.entries(PAYMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={newFECatId ?? ""} onChange={(e) => setNewFECatId(e.target.value ? Number(e.target.value) : null)} className="flex-1 rounded-md border px-3 py-2 text-sm">
              <option value="">Categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {newFEMethod === "credit_card" && (
              <select value={newFECardId ?? ""} onChange={(e) => setNewFECardId(e.target.value ? Number(e.target.value) : null)} className="flex-1 rounded-md border px-3 py-2 text-sm">
                <option value="">Cartão</option>
                {creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Adicionar</button>
          </div>
        </form>
      </section>

      {/* Dialogs */}
      {renameCatId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <form onSubmit={renameCategory} className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Renomear categoria</h2>
            <input autoFocus value={renameCatName} onChange={(e) => setRenameCatName(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRenameCatId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Salvar</button>
            </div>
          </form>
        </div>
      )}
      {deleteCatId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir categoria?</h2>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteCatId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => deleteCategory(deleteCatId)} className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground">Excluir</button>
            </div>
          </div>
        </div>
      )}
      {renameCardId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <form onSubmit={renameCard} className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Renomear cartão</h2>
            <input autoFocus value={renameCardName} onChange={(e) => setRenameCardName(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRenameCardId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Salvar</button>
            </div>
          </form>
        </div>
      )}
      {deleteCardId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir cartão?</h2>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteCardId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => deleteCard(deleteCardId)} className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground">Excluir</button>
            </div>
          </div>
        </div>
      )}
      {deleteRIId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir entrada recorrente?</h2>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteRIId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => deleteRI(deleteRIId)} className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground">Excluir</button>
            </div>
          </div>
        </div>
      )}
      {deleteFEId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir despesa fixa?</h2>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteFEId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => deleteFE(deleteFEId)} className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
