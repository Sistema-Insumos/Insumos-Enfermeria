import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { StationerySupply } from "../types";

export function StationerySuppliesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StationerySupply | null>(null);
  const isAdmin = user?.role === "ADMIN";

  const itemsQuery = useQuery({
    queryKey: ["stationery-supplies", search],
    queryFn: async () => {
      const { data } = await api.get("/api/stationery-supplies", {
        params: { search, pageSize: 1000, sortBy: "name", sortDir: "asc" },
      });
      return data as { items: StationerySupply[]; total: number };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/stationery-supplies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stationery-supplies"] });
    },
    onError: () => {
      alert("No se pudo eliminar el insumo.");
    },
  });

  function handleDelete(item: StationerySupply) {
    if (confirm(`¿Eliminar el insumo de papelería "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  }

  const items = itemsQuery.data?.items ?? [];
  const lowStockCount = items.filter((i) => i.currentStock < i.minStock).length;

  return (
    <div>
      <p className="mb-2 text-sm text-on-surface-variant">
        <Link to="/equipamiento" className="hover:underline">
          Equipamiento
        </Link>{" "}
        / Papelería
      </p>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Papelería</h1>
          <p className="mt-1 text-on-surface-variant">
            Stock independiente para artículos de oficina (resmas, lápices, carpetas, etc.).
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:opacity-90"
        >
          <Plus size={18} />
          Agregar Insumo
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard label="Total de Insumos" value={String(itemsQuery.data?.total ?? "—")} />
        <StatCard
          label="Bajo Stock"
          value={String(lowStockCount)}
          tone={lowStockCount > 0 ? "danger" : "default"}
        />
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-md border border-outline-variant bg-surface-lowest px-3 py-2">
        <Search size={18} className="text-on-surface-variant" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o SKU..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Stock Actual</th>
              <th className="px-4 py-3 text-right">Stock Mínimo</th>
              <th className="px-4 py-3 text-right">Stock Máximo</th>
              {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-outline-variant hover:bg-surface-low">
                <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{item.sku}</td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{item.category}</td>
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    item.currentStock < item.minStock ? "text-danger" : "text-on-surface"
                  }`}
                >
                  {item.currentStock}
                </td>
                <td className="px-4 py-3 text-right text-on-surface-variant">{item.minStock}</td>
                <td className="px-4 py-3 text-right text-on-surface-variant">{item.maxStock ?? "—"}</td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditingItem(item)}
                        title="Editar insumo"
                        className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        title="Eliminar insumo"
                        className="rounded-md p-1 text-on-surface-variant hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!itemsQuery.isLoading && items.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-on-surface-variant">
                  No hay insumos de papelería registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && <StationerySupplyFormModal onClose={() => setModalOpen(false)} />}
      {editingItem && (
        <StationerySupplyFormModal editing={editingItem} onClose={() => setEditingItem(null)} />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        tone === "danger" ? "border-danger/30 bg-danger-bg/40" : "border-outline-variant bg-surface-lowest"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone === "danger" ? "text-danger" : "text-on-surface"}`}>
        {value}
      </p>
    </div>
  );
}

function StationerySupplyFormModal({
  onClose,
  editing,
}: {
  onClose: () => void;
  editing?: StationerySupply;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    category: editing?.category ?? "",
    unit: editing?.unit ?? "uds",
    currentStock: editing?.currentStock ?? 0,
    minStock: editing?.minStock ?? 0,
    maxStock: editing?.maxStock != null ? String(editing.maxStock) : "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        maxStock: form.maxStock ? Number(form.maxStock) : undefined,
      };
      if (editing) {
        await api.patch(`/api/stationery-supplies/${editing.id}`, payload);
      } else {
        await api.post("/api/stationery-supplies", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stationery-supplies"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-surface-lowest p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-on-surface">
            {editing ? "Editar Insumo de Papelería" : "Agregar Insumo de Papelería"}
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <Field label="Nombre *">
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Resma de Papel Carta"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría">
              <input
                className="input"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Ej. Oficina"
              />
            </Field>
            <Field label="Unidad">
              <input
                className="input"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Stock Actual">
              <input
                type="number"
                min={0}
                className="input"
                value={form.currentStock}
                onChange={(e) => setForm((f) => ({ ...f, currentStock: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Stock Mínimo">
              <input
                type="number"
                min={0}
                className="input"
                value={form.minStock}
                onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Stock Máximo">
              <input
                type="number"
                min={0}
                className="input"
                value={form.maxStock}
                onChange={(e) => setForm((f) => ({ ...f, maxStock: e.target.value }))}
              />
            </Field>
          </div>
          {mutation.isError && <p className="text-sm text-danger">No se pudo guardar el insumo.</p>}
          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-outline-variant px-4 py-2 text-sm font-semibold hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:opacity-90 disabled:opacity-60"
            >
              {mutation.isPending ? "Guardando..." : editing ? "Guardar Cambios" : "Guardar Insumo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold text-on-surface">{label}</span>
      {children}
    </label>
  );
}
