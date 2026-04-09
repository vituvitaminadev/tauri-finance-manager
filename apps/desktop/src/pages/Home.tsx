import { useTheme } from "../context/theme";

export function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Finance Manager</h1>
      <p className="text-muted-foreground">
        Selecione um perfil para começar.
      </p>
      <button
        onClick={toggleTheme}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Tema atual: {theme === "dark" ? "Escuro" : "Claro"}
      </button>
    </div>
  );
}
