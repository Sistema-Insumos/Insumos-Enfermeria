import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Copy, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Workshop, Subject, Section } from "../types";

export function WorkshopDetailPage() {
  const { subjectId, workshopId } = useParams<{ subjectId: string; workshopId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const isAdmin = user?.role === "ADMIN";

  const workshopQuery = useQuery({
    queryKey: ["workshop", workshopId],
    queryFn: async () => {
      const { data } = await api.get(`/api/workshops/${workshopId}`);
      return data as Workshop & { subject: Subject };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      await api.delete(`/api/sections/${sectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop", workshopId] });
    },
  });

  function handleDelete(e: React.MouseEvent, section: Section) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`¿Eliminar la sección "${section.code}"? Esto también elimina sus ajustes de consumo.`)) {
      deleteMutation.mutate(section.id);
    }
  }

  function handleEdit(e: React.MouseEvent, section: Section) {
    e.preventDefault();
    e.stopPropagation();
    setEditingSection(section);
  }

  const duplicateMutation = useMutation({
    mutationFn: async (section: Section) => {
      await api.post(`/api/sections/${section.id}/duplicate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop", workshopId] });
    },
    onError: () => {
      alert("No se pudo duplicar la sección. Intenta nuevamente.");
    },
  });

  function handleDuplicate(e: React.MouseEvent, section: Section) {
    e.preventDefault();
    e.stopPropagation();
    duplicateMutation.mutate(section);
  }

  const workshop = workshopQuery.data;
  const totalStudents = workshop?.sections.reduce((sum, s) => sum + s.studentsCount, 0) ?? 0;

  return (
    <div>
      <p className="mb-2 text-sm text-on-surface-variant">
        <Link to="/asignaturas" className="hover:underline">
          Asignaturas
        </Link>{" "}
        /{" "}
        <Link to={`/asignaturas/${subjectId}`} className="hover:underline">
          {workshop?.subject.name ?? "..."}
        </Link>{" "}
        / {workshop?.name}
      </p>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">{workshop?.name}</h1>
          <p className="mt-1 text-on-surface-variant">Gestión de insumos y secciones para este taller práctico.</p>
        </div>
        <Link
          to={`/asignaturas/${subjectId}/talleres/${workshopId}/nueva-seccion`}
          className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:opacity-90"
        >
          <Plus size={18} />
          Nueva Sección
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-outline-variant bg-surface-lowest p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Total Alumnos Inscritos
          </p>
          <p className="mt-1 text-2xl font-bold text-on-surface">{totalStudents}</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-lowest p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Secciones Activas</p>
          <p className="mt-1 text-2xl font-bold text-on-surface">{workshop?.sections.length ?? 0}</p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-on-surface">Desglose por Secciones</h2>
      <div className="grid grid-cols-2 gap-4">
        {workshop?.sections.map((section) => {
          const critical = section.consumptionRecords.some(
            (r) => Number(r.usedQty) > Number(r.requiredQty)
          );
          return (
            <Link
              key={section.id}
              to={`/secciones/${section.id}`}
              className={`rounded-lg border p-4 hover:shadow-sm ${
                critical ? "border-danger/40 bg-danger-bg/30" : "border-outline-variant bg-surface-lowest"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-on-surface">{section.code}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-on-surface-variant">{section.studentsCount} alumnos</span>
                  <button
                    onClick={(e) => handleDuplicate(e, section)}
                    disabled={duplicateMutation.isPending}
                    title="Duplicar sección"
                    className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  >
                    <Copy size={14} />
                  </button>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEdit(e, section)}
                        title="Editar sección"
                        className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, section)}
                        title="Eliminar sección"
                        className="rounded-md p-1 text-on-surface-variant hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-on-surface-variant">
                {[section.dayOfWeek, section.startTime && section.endTime ? `${section.startTime} - ${section.endTime}` : null]
                  .filter(Boolean)
                  .join(" · ") || "Sin horario definido"}
              </p>
              <p className="mt-2 text-sm text-secondary">Ver detalles de insumos →</p>
            </Link>
          );
        })}

        {workshop && workshop.sections.length === 0 && (
          <p className="col-span-2 py-8 text-center text-on-surface-variant">
            Este taller no tiene secciones todavía.
          </p>
        )}
      </div>

      {editingSection && workshopId && (
        <EditSectionModal
          section={editingSection}
          workshopId={workshopId}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  );
}

function EditSectionModal({
  section,
  workshopId,
  onClose,
}: {
  section: Section;
  workshopId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: section.code,
    dayOfWeek: section.dayOfWeek ?? "",
    startTime: section.startTime ?? "",
    endTime: section.endTime ?? "",
    location: section.location ?? "",
    studentsCount: section.studentsCount,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/sections/${section.id}`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshop", workshopId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-surface-lowest p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-on-surface">Editar Sección</h2>
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
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-on-surface">Código</span>
              <input
                required
                className="input"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-on-surface">Ubicación</span>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-on-surface">Día</span>
              <input
                className="input"
                value={form.dayOfWeek}
                onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-on-surface">Inicio</span>
              <input
                type="time"
                className="input"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-on-surface">Término</span>
              <input
                type="time"
                className="input"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </label>
          </div>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-on-surface">Cantidad de Alumnos</span>
            <input
              type="number"
              min={0}
              className="input"
              value={form.studentsCount}
              onChange={(e) => setForm((f) => ({ ...f, studentsCount: Number(e.target.value) }))}
            />
          </label>
          {mutation.isError && <p className="text-sm text-danger">No se pudo guardar la sección.</p>}
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
              {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
