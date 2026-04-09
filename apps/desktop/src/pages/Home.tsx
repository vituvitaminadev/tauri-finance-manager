import { useState } from "react";
import { useProfile } from "../context/profile";
import { useTheme } from "../context/theme";
import { trpc } from "../lib/trpc";
import { SettingsPage } from "./Settings";
import { MonthlyView } from "./MonthlyView";
import { InvestmentsPage } from "./Investments";
import { Dashboard } from "./Dashboard";

type Tab = "monthly" | "dashboard" | "investments" | "settings";

export function HomePage() {
  const { activeProfile, setActiveProfile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>("monthly");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  function navigate(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  }

  async function handleToggleTheme() {
    if (!activeProfile) return;
    const newTheme = theme === "light" ? "dark" : "light";
    toggleTheme();
    await trpc.profile.setTheme.mutate({ id: activeProfile.id, theme: newTheme });
    setActiveProfile({ ...activeProfile, theme: newTheme });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "monthly", label: "Mensal" },
    { key: "dashboard", label: "Dashboard" },
    { key: "investments", label: "Investimentos" },
    { key: "settings", label: "Configurações" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-lg font-semibold">Finance Manager</h1>
        <nav className="flex items-center gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${tab === t.key ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button onClick={handleToggleTheme} className="rounded-md bg-secondary px-3 py-1.5 text-sm">
            {theme === "dark" ? "🌙 Escuro" : "☀️ Claro"}
          </button>
          {activeProfile && (
            <button onClick={() => setActiveProfile(null)} className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
              <span>👤</span>
              <span>{activeProfile.name}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {tab === "settings" ? (
          <SettingsPage />
        ) : tab === "investments" ? (
          <InvestmentsPage />
        ) : tab === "dashboard" ? (
          <Dashboard year={year} month={month} onNavigate={navigate} />
        ) : (
          <MonthlyView year={year} month={month} onNavigate={navigate} />
        )}
      </main>
    </div>
  );
}
