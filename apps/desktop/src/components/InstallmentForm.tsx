import { useState } from "react";
import { trpc } from "../lib/trpc";
import { useProfile } from "../context/profile";
import { CurrencyInput } from "./CurrencyInput";

interface Category { id: number; name: string; }
interface CreditCard { id: number; name: string; }

interface Props {
  categories: Category[];
  creditCards: CreditCard[];
  currentYear: number;
  currentMonth: number;
  onCreated: () => void;
  onClose: () => void;
}

export function InstallmentForm({ categories, creditCards, currentYear, currentMonth, onCreated, onClose }: Props) {
  const { activeProfile } = useProfile();
  const profileId = activeProfile!.id;

  const [name, setName] = useState("");
  const [totalCents, setTotalCents] = useState<number | undefined>(undefined);
  const [installments, setInstallments] = useState("12");
  const [startYear, setStartYear] = useState(String(currentYear));
  const [startMonth, setStartMonth] = useState(String(currentMonth));
  const [cardId, setCardId] = useState<number | null>(null);
  const [catId, setCatId] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !totalCents || !installments) return;
    await trpc.installment.create.mutate({
      profileId,
      name: name.trim(),
      totalAmountCents: totalCents,
      installments: Number(installments),
      startYear: Number(startYear),
      startMonth: Number(startMonth),
      creditCardId: cardId ?? undefined,
      categoryId: catId ?? undefined,
    });
    onCreated();
    onClose();
  }

  const perInstallment = totalCents && installments
    ? Math.round(totalCents / Number(installments))
    : 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <form onSubmit={handleSubmit} className="flex w-96 flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Nova compra parcelada</h2>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do produto" className="rounded-md border px-3 py-2 text-sm" autoFocus />

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">Total</label>
            <CurrencyInput value={totalCents} onChange={setTotalCents} placeholder="R$ 0,00" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="w-24">
            <label className="mb-1 block text-xs text-muted-foreground">Parcelas</label>
            <input value={installments} onChange={(e) => setInstallments(e.target.value)} type="number" min="1" max="60" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>

        {perInstallment > 0 && (
          <p className="text-xs text-muted-foreground">
            {installments}x de {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(perInstallment / 100)}
          </p>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">Início — Mês</label>
            <input value={startMonth} onChange={(e) => setStartMonth(e.target.value)} type="number" min="1" max="12" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted-foreground">Ano</label>
            <input value={startYear} onChange={(e) => setStartYear(e.target.value)} type="number" min="2020" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>

        <select value={cardId ?? ""} onChange={(e) => setCardId(e.target.value ? Number(e.target.value) : null)} className="rounded-md border px-3 py-2 text-sm">
          <option value="">Cartão de crédito (opcional)</option>
          {creditCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={catId ?? ""} onChange={(e) => setCatId(e.target.value ? Number(e.target.value) : null)} className="rounded-md border px-3 py-2 text-sm">
          <option value="">Categoria (opcional)</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm">Cancelar</button>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Criar</button>
        </div>
      </form>
    </div>
  );
}
