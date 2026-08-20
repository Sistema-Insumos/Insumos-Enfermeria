import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { FutureSupplyNeed, ProjectionResponse } from "../types";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1];

const STATUS_LABEL = { CRITICO: "Crítico", ATENCION: "Atención", SUFICIENTE: "Suficiente" };
const STATUS_TONE = {
  CRITICO: "bg-danger-bg text-danger",
  ATENCION: "bg-warning-bg text-warning",
  SUFICIENTE: "bg-success-bg text-success",
};

const PRIORITY_LABEL = { HIGH: "Alta", MEDIUM: "Media", LOW: "Baja" };
const PRIORITY_TONE = {
  HIGH: "bg-danger-bg text-danger",
  MEDIUM: "bg-warning-bg text-warning",
  LOW: "bg-success-bg text-success",
};

export function ProjectionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  const [year, setYear] = useState(CURRENT_YEAR);
  const [semester, setSemester] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNeed, setEditingNeed] = useState<FutureSupplyNeed | null>(null);

  const projectionQuery = useQuery({
    queryKey: ["projections", year, semester],
    queryFn: async () => {
      const { data } = await api.get("/api/projections", { params: { year, semester } });
      return data as ProjectionResponse;
    },
  });

  const futureNeedsQuery = useQuery({
    queryKey: ["future-needs"],
    queryFn: async () => {
      const { data } = await api.get("/api/projections/future-needs");
      return data as FutureSupplyNeed[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/projections/future-needs/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["future-needs"] }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FutureSupplyNeed["status"] }) => {
      await api.patch(`/api/projections/future-needs/${id}`, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["future-needs"] }),
  });

  function handleDelete(need: FutureSupplyNeed) {
    if (confirm(`¿Eliminar "${need.name}" de insumos futuros?`)) {
      deleteMutation.mutate(need.id);
    }
  }

  const data = projectionQuery.data;
  const pendingNeeds = futureNeedsQuery.data?.filter((n) => n.status === "PENDING") ?? [];
  const inProgressNeeds = futureNeedsQuery.data?.filter((n) => n.status === "IN_PROGRESS") ?? [];

  return (
    <div>
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Proyección de Semestre</h1>
          <p className="mt-1 text-on-surface-variant">
            Cuánto falta de cada insumo para cubrir el período seleccionado.
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        {YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
              year === y ? "bg-secondary text-on-secondary" : "border border-outline-variant text-on-surface-variant"
            }`}
          >
            {y}
          </button>
        ))}
        {[1, 2].map((s) => (
          <button
            key={s}
            onClick={() => setSemester(s)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              semester === s
                ? "border-secondary bg-secondary/10 text-secondary"
                : "border-outline-variant text-on-surface-variant"
            }`}
          >
            {s === 1 ? "Primer Semestre" : "Segundo Semestre"}
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-outline-variant bg-surface-lowest p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Costo Estimado de Reposición
          </p>
          <p className="mt-1 text-2xl font-bold text-on-surface">
            ${data?.totalEstimatedCost.toLocaleString() ?? "—"}
          </p>
        </div>
        <div
          className={`rounded-lg border p-4 ${
            (data?.criticalCount ?? 0) > 0
              ? "border-danger/30 bg-danger-bg/40"
              : "border-outline-variant bg-surface-lowest"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Artículos Críticos Faltantes
          </p>
          <p className={`mt-1 text-2xl font-bold ${(data?.criticalCount ?? 0) > 0 ? "text-danger" : ""}`}>
            {data?.criticalCount ?? "—"}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">SKU / Artículo</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Stock Actual</th>
              <th className="px-4 py-3 text-right">Proyección</th>
              <th className="px-4 py-3 text-right">Diferencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Costo Reposición</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => (
              <tr key={item.id} className="border-t border-outline-variant hover:bg-surface-low">
                <td className="px-4 py-3">
                  <p className="font-medium">{item.name}</p>
                  <p className="font-mono text-xs text-on-surface-variant">{item.sku}</p>
                </td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3 text-right">{item.currentStock}</td>
                <td className="px-4 py-3 text-right">
                  {item.projectedNeed}
                  <p className="text-xs text-on-surface-variant">
                    {item.basedOnHistoricalData
                      ? `${item.upcomingStudents} alumnos inscritos`
                      : "estimado (sin historial)"}
                  </p>
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${item.diff < 0 ? "text-danger" : "text-success"}`}>
                  {item.diff > 0 ? "+" : ""}
                  {item.diff}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[item.status]}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">${item.estimatedCost.toLocaleString()}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                  No hay insumos registrados para proyectar todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-on-surface">Insumos Futuros</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:opacity-90"
        >
          <Plus size={18} />
          Añadir a Insumos Futuros
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Artículo / Insumo</th>
              <th className="px-4 py-3 text-right">Cantidad Estimada</th>
              <th className="px-4 py-3">Prioridad</th>
              {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {pendingNeeds.map((need) => (
              <tr key={need.id} className="border-t border-outline-variant hover:bg-surface-low">
                <td className="px-4 py-3 font-medium">{need.name}</td>
                <td className="px-4 py-3 text-right">{need.estimatedQty}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_TONE[need.priority]}`}>
                    {PRIORITY_LABEL[need.priority]}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => statusMutation.mutate({ id: need.id, status: "IN_PROGRESS" })}
                        title="Pasar a Compra"
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-secondary hover:bg-secondary/10"
                      >
                        Pasar a Compra
                        <ArrowRight size={12} />
                      </button>
                      <button
                        onClick={() => setEditingNeed(need)}
                        title="Editar"
                        className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(need)}
                        title="Eliminar"
                        className="rounded-md p-1 text-on-surface-variant hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {pendingNeeds.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-on-surface-variant">
                  No hay insumos futuros pendientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 mb-4 text-lg font-semibold text-on-surface">Insumos en Trámite</h2>
      <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Artículo / Insumo</th>
              <th className="px-4 py-3 text-right">Cantidad Estimada</th>
              <th className="px-4 py-3">Prioridad</th>
              {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {inProgressNeeds.map((need) => (
              <tr key={need.id} className="border-t border-outline-variant hover:bg-surface-low">
                <td className="px-4 py-3 font-medium">{need.name}</td>
                <td className="px-4 py-3 text-right">{need.estimatedQty}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_TONE[need.priority]}`}>
                    {PRIORITY_LABEL[need.priority]}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => statusMutation.mutate({ id: need.id, status: "PENDING" })}
                        title="Devolver a Insumos Futuros"
                        className="rounded-md px-2 py-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
                      >
                        Devolver
                      </button>
                      <button
                        onClick={() => handleDelete(need)}
                        title="Eliminar"
                        className="rounded-md p-1 text-on-surface-variant hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {inProgressNeeds.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-on-surface-variant">
                  No hay insumos en trámite.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && <FutureNeedModal onClose={() => setModalOpen(false)} />}
      {editingNeed && <FutureNeedModal editing={editingNeed} onClose={() => setEditingNeed(null)} />}
    </div>
  );
}

