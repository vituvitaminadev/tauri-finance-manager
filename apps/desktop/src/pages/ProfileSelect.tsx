import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useProfile, type Profile } from "../context/profile";
import { useTheme } from "../context/theme";

export function ProfileSelectPage() {
  const { setActiveProfile } = useProfile();
  const { setTheme } = useTheme();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Load profiles on mount, retrying until server is ready
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 20;
    const RETRY_DELAY = 500;

    function tryLoad() {
      trpc.profile.list.query().then((data) => {
        if (cancelled) return;
        setProfiles(data as Profile[]);
        setLoading(false);
      }).catch(() => {
        if (cancelled) return;
        attempts++;
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(tryLoad, RETRY_DELAY);
        } else {
          setError("Não foi possível conectar ao servidor. Verifique se ele está rodando.");
          setLoading(false);
        }
      });
    }

    tryLoad();
    return () => { cancelled = true; };
  }, []);

  function enterProfile(profile: Profile) {
    setActiveProfile(profile);
    setTheme(profile.theme);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const profile = await trpc.profile.create.mutate({ name: newName.trim() });
    setProfiles((prev) => [...prev, profile as Profile]);
    setNewName("");
    setCreating(false);
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (renameId === null || !renameName.trim()) return;
    const updated = await trpc.profile.rename.mutate({ id: renameId, name: renameName.trim() });
    setProfiles((prev) =>
      prev.map((p) => (p.id === renameId ? (updated as Profile) : p))
    );
    setRenameId(null);
    setRenameName("");
  }

  async function handleDelete(id: number) {
    await trpc.profile.delete.mutate({ id });
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); trpc.profile.list.query().then((data) => { setProfiles(data as Profile[]); setLoading(false); }).catch(() => { setError("Não foi possível conectar ao servidor."); setLoading(false); }); }}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">Finance Manager</h1>

      {profiles.length === 0 ? (
        <p className="text-muted-foreground">Crie seu primeiro perfil para começar.</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {profiles.map((profile) => (
            <div key={profile.id} className="flex flex-col items-center gap-2">
              <button
                onClick={() => enterProfile(profile)}
                className="flex h-32 w-32 flex-col items-center justify-center rounded-lg bg-card text-card-foreground shadow-md transition hover:ring-2 hover:ring-primary"
              >
                <User className="h-10 w-10" />
                <span className="mt-2 text-sm font-medium">{profile.name}</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => { setRenameId(profile.id); setRenameName(profile.name); }}
                  className="text-xs text-muted-foreground underline"
                >
                  Renomear
                </button>
                <button
                  onClick={() => setDeleteId(profile.id)}
                  className="text-xs text-destructive underline"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create profile */}
      {creating ? (
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do perfil"
            className="rounded-md border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Criar
          </button>
          <button type="button" onClick={() => setCreating(false)} className="rounded-md px-4 py-2 text-sm">
            Cancelar
          </button>
        </form>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="rounded-md border px-6 py-3 text-sm hover:bg-accent"
        >
          + Adicionar perfil
        </button>
      )}

      {/* Rename dialog */}
      {renameId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <form
            onSubmit={handleRename}
            className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold">Renomear perfil</h2>
            <input
              autoFocus
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setRenameId(null)} className="px-4 py-2 text-sm">
                Cancelar
              </button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir perfil?</h2>
            <p className="text-sm text-muted-foreground">
              Todos os dados associados serão removidos permanentemente.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm">
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
