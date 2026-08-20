import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Check, Pencil, Trash2, Wrench, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { ConsumptionRecord, Equipment, EquipmentUsage, Section, Supply } from "../types";

function numOrEmpty(n: number): number | string {
  return n === 0 ? "" : n;
}

function parseQty(value: string): number {
  return value === "" ? 0 : Number(value);
}

export function SectionDetailPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();

  const sectionQuery = useQuery({
    queryKey: ["section", sectionId],
    queryFn: async () => {
      const { data } = await api.get(`/api/sections/${sectionId}`);
      return data as Section & { workshop: { name: string; subject: { name: string } } };
    },
  });

  const suppliesQuery = useQuery({
    queryKey: ["supplies", ""],
    queryFn: async () => {
      const { data } = await api.get("/api/supplies", { params: { pageSize: 100 } });
      return data.items as Supply[];
    },
  });

  const section = sectionQuery.data;

  const [draft, setDraft] = useState({
    supplyId: "",
    usedQty: 0,
    reusedQty: 0,
    discardedQty: 0,
    instructorNotes: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/sections/${sectionId}/consumption`, {
        ...draft,
        requiredQty: draft.usedQty,
        wasteQty: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      setDraft((d) => ({
        ...d,
        supplyId: "",
        usedQty: 0,
        reusedQty: 0,
        discardedQty: 0,
        instructorNotes: "",
      }));
    },
  });

  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    requiredQty: 0,
    usedQty: 0,
    wasteQty: 0,
    reusedQty: 0,
    discardedQty: 0,
  });

  function startEditRecord(record: ConsumptionRecord) {
    setEditingRecordId(record.id);
    setEditDraft({
      requiredQty: Number(record.requiredQty),
      usedQty: Number(record.usedQty),
      wasteQty: Number(record.wasteQty),
      reusedQty: Number(record.reusedQty),
      discardedQty: Number(record.discardedQty),
    });
  }

  const updateRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      await api.patch(`/api/sections/${sectionId}/consumption/${recordId}`, editDraft);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      setEditingRecordId(null);
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      await api.delete(`/api/sections/${sectionId}/consumption/${recordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
    },
  });

  function handleDeleteRecord(record: ConsumptionRecord) {
    if (confirm(`¿Eliminar el ajuste de "${record.supply.name}"? Esto revierte el stock descontado.`)) {
      deleteRecordMutation.mutate(record.id);
    }
  }

  return (
    <div>
      <p className="mb-2 text-sm text-on-surface-variant">
        <Link to="/asignaturas" className="hover:underline">
          Asignaturas
        </Link>{" "}
        / {section?.workshop.subject.name} / {section?.workshop.name} / {section?.code}
      </p>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">{section?.workshop.name}</h1>
          <p className="mt-1 text-on-surface-variant">
            {section?.code} · {section?.studentsCount} alumnos ·{" "}
            {[section?.dayOfWeek, section?.startTime, section?.endTime].filter(Boolean).join(" ")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-lg border border-outline-variant bg-surface-lowest">
          <div className="flex items-center justify-between border-b border-outline-variant p-4">
            <h2 className="font-semibold text-on-surface">Lista de Materiales y Reactivos</h2>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-2">Insumo</th>
                <th className="px-4 py-2 text-right">Req.</th>
                <th className="px-4 py-2 text-right">Util.</th>
                <th className="px-4 py-2 text-right">Merma</th>
                <th className="px-4 py-2 text-right">Reutilizado</th>
                <th className="px-4 py-2 text-right">Desechado</th>
                <th className="px-4 py-2 text-right">Stock Actual</th>
                {isAdmin && <th className="px-4 py-2 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {section?.consumptionRecords.map((record) => {
                const isEditing = editingRecordId === record.id;
                return (
                  <tr key={record.id} className="border-t border-outline-variant">
                    <td className="px-4 py-2 font-medium">{record.supply.name}</td>
                    {isEditing ? (
                      <>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            min={0}
                            className="input"
                            value={numOrEmpty(editDraft.requiredQty)}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, requiredQty: parseQty(e.target.value) }))
                            }
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            min={0}
                            className="input"
                            value={numOrEmpty(editDraft.usedQty)}
                            onChange={(e) => setEditDraft((d) => ({ ...d, usedQty: parseQty(e.target.value) }))}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            min={0}
                            className="input"
                            value={numOrEmpty(editDraft.wasteQty)}
                            onChange={(e) => setEditDraft((d) => ({ ...d, wasteQty: parseQty(e.target.value) }))}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            min={0}
                            className="input"
                            value={numOrEmpty(editDraft.reusedQty)}
                            onChange={(e) => setEditDraft((d) => ({ ...d, reusedQty: parseQty(e.target.value) }))}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            min={0}
                            className="input"
                            value={numOrEmpty(editDraft.discardedQty)}
                            onChange={(e) =>
                              setEditDraft((d) => ({ ...d, discardedQty: parseQty(e.target.value) }))
                            }
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-on-surface-variant">
                          {record.supply.currentStock}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => updateRecordMutation.mutate(record.id)}
                              disabled={updateRecordMutation.isPending}
                              title="Guardar"
                              className="rounded-md p-1 text-success hover:bg-success-bg"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingRecordId(null)}
                              title="Cancelar"
                              className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 text-right">{record.requiredQty}</td>
                        <td className="px-4 py-2 text-right">{record.usedQty}</td>
                        <td className="px-4 py-2 text-right text-warning">{record.wasteQty}</td>
                        <td className="px-4 py-2 text-right text-success">{record.reusedQty}</td>
                        <td className="px-4 py-2 text-right text-danger">{record.discardedQty}</td>
                        <td
                          className={`px-4 py-2 text-right font-semibold ${
                            record.supply.currentStock < record.supply.minStock
                              ? "text-danger"
                              : "text-on-surface"
                          }`}
                        >
                          {record.supply.currentStock}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-2">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => startEditRecord(record)}
                                title="Editar"
                                className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(record)}
                                title="Eliminar"
                                className="rounded-md p-1 text-on-surface-variant hover:bg-danger-bg hover:text-danger"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}
              {section && section.consumptionRecords.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-6 text-center text-on-surface-variant">
                    Sin ajustes reportados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="grid grid-cols-3 gap-2 border-t border-outline-variant p-4"
          >
            <select
              required
              className="input col-span-3"
              value={draft.supplyId}
              onChange={(e) => setDraft((d) => ({ ...d, supplyId: e.target.value }))}
            >
              <option value="">Seleccionar insumo...</option>
              {suppliesQuery.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Cantidad Utilizada</span>
              <input
                type="number"
                min={0}
                className="input"
                value={numOrEmpty(draft.usedQty)}
                onChange={(e) => setDraft((d) => ({ ...d, usedQty: parseQty(e.target.value) }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold text-success">Cantidad Reutilizada</span>
              <input
                type="number"
                min={0}
                className="input"
                value={numOrEmpty(draft.reusedQty)}
                onChange={(e) => setDraft((d) => ({ ...d, reusedQty: parseQty(e.target.value) }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold text-danger">Cantidad Desechada</span>
              <input
                type="number"
                min={0}
                className="input"
                value={numOrEmpty(draft.discardedQty)}
                onChange={(e) => setDraft((d) => ({ ...d, discardedQty: parseQty(e.target.value) }))}
              />
            </label>
            <button
              type="submit"
              disabled={mutation.isPending || !draft.supplyId}
              className="col-span-3 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-on-secondary hover:opacity-90 disabled:opacity-60"
            >
              Reportar
            </button>
          </form>
          {mutation.isError && (
            <p className="px-4 pb-4 text-sm text-danger">No se pudo registrar el ajuste.</p>
          )}
        </div>

        <div className="rounded-lg border border-outline-variant bg-surface-lowest p-4">
          <h2 className="mb-2 font-semibold text-on-surface">Notas del Instructor</h2>
          <textarea
            className="input"
            rows={5}
            value={draft.instructorNotes}
            onChange={(e) => setDraft((d) => ({ ...d, instructorNotes: e.target.value }))}
            placeholder="Notas para el próximo reporte..."
          />
        </div>
      </div>

      {sectionId && <EquipmentUsageCard sectionId={sectionId} section={section} isAdmin={isAdmin} />}
    </div>
  );
}

function EquipmentUsageCard({
  sectionId,
  section,
  isAdmin,
}: {
  sectionId: string;
  section?: Section;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();

  const equipmentQuery = useQuery({
    queryKey: ["equipment", ""],
    queryFn: async () => {
      const { data } = await api.get("/api/equipment");
      return data as Equipment[];
    },
  });

  const [draft, setDraft] = useState({
    equipmentId: "",
    supplyId: "",
    usedQty: 0,
    reusedQty: 0,
    discardedQty: 0,
  });
  const selectedEquipment = equipmentQuery.data?.find((e) => e.id === draft.equipmentId);
  const linkedSupply = selectedEquipment?.linkedSupplies.find((l) => l.supplyId === draft.supplyId)?.supply ?? null;

  const mutation = useMutation({
    mutationFn: async () => {
      const { equipmentId, supplyId, usedQty, reusedQty, discardedQty } = draft;
      await api.post(`/api/sections/${sectionId}/equipment-usage`, {
        equipmentId,
        supplyId,
        usedQty,
        reusedQty,
        discardedQty,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      setDraft({ equipmentId: "", supplyId: "", usedQty: 0, reusedQty: 0, discardedQty: 0 });
    },
  });

  function selectEquipment(equipmentId: string) {
    const eq = equipmentQuery.data?.find((e) => e.id === equipmentId);
    setDraft((d) => ({ ...d, equipmentId, supplyId: eq?.linkedSupplies[0]?.supplyId ?? "" }));
  }

  const equipmentWithSupplies = equipmentQuery.data?.filter((e) => e.linkedSupplies.length > 0) ?? [];

  const [editingUsageId, setEditingUsageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ usedQty: 0, reusedQty: 0, discardedQty: 0 });

  function startEditUsage(usage: EquipmentUsage) {
    setEditingUsageId(usage.id);
    setEditDraft({
      usedQty: Number(usage.usedQty),
      reusedQty: Number(usage.reusedQty),
      discardedQty: Number(usage.discardedQty),
    });
  }

  const updateUsageMutation = useMutation({
    mutationFn: async (usageId: string) => {
      await api.patch(`/api/sections/${sectionId}/equipment-usage/${usageId}`, editDraft);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      setEditingUsageId(null);
    },
  });

  const deleteUsageMutation = useMutation({
    mutationFn: async (usageId: string) => {
      await api.delete(`/api/sections/${sectionId}/equipment-usage/${usageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
    },
  });

  function handleDeleteUsage(usage: EquipmentUsage) {
    if (confirm(`¿Eliminar el uso de "${usage.equipment.name}"? Esto revierte el stock descontado.`)) {
      deleteUsageMutation.mutate(usage.id);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-outline-variant bg-surface-lowest">
      <div className="flex items-center gap-2 border-b border-outline-variant p-4">
        <Wrench size={18} className="text-secondary" />
        <h2 className="font-semibold text-on-surface">Equipamiento Utilizado</h2>
      </div>

      <table className="w-full text-left text-sm">
        <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
          <tr>
            <th className="px-4 py-2">Equipo</th>
            <th className="px-4 py-2">Insumo Asociado</th>
            <th className="px-4 py-2 text-right">Utilizado</th>
            <th className="px-4 py-2 text-right">Reutilizado</th>
            <th className="px-4 py-2 text-right">Desechado</th>
            {isAdmin && <th className="px-4 py-2 text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {section?.equipmentUsages.map((usage) => {
            const isEditing = editingUsageId === usage.id;
            return (
              <tr key={usage.id} className="border-t border-outline-variant">
                <td className="px-4 py-2 font-medium">{usage.equipment.name}</td>
                <td className="px-4 py-2 text-on-surface-variant">{usage.supply?.name ?? "—"}</td>
                {isEditing ? (
                  <>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        className="input"
                        value={numOrEmpty(editDraft.usedQty)}
                        onChange={(e) => setEditDraft((d) => ({ ...d, usedQty: parseQty(e.target.value) }))}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        className="input"
                        value={numOrEmpty(editDraft.reusedQty)}
                        onChange={(e) => setEditDraft((d) => ({ ...d, reusedQty: parseQty(e.target.value) }))}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        className="input"
                        value={numOrEmpty(editDraft.discardedQty)}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, discardedQty: parseQty(e.target.value) }))
                        }
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => updateUsageMutation.mutate(usage.id)}
                          disabled={updateUsageMutation.isPending}
                          title="Guardar"
                          className="rounded-md p-1 text-success hover:bg-success-bg"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingUsageId(null)}
                          title="Cancelar"
                          className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 text-right">{usage.usedQty}</td>
                    <td className="px-4 py-2 text-right text-success">{usage.reusedQty}</td>
                    <td className="px-4 py-2 text-right text-danger">{usage.discardedQty}</td>
                    {isAdmin && (
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => startEditUsage(usage)}
                            title="Editar"
                            className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteUsage(usage)}
                            title="Eliminar"
                            className="rounded-md p-1 text-on-surface-variant hover:bg-danger-bg hover:text-danger"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </>
                )}
              </tr>
            );
          })}
          {section && section.equipmentUsages.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 6 : 5} className="px-4 py-6 text-center text-on-surface-variant">
                Sin equipamiento utilizado reportado todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="grid grid-cols-3 gap-2 border-t border-outline-variant p-4"
      >
        <select
          required
          className="input col-span-3"
          value={draft.equipmentId}
          onChange={(e) => selectEquipment(e.target.value)}
        >
          <option value="">Seleccionar equipo...</option>
          {equipmentWithSupplies.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name}
            </option>
          ))}
        </select>

        {selectedEquipment && selectedEquipment.linkedSupplies.length > 1 && (
          <select
            required
            className="input col-span-3"
            value={draft.supplyId}
            onChange={(e) => setDraft((d) => ({ ...d, supplyId: e.target.value }))}
          >
            {selectedEquipment.linkedSupplies.map((l) => (
              <option key={l.supplyId} value={l.supplyId}>
                {l.supply.name}
              </option>
            ))}
          </select>
        )}

        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-on-surface-variant">Cant. Utilizada</span>
          <input
            type="number"
            min={0}
            className="input"
            value={numOrEmpty(draft.usedQty)}
            onChange={(e) => setDraft((d) => ({ ...d, usedQty: parseQty(e.target.value) }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-success">Cant. Reutilizada</span>
          <input
            type="number"
            min={0}
            className="input"
            value={numOrEmpty(draft.reusedQty)}
            onChange={(e) => setDraft((d) => ({ ...d, reusedQty: parseQty(e.target.value) }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold text-danger">Cant. Desechada</span>
          <input
            type="number"
            min={0}
            className="input"
            value={numOrEmpty(draft.discardedQty)}
            onChange={(e) => setDraft((d) => ({ ...d, discardedQty: parseQty(e.target.value) }))}
          />
        </label>
        <button
          type="submit"
          disabled={mutation.isPending || !draft.equipmentId || !draft.supplyId}
          className="col-span-3 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-on-secondary hover:opacity-90 disabled:opacity-60"
        >
          Reportar
        </button>
      </form>
      {linkedSupply && (
        <p className="px-4 pb-4 text-xs text-on-surface-variant">
          Se descontará del stock de <span className="font-semibold">{linkedSupply.name}</span> (disponible:{" "}
          {linkedSupply.currentStock}).
        </p>
      )}
      {mutation.isError && (
        <p className="px-4 pb-4 text-sm text-danger">No se pudo registrar el uso de equipamiento.</p>
      )}
    </div>
  );
}
