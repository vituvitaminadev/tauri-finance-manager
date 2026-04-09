import { useState, useEffect } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart,
} from "recharts";
import { trpc } from "../lib/trpc";
import { useProfile } from "../context/profile";

interface MonthRow { month: number; incomeCents: number; expensesCents: number; differenceCents: number; }
interface CategoryTotal { categoryId: number; totalCents: number; }
interface InvestRow { goalId: number; month: number; totalCents: number; }
interface Category { id: number; name: string; }
interface Goal { id: number; name: string; }

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

const MONTH_ABBR = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const COLORS = ["#6366f1", "#ec4899", "#22c55e", "#f97316", "#3b82f6", "#a855f7"];

export function AnnualOverview() {
  const { activeProfile } = useProfile();
  const profileId = activeProfile!.id;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<{
    totalIncomeCents: number;
    totalExpensesCents: number;
    netBalanceCents: number;
    months: MonthRow[];
    highestExpenseMonth: number | null;
    lowestExpenseMonth: number | null;
    topCategoryId: number | null;
    categoryTotals: CategoryTotal[];
    investmentByGoalMonth: InvestRow[];
  } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    trpc.category.list.query({ profileId }).then((d) => setCategories(d as Category[]));
    trpc.investment.listGoals.query({ profileId }).then((d) => setGoals(d as Goal[]));
  }, [profileId]);

  useEffect(() => {
    trpc.annualOverview.yearly.query({ profileId, year }).then((d) => setData(d as typeof data));
  }, [profileId, year]);

  if (!data) return <div className="flex items-center justify-center p-8"><p className="text-muted-foreground">Carregando...</p></div>;

  // Chart 1: income vs expenses by month
  const monthChartData = data.months.map((m) => ({
    name: MONTH_ABBR[m.month - 1],
    Receitas: m.incomeCents / 100,
    Despesas: m.expensesCents / 100,
  }));

  // Chart 2: investment contributions per goal per month
  const investChartData = MONTH_ABBR.map((name, i) => {
    const row: Record<string, number | string> = { name };
    goals.forEach((g) => {
      const entry = data.investmentByGoalMonth.find((r) => r.goalId === g.id && r.month === i + 1);
      row[g.name] = (entry?.totalCents ?? 0) / 100;
    });
    return row;
  });

  return (
    <div className="space-y-8 p-8">
      {/* Year selector */}
      <div className="flex items-center gap-4">
        <button onClick={() => setYear((y) => y - 1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">← {year - 1}</button>
        <h2 className="text-xl font-semibold">Visão Anual — {year}</h2>
        <button onClick={() => setYear((y) => y + 1)} className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">{year + 1} →</button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-muted-foreground">Receita Total</div>
          <div className="text-2xl font-bold text-green-600">{formatBRL(data.totalIncomeCents)}</div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-muted-foreground">Despesas Totais</div>
          <div className="text-2xl font-bold text-red-600">{formatBRL(data.totalExpensesCents)}</div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="text-sm text-muted-foreground">Saldo Anual</div>
          <div className={`text-2xl font-bold ${data.netBalanceCents >= 0 ? "text-green-600" : "text-red-600"}`}>{formatBRL(data.netBalanceCents)}</div>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground">Mês com maior gasto</div>
          <div className="mt-1 font-semibold">{data.highestExpenseMonth ? MONTH_ABBR[data.highestExpenseMonth - 1] : "—"}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground">Mês com menor gasto</div>
          <div className="mt-1 font-semibold">{data.lowestExpenseMonth ? MONTH_ABBR[data.lowestExpenseMonth - 1] : "—"}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-muted-foreground">Categoria com maior gasto</div>
          <div className="mt-1 font-semibold">
            {data.topCategoryId ? categories.find((c) => c.id === data.topCategoryId)?.name ?? "—" : "—"}
          </div>
        </div>
      </div>

      {/* Income vs Expenses chart */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-sm font-semibold">Receitas vs Despesas por Mês</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={monthChartData}>
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => `R$${v}`} />
            <Tooltip formatter={(v: number) => formatBRL(v * 100)} />
            <Legend />
            <Bar dataKey="Receitas" fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="Despesas" stroke="#f43f5e" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Mês</th>
              <th className="px-4 py-3 text-right">Receitas</th>
              <th className="px-4 py-3 text-right">Despesas</th>
              <th className="px-4 py-3 text-right">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {data.months.map((m) => (
              <tr key={m.month} className="border-t">
                <td className="px-4 py-2">{MONTH_ABBR[m.month - 1]}</td>
                <td className="px-4 py-2 text-right text-green-600">{formatBRL(m.incomeCents)}</td>
                <td className="px-4 py-2 text-right text-red-600">{formatBRL(m.expensesCents)}</td>
                <td className={`px-4 py-2 text-right font-medium ${m.differenceCents >= 0 ? "text-green-600" : "text-red-600"}`}>{formatBRL(m.differenceCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category spending breakdown */}
      {data.categoryTotals.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-right">Total Anual</th>
              </tr>
            </thead>
            <tbody>
              {[...data.categoryTotals].sort((a, b) => b.totalCents - a.totalCents).map((ct) => (
                <tr key={ct.categoryId} className="border-t">
                  <td className="px-4 py-2">{categories.find((c) => c.id === ct.categoryId)?.name ?? `Cat ${ct.categoryId}`}</td>
                  <td className="px-4 py-2 text-right">{formatBRL(ct.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Investment contributions chart */}
      {goals.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-4 text-sm font-semibold">Aportes por Meta ao Longo do Ano</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={investChartData}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v: number) => formatBRL(v * 100)} />
              <Legend />
              {goals.map((g, i) => (
                <Line key={g.id} type="monotone" dataKey={g.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
