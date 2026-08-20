import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Subject, Supply } from "../types";

export function InventoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
  const isAdmin = user?.role === "ADMIN";
  const lowStockOnly = searchParams.get("lowStock") === "1";

  const suppliesQuery = useQuery({
    queryKey: ["supplies", search],
    queryFn: async () => {
      const { data } = await api.get("/api/supplies", { params: { search, pageSize: 100 } });
      return data as { items: Supply[]; total: number };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (supplyId: string) => {
      await api.delete(`/api/supplies/${supplyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
    },
  });

  function handleDelete(supply: Supply) {
    if (confirm(`¿Eliminar el insumo "${supply.name}"?`)) {
      deleteMutation.mutate(supply.id);
    }
  }

  const allSupplies = suppliesQuery.data?.items ?? [];
  const lowStockCount = allSupplies.filter((s) => s.currentStock < s.minStock).length;
  const supplies = lowStockOnly ? allSupplies.filter((s) => s.currentStock < s.minStock) : allSupplies;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Inventario Maestro de Insumos</h1>
          <p className="mt-1 text-on-surface-variant">
            Gestión centralizada de stock para todas las dependencias académicas.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:opacity-90"
        >
          <Plus size={18} />
          Agregar Nuevo Artículo
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Total de SKUs" value={String(suppliesQuery.data?.total ?? "—")} />
        <StatCard
          label="Artículos Bajo Stock"
          value={String(lowStockCount)}
          tone={lowStockCount > 0 ? "danger" : "default"}
        />
        <StatCard label="Categorías Activas" value={String(new Set(allSupplies.map((s) => s.category)).size)} />
      </div>

      {lowStockOnly && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-danger/30 bg-danger-bg/40 px-4 py-2 text-sm text-danger">
          <span>Mostrando solo artículos bajo stock mínimo.</span>
          <button
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("lowStock");
              setSearchParams(next);
            }}
            className="font-semibold underline"
          >
            Quitar filtro
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 rounded-md border border-outline-variant bg-surface-lowest px-3 py-2">
        <Search size={18} className="text-on-surface-variant" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por Nombre o SKU..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">SKU/Código</th>
              <th className="px-4 py-3">Nombre del Insumo</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3 text-right">Stock Máximo</th>
              <th className="px-4 py-3 text-right">Stock Actual</th>
              <th className="px-4 py-3 text-right">Stock Mínimo</th>
              <th className="px-4 py-3 text-right">Nuevos</th>
              <th className="px-4 py-3 text-right">Reutilizados</th>
              {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {supplies.map((supply) => (
              <tr key={supply.id} className="border-t border-outline-variant hover:bg-surface-low">
                <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{supply.sku}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{supply.name}</p>
                  {supply.description && (
                    <p className="text-xs text-on-surface-variant">{supply.description}</p>
                  )}
                </td>
                <td className="px-4 py-3">{supply.category}</td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {[supply.locationType, supply.locationDetail].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-right text-on-surface-variant">{supply.maxStock ?? "—"}</td>
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    supply.currentStock < supply.minStock ? "text-danger" : "text-on-surface"
                  }`}
                >
                  {supply.currentStock}
                </td>
                <td className="px-4 py-3 text-right text-on-surface-variant">{supply.minStock}</td>
                <td className="px-4 py-3 text-right text-success">{supply.newStock}</td>
                <td className="px-4 py-3 text-right text-secondary">{supply.reusableStock}</td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditingSupply(supply)}
                        title="Editar insumo"
                        className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(supply)}
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
            {!suppliesQuery.isLoading && supplies.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 10 : 9} className="px-4 py-8 text-center text-on-surface-variant">
                  No hay insumos registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && <SupplyFormModal onClose={() => setModalOpen(false)} />}
      {editingSupply && (
        <SupplyFormModal editing={editingSupply} onClose={() => setEditingSupply(null)} />
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

function SupplyFormModal({ onClose, editing }: { onClose: () => void; editing?: Supply }) {
  const queryClient = useQueryClient();
  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data } = await api.get("/api/subjects");
      return data as Subject[];
    },
  });

  const [form, setForm] = useState({
    name: editing?.name ?? "",
    sku: editing?.sku ?? "",
    category: editing?.category ?? "",
    locationType: editing?.locationType ?? "",
    locationDetail: editing?.locationDetail ?? "",
    stockValue: editing ? editing.currentStock : 0,
    minStock: editing?.minStock ?? 0,
    maxStock: editing?.maxStock != null ? String(editing.maxStock) : "",
    unit: editing?.unit ?? "uds",
    description: editing?.description ?? "",
    subjectIds: [] as string[],
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { stockValue, ...rest } = form;
      const payload = {
        ...rest,
        maxStock: form.maxStock ? Number(form.maxStock) : undefined,
        ...(editing ? { currentStock: stockValue } : { initialStock: stockValue }),
      };
      if (editing) {
        await api.patch(`/api/supplies/${editing.id}`, payload);
      } else {
        await api.post("/api/supplies", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      onClose();
    },
  });

  function toggleSubject(id: string) {
    setForm((f) => ({
      ...f,
      subjectIds: f.subjectIds.includes(id)
        ? f.subjectIds.filter((s) => s !== id)
        : [...f.subjectIds, id],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-surface-lowest p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-on-surface">
              {editing ? "Editar Insumo" : "Agregar Nuevo Insumo"}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {editing
                ? "Actualiza los detalles de este elemento del inventario."
                : "Complete los detalles para registrar un nuevo elemento en el inventario."}
            </p>
          </div>
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre del Insumo *">
              <input
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Pipeta Graduada 10ml"
              />
            </Field>
            <Field label="SKU/Código (opcional)">
              <input
                className="input"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="Se genera automáticamente si se deja vacío"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría *">
              <input
                required
                className="input"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Ej. Química"
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

          <div className="grid grid-cols-2 gap-4">
            <Field label="Ubicación (Laboratorio/Aula)">
              <input
                className="input"
                value={form.locationType}
                onChange={(e) => setForm((f) => ({ ...f, locationType: e.target.value }))}
              />
            </Field>
            <Field label="Estante/Pasillo">
              <input
                className="input"
                value={form.locationDetail}
                onChange={(e) => setForm((f) => ({ ...f, locationDetail: e.target.value }))}
              />
            </Field>
          </div>

          <div className="rounded-md border border-outline-variant bg-surface-container p-4">
            <p className="mb-3 text-sm font-semibold text-on-surface">Métricas de Inventario</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Stock Actual">
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={form.stockValue}
                  onChange={(e) => setForm((f) => ({ ...f, stockValue: Number(e.target.value) }))}
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
          </div>

          <Field label="Descripción">
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Detalles adicionales, especificaciones técnicas o notas de seguridad..."
            />
          </Field>

          {subjectsQuery.data && subjectsQuery.data.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-on-surface">Vincular a Asignaturas</p>
              <div className="flex flex-wrap gap-2">
                {subjectsQuery.data.map((subject) => (
                  <button
                    type="button"
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      form.subjectIds.includes(subject.id)
                        ? "border-secondary bg-secondary text-on-secondary"
                        : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mutation.isError && (
            <p className="text-sm text-danger">No se pudo guardar el insumo. Intenta nuevamente.</p>
          )}

          <div className="mt-2 flex justify-end gap-3 border-t border-outline-variant pt-4">
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
