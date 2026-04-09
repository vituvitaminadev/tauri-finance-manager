import { useState } from "react";
import { useProfile } from "../context/profile";
import { useTheme } from "../context/theme";
import { trpc } from "../lib/trpc";
import { SettingsPage } from "./Settings";

export function HomePage() {
  const { activeProfile, setActiveProfile } = useProfile();
  const { theme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  async function handleToggleTheme() {
    if (!activeProfile) return;
    const newTheme = theme === "light" ? "dark" : "light";
    toggleTheme();
    await trpc.profile.setTheme.mutate({ id: activeProfile.id, theme: newTheme });
    setActiveProfile({ ...activeProfile, theme: newTheme });
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-lg font-semibold">Finance Manager</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Configurações
          </button>
          <button
            onClick={handleToggleTheme}
            className="rounded-md bg-secondary px-3 py-1.5 text-sm"
          >
            {theme === "dark" ? "🌙 Escuro" : "☀️ Claro"}
          </button>
          {activeProfile && (
            <button
              onClick={() => setActiveProfile(null)}
              className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              <span>👤</span>
              <span>{activeProfile.name}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {showSettings ? (
          <SettingsPage />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <p className="text-muted-foreground">
              Bem-vindo, {activeProfile?.name}!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