function FutureNeedModal({ onClose, editing }: { onClose: () => void; editing?: FutureSupplyNeed }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    estimatedQty: editing?.estimatedQty ?? 0,
    priority: editing?.priority ?? ("MEDIUM" as "LOW" | "MEDIUM" | "HIGH"),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await api.patch(`/api/projections/future-needs/${editing.id}`, form);
      } else {
        await api.post("/api/projections/future-needs", form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["future-needs"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-surface-lowest p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-on-surface">
            {editing ? "Editar Insumo Futuro" : "Añadir a Insumos Futuros"}
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
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-on-surface">Artículo (Nombre)</span>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Kits de Robótica Avanzada"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-on-surface">Cantidad Estimada</span>
            <input
              type="number"
              min={0}
              required
              className="input"
              value={form.estimatedQty}
              onChange={(e) => setForm((f) => ({ ...f, estimatedQty: Number(e.target.value) }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-on-surface">Prioridad</span>
            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as "LOW" | "MEDIUM" | "HIGH" }))}
            >
              <option value="HIGH">Alta</option>
              <option value="MEDIUM">Media</option>
              <option value="LOW">Baja</option>
            </select>
          </label>
          {mutation.isError && <p className="text-sm text-danger">No se pudo guardar.</p>}
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
              {mutation.isPending ? "Guardando..." : editing ? "Guardar Cambios" : "Añadir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
