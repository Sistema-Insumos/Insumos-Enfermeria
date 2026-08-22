import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Equipment, EquipmentSupply, Room } from "../types";

const STATUS_LABEL: Record<Equipment["status"], string> = {
  GOOD: "Bueno",
  BAD: "Malo",
};

const STATUS_TONE: Record<Equipment["status"], string> = {
  GOOD: "bg-success-bg text-success",
  BAD: "bg-danger-bg text-danger",
};

const UTILITY_LABEL: Record<Equipment["utility"], string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

const UTILITY_TONE: Record<Equipment["utility"], string> = {
  HIGH: "bg-success-bg text-success",
  MEDIUM: "bg-warning-bg text-warning",
  LOW: "bg-danger-bg text-danger",
};

export function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const isAdmin = user?.role === "ADMIN";

  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const { data } = await api.get(`/api/rooms/${roomId}`);
      return data as Room;
    },
  });

  const equipmentQuery = useQuery({
    queryKey: ["equipment", roomId, search],
    queryFn: async () => {
      const { data } = await api.get("/api/equipment", { params: { roomId, search } });
      return data as Equipment[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      await api.delete(`/api/equipment/${equipmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment", roomId] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  function handleDelete(eq: Equipment) {
    if (confirm(`¿Eliminar el equipo "${eq.name}"?`)) {
      deleteMutation.mutate(eq.id);
    }
  }

  const items = equipmentQuery.data ?? [];
  const badCondition = items.filter((e) => e.status === "BAD").length;
  const totalValue = items.reduce((sum, e) => sum + Number(e.unitValue) * e.quantity, 0);
  const criticalSupplies = items.flatMap((e) =>
    e.linkedSupplies.filter((l) => l.equipmentSupply.currentStock < l.equipmentSupply.minStock)
  ).length;

  return (
    <div>
      <p className="mb-2 text-sm text-on-surface-variant">
        <Link to="/equipamiento" className="hover:underline">
          Equipamiento
        </Link>{" "}
        / {roomQuery.data?.name ?? "..."}
      </p>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Sala {roomQuery.data?.name}</h1>
          <p className="mt-1 text-on-surface-variant">Equipamiento registrado en esta sala.</p>
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
        <StatCard
          label="Equipos en Mal Estado"
          value={String(badCondition)}
          tone={badCondition > 0 ? "danger" : "default"}
        />
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
              <th className="px-4 py-3">Código / N° Inventario</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Utilidad</th>
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
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[eq.status]}`}>
                    {STATUS_LABEL[eq.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${UTILITY_TONE[eq.utility]}`}>
                    {UTILITY_LABEL[eq.utility]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {eq.linkedSupplies.length === 0 && <span className="text-on-surface-variant">—</span>}
                  {eq.linkedSupplies.map((l) => (
                    <div key={l.id} className="text-xs">
                      <span className="font-medium">{l.equipmentSupply.name}</span>{" "}
                      <span
                        className={
                          l.equipmentSupply.currentStock < l.minThreshold
                            ? "text-danger"
                            : "text-on-surface-variant"
                        }
                      >
                        ({l.equipmentSupply.currentStock})
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
                  Esta sala no tiene equipos registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && roomId && <EquipmentFormModal roomId={roomId} onClose={() => setModalOpen(false)} />}
      {editingEquipment && roomId && (
        <EquipmentFormModal
          roomId={roomId}
          editing={editingEquipment}
          onClose={() => setEditingEquipment(null)}
        />
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

function EquipmentFormModal({
  roomId,
  onClose,
  editing,
}: {
  roomId: string;
  onClose: () => void;
  editing?: Equipment;
}) {
  const queryClient = useQueryClient();
  const suppliesQuery = useQuery({
    queryKey: ["equipment-supplies", ""],
    queryFn: async () => {
      const { data } = await api.get("/api/equipment-supplies", { params: { pageSize: 1000 } });
      return data.items as EquipmentSupply[];
    },
  });

  const [form, setForm] = useState({
    serial: editing?.serial ?? "",
    name: editing?.name ?? "",
    status: editing?.status ?? ("GOOD" as Equipment["status"]),
    utility: editing?.utility ?? ("MEDIUM" as Equipment["utility"]),
    linkedSupplyIds: editing?.linkedSupplies.map((l) => l.equipmentSupplyId) ?? ([] as string[]),
  });

  function toggleLinkedSupply(equipmentSupplyId: string) {
    setForm((f) => ({
      ...f,
      linkedSupplyIds: f.linkedSupplyIds.includes(equipmentSupplyId)
        ? f.linkedSupplyIds.filter((id) => id !== equipmentSupplyId)
        : [...f.linkedSupplyIds, equipmentSupplyId],
    }));
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const { linkedSupplyIds, ...rest } = form;
      const payload = {
        ...rest,
        roomId,
        linkedSupplies: linkedSupplyIds.map((equipmentSupplyId) => ({
          equipmentSupplyId,
          autoDiscount: true,
        })),
      };
      if (editing) {
        await api.patch(`/api/equipment/${editing.id}`, payload);
      } else {
        await api.post("/api/equipment", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment", roomId] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
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
            <Field label="N° Inventario">
              <input
                className="input"
                value={form.serial}
                onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))}
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
                <option value="GOOD">Bueno</option>
                <option value="BAD">Malo</option>
              </select>
            </Field>
            <Field label="Utilidad">
              <select
                className="input"
                value={form.utility}
                onChange={(e) => setForm((f) => ({ ...f, utility: e.target.value as Equipment["utility"] }))}
              >
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
              </select>
            </Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-on-surface">
              Complementario Vinculado (descuento automático)
            </p>
            <div className="flex flex-wrap gap-2">
              {suppliesQuery.data?.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleLinkedSupply(s.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    form.linkedSupplyIds.includes(s.id)
                      ? "border-secondary bg-secondary text-on-secondary"
                      : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {s.name}
                </button>
              ))}
              {suppliesQuery.data?.length === 0 && (
                <p className="text-xs text-on-surface-variant">
                  No hay insumos complementarios registrados todavía. Créalos en{" "}
                  <Link to="/equipamiento/insumos" className="underline">
                    Complementario
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>

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
