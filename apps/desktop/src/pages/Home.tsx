import { useProfile } from "../context/profile";
import { useTheme } from "../context/theme";
import { trpc } from "../lib/trpc";

export function HomePage() {
  const { activeProfile, setActiveProfile } = useProfile();
  const { theme, toggleTheme } = useTheme();

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
      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          Bem-vindo, {activeProfile?.name}!
        </p>
      </main>
    </div>
  );
}
