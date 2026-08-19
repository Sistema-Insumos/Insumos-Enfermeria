import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { RefreshCw, Trash2, Wrench } from "lucide-react";
import { api } from "../lib/api";
import type { Equipment, Section, Supply } from "../types";

export function SectionDetailPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
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
    requiredQty: 0,
    usedQty: 0,
    wasteQty: 0,
    postClassAction: "DISCARD" as "DISCARD" | "REUSE",
    reuseQty: 0,
    instructorNotes: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/sections/${sectionId}/consumption`, draft);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      setDraft((d) => ({ ...d, supplyId: "", requiredQty: 0, usedQty: 0, wasteQty: 0, reuseQty: 0, instructorNotes: "" }));
    },
  });

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
                <th className="px-4 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {section?.consumptionRecords.map((record) => (
                <tr key={record.id} className="border-t border-outline-variant">
                  <td className="px-4 py-2 font-medium">{record.supply.name}</td>
                  <td className="px-4 py-2 text-right">{record.requiredQty}</td>
                  <td className="px-4 py-2 text-right">{record.usedQty}</td>
                  <td className="px-4 py-2 text-right text-danger">{record.wasteQty}</td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                      {record.postClassAction === "REUSE" ? (
                        <>
                          <RefreshCw size={14} /> Reutilizado ({record.reuseQty})
                        </>
                      ) : (
                        <>
                          <Trash2 size={14} /> Desechado
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
              {section && section.consumptionRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-on-surface-variant">
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
            className="grid grid-cols-6 gap-2 border-t border-outline-variant p-4"
          >
            <select
              required
              className="input col-span-2"
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
            <input
              type="number"
              min={0}
              placeholder="Req."
              className="input"
              value={draft.requiredQty}
              onChange={(e) => setDraft((d) => ({ ...d, requiredQty: Number(e.target.value) }))}
            />
            <input
              type="number"
              min={0}
              placeholder="Util."
              className="input"
              value={draft.usedQty}
              onChange={(e) => setDraft((d) => ({ ...d, usedQty: Number(e.target.value) }))}
            />
            <select
              className="input"
              value={draft.postClassAction}
              onChange={(e) =>
                setDraft((d) => ({ ...d, postClassAction: e.target.value as "DISCARD" | "REUSE" }))
              }
            >
              <option value="DISCARD">Desechar</option>
              <option value="REUSE">Reutilizar</option>
            </select>
            <button
              type="submit"
              disabled={mutation.isPending || !draft.supplyId}
              className="rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-on-secondary hover:opacity-90 disabled:opacity-60"
            >
              Reportar
            </button>
            {draft.postClassAction === "REUSE" && (
              <input
                type="number"
                min={0}
                placeholder="Cant. a reutilizar"
                className="input col-span-2"
                value={draft.reuseQty}
                onChange={(e) => setDraft((d) => ({ ...d, reuseQty: Number(e.target.value) }))}
              />
            )}
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

      {sectionId && <EquipmentUsageCard sectionId={sectionId} section={section} />}
    </div>
  );
}

function EquipmentUsageCard({
  sectionId,
  section,
}: {
  sectionId: string;
  section?: Section;
}) {
  const queryClient = useQueryClient();

  const equipmentQuery = useQuery({
    queryKey: ["equipment", ""],
    queryFn: async () => {
      const { data } = await api.get("/api/equipment");
      return data as Equipment[];
    },
  });

  const [draft, setDraft] = useState({ equipmentId: "", quantity: 0 });
  const selectedEquipment = equipmentQuery.data?.find((e) => e.id === draft.equipmentId);
  const linkedSupply = selectedEquipment?.linkedSupplies[0]?.supply ?? null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!linkedSupply) return;
      await api.post(`/api/sections/${sectionId}/equipment-usage`, {
        equipmentId: draft.equipmentId,
        supplyId: linkedSupply.id,
        quantity: draft.quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section", sectionId] });
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
      setDraft({ equipmentId: "", quantity: 0 });
    },
  });

  const equipmentWithSupplies = equipmentQuery.data?.filter((e) => e.linkedSupplies.length > 0) ?? [];

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
            <th className="px-4 py-2 text-right">Cantidad Utilizada</th>
          </tr>
        </thead>
        <tbody>
          {section?.equipmentUsages.map((usage) => (
            <tr key={usage.id} className="border-t border-outline-variant">
              <td className="px-4 py-2 font-medium">{usage.equipment.name}</td>
              <td className="px-4 py-2 text-on-surface-variant">{usage.supply?.name ?? "—"}</td>
              <td className="px-4 py-2 text-right">{usage.quantity}</td>
            </tr>
          ))}
          {section && section.equipmentUsages.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-on-surface-variant">
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
        className="grid grid-cols-6 gap-2 border-t border-outline-variant p-4"
      >
        <select
          required
          className="input col-span-3"
          value={draft.equipmentId}
          onChange={(e) => setDraft((d) => ({ ...d, equipmentId: e.target.value }))}
        >
          <option value="">Seleccionar equipo...</option>
          {equipmentWithSupplies.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name} ({eq.linkedSupplies[0].supply.name})
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          placeholder="Cantidad de insumo"
          className="input col-span-2"
          value={draft.quantity}
          onChange={(e) => setDraft((d) => ({ ...d, quantity: Number(e.target.value) }))}
        />
        <button
          type="submit"
          disabled={mutation.isPending || !draft.equipmentId}
          className="rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-on-secondary hover:opacity-90 disabled:opacity-60"
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
