import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { SubjectDetail, Workshop } from "../types";

export function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const isAdmin = user?.role === "ADMIN";

  const subjectQuery = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: async () => {
      const { data } = await api.get(`/api/subjects/${subjectId}`);
      return data as SubjectDetail;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (workshopId: string) => {
      await api.delete(`/api/workshops/${workshopId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject", subjectId] });
    },
  });

  function handleDelete(e: React.MouseEvent, workshop: Workshop) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`¿Eliminar el taller "${workshop.name}"? Esto también elimina sus secciones.`)) {
      deleteMutation.mutate(workshop.id);
    }
  }

  function handleEdit(e: React.MouseEvent, workshop: Workshop) {
    e.preventDefault();
    e.stopPropagation();
    setEditingWorkshop(workshop);
  }

  const subject = subjectQuery.data;

  return (
    <div>
      <p className="mb-2 text-sm text-on-surface-variant">
        <Link to="/asignaturas" className="hover:underline">
          Asignaturas
        </Link>{" "}
        / {subject?.name ?? "..."}
      </p>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            {subject && (
              <span className="rounded-md bg-surface-container px-2 py-0.5 text-xs font-mono text-on-surface-variant">
                {subject.code}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-on-surface">{subject?.name}</h1>
          <p className="mt-1 text-on-surface-variant">
            Gestión de talleres prácticos, inventario de reactivos y asignación de equipamiento.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:opacity-90"
        >
          <Plus size={18} />
          Nuevo Taller
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {subject?.workshops.map((workshop) => (
          <Link
            key={workshop.id}
            to={`/asignaturas/${subjectId}/talleres/${workshop.id}`}
            className="rounded-lg border border-outline-variant bg-surface-lowest p-4 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
                {workshop.code}
              </span>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleEdit(e, workshop)}
                    title="Editar taller"
                    className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, workshop)}
                    title="Eliminar taller"
                    className="rounded-md p-1 text-on-surface-variant hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-on-surface">{workshop.name}</h3>
            <p className="text-sm text-on-surface-variant">
              {workshop.professor ? `${workshop.professor.firstName} ${workshop.professor.lastName}` : "Sin docente"}
            </p>
            <p className="mt-3 border-t border-outline-variant pt-3 text-sm text-secondary">
              {workshop.sections.length} secciones →
            </p>
          </Link>
        ))}

        {subject && subject.workshops.length === 0 && (
          <p className="col-span-3 py-8 text-center text-on-surface-variant">
            Esta asignatura no tiene talleres todavía.
          </p>
        )}
      </div>

      {modalOpen && subjectId && (
        <WorkshopFormModal subjectId={subjectId} onClose={() => setModalOpen(false)} />
      )}
      {editingWorkshop && subjectId && (
        <WorkshopFormModal
          subjectId={subjectId}
          editing={editingWorkshop}
          onClose={() => setEditingWorkshop(null)}
        />
      )}
    </div>
  );
}

function WorkshopFormModal({
  subjectId,
  onClose,
  editing,
}: {
  subjectId: string;
  onClose: () => void;
  editing?: Workshop;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ code: editing?.code ?? "", name: editing?.name ?? "" });

  const mutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await api.patch(`/api/workshops/${editing.id}`, form);
      } else {
        await api.post("/api/workshops", { ...form, subjectId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject", subjectId] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-surface-lowest p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-on-surface">{editing ? "Editar Taller" : "Nuevo Taller"}</h2>
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
            <span className="mb-1 block font-semibold text-on-surface">Código</span>
            <input
              required
              className="input"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="Ej. TALLER 01"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-on-surface">Nombre</span>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Cinética Enzimática Básica"
            />
          </label>
          {mutation.isError && <p className="text-sm text-danger">No se pudo guardar el taller.</p>}
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
              {mutation.isPending ? "Guardando..." : editing ? "Guardar Cambios" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
