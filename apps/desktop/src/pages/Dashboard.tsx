import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";
import { trpc } from "../lib/trpc";
import { useProfile } from "../context/profile";

interface DashboardData {
  totalIncomeCents: number;
  totalExpensesCents: number;
  netBalanceCents: number;
  expensesByPaymentMethod: { paymentMethod: string; totalCents: number }[];
  expensesByCategory: { categoryId: number; totalCents: number }[];
  investmentContributions: { goalId: number; totalCents: number }[];
}

interface Category { id: number; name: string; }
interface Goal { id: number; name: string; }

const PAYMENT_LABELS: Record<string, string> = {
  debit: "Débito", pix: "PIX", boleto: "Boleto", cash: "Dinheiro", credit_card: "Cartão",
};

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#a855f7"];

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Props {
  year: number;
  month: number;
  onNavigate: (delta: number) => void;
}

export function Dashboard({ year, month, onNavigate }: Props) {
  const { activeProfile } = useProfile();
  const profileId = activeProfile!.id;

  const [data, setData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    trpc.category.list.query({ profileId }).then((d) => setCategories(d as Category[]));
    trpc.investment.listGoals.query({ profileId }).then((d) => setGoals(d as Goal[]));
  }, [profileId]);

  useEffect(() => {
    trpc.dashboard.monthly.query({ profileId, year, month }).then((d) => setData(d as DashboardData));
  }, [profileId, year, month]);

  if (!data) return <div className="flex items-center justify-center p-8"><p className="text-muted-foreground">Carregando...</p></div>;

  const incomeSpentPct = data.totalIncomeCents > 0
    ? Math.round((data.totalExpensesCents / data.totalIncomeCents) * 100)
    : 0;

  const pieIncomeData = data.totalIncomeCents > 0 ? [
    { name: "Gasto", value: Math.min(data.totalExpensesCents, data.totalIncomeCents) },
    { name: "Disponível", value: Math.max(0, data.totalIncomeCents - data.totalExpensesCents) },
  ] : [];

  const pieMethodData = data.expensesByPaymentMethod.map((r) => ({
    name: PAYMENT_LABELS[r.paymentMethod] ?? r.paymentMethod,
    value: r.totalCents,
  }));

  const pieCategoryData = data.expensesByCategory.map((r) => ({
    name: categories.find((c) => c.id === r.categoryId)?.name ?? `Cat ${r.categoryId}`,
    value: r.totalCents,
  }));

  const investBarData = data.investmentContributions.map((r) => ({
    name: goals.find((g) => g.id === r.goalId)?.name ?? `Meta ${r.goalId}`,
    value: r.totalCents / 100,
  }));

  return (
    <div className="space-y-8 p-8">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => onNavigate(-1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">← Anterior</button>
        <h2 className="text-xl font-semibold">{MONTH_NAMES[month - 1]} {year}</h2>
        <button onClick={() => onNavigate(1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Próximo →</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-muted-foreground">Receitas</div>
          <div className="text-2xl font-bold text-green-600">{formatBRL(data.totalIncomeCents)}</div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-muted-foreground">Despesas</div>
          <div className="text-2xl font-bold text-red-600">{formatBRL(data.totalExpensesCents)}</div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-muted-foreground">Saldo</div>
          <div className={`text-2xl font-bold ${data.netBalanceCents >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatBRL(data.netBalanceCents)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-8">
        {/* Chart 1: % income spent */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold">% da Renda Gasta</h3>
          {pieIncomeData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieIncomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    <Cell fill="#f43f5e" />
                    <Cell fill="#22c55e" />
                  </Pie>
                  <Tooltip formatter={(v) => formatBRL(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-center text-lg font-semibold">{incomeSpentPct}% gasto</p>
            </>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Sem receitas para este mês</p>
          )}
        </div>

        {/* Chart 2: % by payment method */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold">Despesas por Forma de Pagamento</h3>
          {pieMethodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {pieMethodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatBRL(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-16">Sem despesas</p>
          )}
        </div>

        {/* Chart 3: % by category */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold">Despesas por Categoria</h3>
          {pieCategoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieCategoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {pieCategoryData.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatBRL(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-16">Sem despesas com categoria</p>
          )}
        </div>

        {/* Chart 4: investment contributions */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold">Aportes do Mês por Meta</h3>
          {investBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={investBarData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v) => formatBRL(Number(v) * 100)} />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-16">Sem aportes neste mês</p>
          )}
        </div>
      </div>
    </div>
  );
}
