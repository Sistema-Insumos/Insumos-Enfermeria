import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Equipment, Supply } from "../types";

const STATUS_LABEL: Record<Equipment["status"], string> = {
  OPERATIVE: "Operativo",
  MAINTENANCE: "En Mantenimiento",
  OUT_OF_SERVICE: "Fuera de Servicio",
};

const STATUS_TONE: Record<Equipment["status"], string> = {
  OPERATIVE: "bg-success-bg text-success",
  MAINTENANCE: "bg-warning-bg text-warning",
  OUT_OF_SERVICE: "bg-danger-bg text-danger",
};

export function EquipmentPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const isAdmin = user?.role === "ADMIN";

  const equipmentQuery = useQuery({
    queryKey: ["equipment", search],
    queryFn: async () => {
      const { data } = await api.get("/api/equipment", { params: { search } });
      return data as Equipment[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      await api.delete(`/api/equipment/${equipmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
    },
  });

  function handleDelete(eq: Equipment) {
    if (confirm(`¿Eliminar el equipo "${eq.name}"?`)) {
      deleteMutation.mutate(eq.id);
    }
  }

  const items = equipmentQuery.data ?? [];
  const inMaintenance = items.filter((e) => e.status === "MAINTENANCE").length;
  const totalValue = items.reduce((sum, e) => sum + Number(e.unitValue) * e.quantity, 0);
  const criticalSupplies = items.flatMap((e) =>
    e.linkedSupplies.filter((l) => l.supply.currentStock < l.supply.minStock)
  ).length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Inventario de Equipamiento</h1>
          <p className="mt-1 text-on-surface-variant">Control de activos fijos, mantenimiento y ubicación.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:opacity-90"
        >
          <Plus size={18} />
          Agregar Equipo
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Valor Total en Equipos" value={`$${totalValue.toLocaleString()}`} />
        <StatCard label="Equipos en Mantenimiento" value={String(inMaintenance)} />
        <StatCard
          label="Alertas de Stock de Insumos"
          value={String(criticalSupplies)}
          tone={criticalSupplies > 0 ? "danger" : "default"}
        />
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-md border border-outline-variant bg-surface-lowest px-3 py-2">
        <Search size={18} className="text-on-surface-variant" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, serial o nombre..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Código / Serial</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Insumos Vinculados</th>
              {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((eq) => (
              <tr key={eq.id} className="border-t border-outline-variant hover:bg-surface-low">
                <td className="px-4 py-3">
                  <p className="font-mono text-xs font-semibold text-on-surface">{eq.code}</p>
                  {eq.serial && <p className="text-xs text-on-surface-variant">{eq.serial}</p>}
                </td>
                <td className="px-4 py-3 font-medium">{eq.name}</td>
                <td className="px-4 py-3">{eq.category}</td>
                <td className="px-4 py-3 text-right">{eq.quantity}</td>
                <td className="px-4 py-3 text-on-surface-variant">{eq.location ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[eq.status]}`}>
                    {STATUS_LABEL[eq.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {eq.linkedSupplies.length === 0 && <span className="text-on-surface-variant">—</span>}
                  {eq.linkedSupplies.map((l) => (
                    <div key={l.id} className="text-xs">
                      <span className="font-medium">{l.supply.name}</span>{" "}
                      <span
                        className={
                          l.supply.currentStock < l.minThreshold ? "text-danger" : "text-on-surface-variant"
                        }
                      >
                        ({l.supply.currentStock})
                      </span>
                    </div>
                  ))}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditingEquipment(eq)}
                        title="Editar equipo"
                        className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(eq)}
                        title="Eliminar equipo"
                        className="rounded-md p-1 text-on-surface-variant hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!equipmentQuery.isLoading && items.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-on-surface-variant">
                  No hay equipos registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && <EquipmentFormModal onClose={() => setModalOpen(false)} />}
      {editingEquipment && (
        <EquipmentFormModal editing={editingEquipment} onClose={() => setEditingEquipment(null)} />
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

function EquipmentFormModal({ onClose, editing }: { onClose: () => void; editing?: Equipment }) {
  const queryClient = useQueryClient();
  const suppliesQuery = useQuery({
    queryKey: ["supplies", ""],
    queryFn: async () => {
      const { data } = await api.get("/api/supplies", { params: { pageSize: 100 } });
      return data.items as Supply[];
    },
  });

  const [form, setForm] = useState({
    code: editing?.code ?? "",
    serial: editing?.serial ?? "",
    name: editing?.name ?? "",
    category: editing?.category ?? "",
    quantity: editing?.quantity ?? 1,
    location: editing?.location ?? "",
    status: editing?.status ?? ("OPERATIVE" as Equipment["status"]),
    unitValue: editing ? Number(editing.unitValue) : 0,
    linkedSupplyId: editing?.linkedSupplies[0]?.supplyId ?? "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        linkedSupplies: form.linkedSupplyId
          ? [{ supplyId: form.linkedSupplyId, autoDiscount: true }]
          : [],
      };
      if (editing) {
        await api.patch(`/api/equipment/${editing.id}`, payload);
      } else {
        await api.post("/api/equipment", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-surface-lowest p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-on-surface">
            {editing ? "Editar Equipo" : "Agregar Equipo"}
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre del Equipo *">
              <input
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field label="Código *">
              <input
                required
                className="input"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="Ej. EQ-001"
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
              />
            </Field>
            <Field label="N° Serial">
              <input
                className="input"
                value={form.serial}
                onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cantidad">
              <input
                type="number"
                min={1}
                className="input"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Ubicación">
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Estado">
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Equipment["status"] }))}
              >
                <option value="OPERATIVE">Operativo</option>
                <option value="MAINTENANCE">En Mantenimiento</option>
                <option value="OUT_OF_SERVICE">Fuera de Servicio</option>
              </select>
            </Field>
            <Field label="Valor Unitario">
              <input
                type="number"
                min={0}
                className="input"
                value={form.unitValue}
                onChange={(e) => setForm((f) => ({ ...f, unitValue: Number(e.target.value) }))}
              />
            </Field>
          </div>

          <Field label="Insumo Vinculado (descuento automático)">
            <select
              className="input"
              value={form.linkedSupplyId}
              onChange={(e) => setForm((f) => ({ ...f, linkedSupplyId: e.target.value }))}
            >
              <option value="">Ninguno</option>
              {suppliesQuery.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          {mutation.isError && <p className="text-sm text-danger">No se pudo guardar el equipo.</p>}

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
              {mutation.isPending ? "Guardando..." : editing ? "Guardar Cambios" : "Guardar Equipo"}
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
