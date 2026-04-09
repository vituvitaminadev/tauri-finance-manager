import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { useProfile } from "../context/profile";

interface Category {
  id: number;
  profileId: number;
  name: string;
}

interface CreditCard {
  id: number;
  profileId: number;
  name: string;
}

export function SettingsPage() {
  const { activeProfile } = useProfile();
  const profileId = activeProfile!.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCardName, setNewCardName] = useState("");
  const [renameCatId, setRenameCatId] = useState<number | null>(null);
  const [renameCatName, setRenameCatName] = useState("");
  const [renameCardId, setRenameCardId] = useState<number | null>(null);
  const [renameCardName, setRenameCardName] = useState("");
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null);
  const [deleteCardId, setDeleteCardId] = useState<number | null>(null);

  useEffect(() => {
    trpc.category.list.query({ profileId }).then((data) => setCategories(data as Category[]));
    trpc.creditCard.list.query({ profileId }).then((data) => setCreditCards(data as CreditCard[]));
  }, [profileId]);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const cat = await trpc.category.create.mutate({ profileId, name: newCatName.trim() });
    setCategories((prev) => [...prev, cat as Category]);
    setNewCatName("");
  }

  async function renameCategory(e: React.FormEvent) {
    e.preventDefault();
    if (renameCatId === null) return;
    const updated = await trpc.category.rename.mutate({ id: renameCatId, name: renameCatName });
    setCategories((prev) => prev.map((c) => (c.id === renameCatId ? (updated as Category) : c)));
    setRenameCatId(null);
  }

  async function deleteCategory(id: number) {
    await trpc.category.delete.mutate({ id });
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeleteCatId(null);
  }

  async function createCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newCardName.trim()) return;
    const card = await trpc.creditCard.create.mutate({ profileId, name: newCardName.trim() });
    setCreditCards((prev) => [...prev, card as CreditCard]);
    setNewCardName("");
  }

  async function renameCard(e: React.FormEvent) {
    e.preventDefault();
    if (renameCardId === null) return;
    const updated = await trpc.creditCard.rename.mutate({ id: renameCardId, name: renameCardName });
    setCreditCards((prev) => prev.map((c) => (c.id === renameCardId ? (updated as CreditCard) : c)));
    setRenameCardId(null);
  }

  async function deleteCard(id: number) {
    await trpc.creditCard.delete.mutate({ id });
    setCreditCards((prev) => prev.filter((c) => c.id !== id));
    setDeleteCardId(null);
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
                <button
                  onClick={() => { setRenameCatId(cat.id); setRenameCatName(cat.name); }}
                  className="text-xs text-muted-foreground underline"
                >
                  Renomear
                </button>
                <button
                  onClick={() => setDeleteCatId(cat.id)}
                  className="text-xs text-destructive underline"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={createCategory} className="mt-4 flex gap-2">
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nova categoria"
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Adicionar
          </button>
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
                <button
                  onClick={() => { setRenameCardId(card.id); setRenameCardName(card.name); }}
                  className="text-xs text-muted-foreground underline"
                >
                  Renomear
                </button>
                <button
                  onClick={() => setDeleteCardId(card.id)}
                  className="text-xs text-destructive underline"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={createCard} className="mt-4 flex gap-2">
          <input
            value={newCardName}
            onChange={(e) => setNewCardName(e.target.value)}
            placeholder="Novo cartão"
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Adicionar
          </button>
        </form>
      </section>

      {/* Rename category dialog */}
      {renameCatId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <form onSubmit={renameCategory} className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Renomear categoria</h2>
            <input
              autoFocus
              value={renameCatName}
              onChange={(e) => setRenameCatName(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRenameCatId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete category dialog */}
      {deleteCatId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir categoria?</h2>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteCatId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => deleteCategory(deleteCatId)} className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename card dialog */}
      {renameCardId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <form onSubmit={renameCard} className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Renomear cartão</h2>
            <input
              autoFocus
              value={renameCardName}
              onChange={(e) => setRenameCardName(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRenameCardId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete card dialog */}
      {deleteCardId !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col gap-4 rounded-lg bg-background p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Excluir cartão?</h2>
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteCardId(null)} className="px-4 py-2 text-sm">Cancelar</button>
              <button onClick={() => deleteCard(deleteCardId)} className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
