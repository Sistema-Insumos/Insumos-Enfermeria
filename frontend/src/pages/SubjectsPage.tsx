import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { GraduationCap, Plus, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { SubjectSummary } from "../types";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export function SubjectsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [year, setYear] = useState(CURRENT_YEAR);
  const [semester, setSemester] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const subjectsQuery = useQuery({
    queryKey: ["subjects", year, semester],
    queryFn: async () => {
      const { data } = await api.get("/api/subjects", { params: { year, semester } });
      return data as SubjectSummary[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      await api.delete(`/api/subjects/${subjectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  function handleDelete(e: React.MouseEvent, subject: SubjectSummary) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`¿Eliminar la asignatura "${subject.name}"? Esto también elimina sus talleres y secciones.`)) {
      deleteMutation.mutate(subject.id);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Gestión de Clases</h1>
          <p className="mt-1 text-on-surface-variant">Organiza y supervisa el inventario por periodos académicos.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:opacity-90"
        >
          <Plus size={18} />
          Añadir Nueva Asignatura
        </button>
      </div>

      <div className="mb-4 flex gap-2 border-b border-outline-variant">
        {YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-3 py-2 text-sm font-semibold ${
              year === y ? "border-b-2 border-secondary text-secondary" : "text-on-surface-variant"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="mb-6 flex gap-2">
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

      <div className="grid grid-cols-3 gap-4">
        {subjectsQuery.data?.map((subject) => (
          <Link
            key={subject.id}
            to={`/asignaturas/${subject.id}`}
            className="rounded-lg border border-outline-variant bg-surface-lowest p-4 hover:shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-md bg-surface-container p-2">
                <GraduationCap size={18} className="text-secondary" />
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    subject.stockStatus === "ALERTA" ? "bg-warning-bg text-warning" : "bg-success-bg text-success"
                  }`}
                >
                  {subject.stockStatus === "ALERTA" ? "Alerta Stock" : "Stock Normal"}
                </span>
                {user?.role === "ADMIN" && (
                  <button
                    onClick={(e) => handleDelete(e, subject)}
                    title="Eliminar asignatura"
                    className="rounded-md p-1 text-on-surface-variant hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-on-surface">{subject.name}</h3>
            <p className="text-sm text-on-surface-variant">{subject.professor ?? "Sin docente asignado"}</p>
            <div className="mt-3 flex justify-between border-t border-outline-variant pt-3 text-sm">
              <span className="text-on-surface-variant">Alumnos: {subject.studentsCount}</span>
              <span className="text-on-surface-variant">{subject.workshopsCount} talleres</span>
            </div>
          </Link>
        ))}

        {subjectsQuery.data?.length === 0 && (
          <p className="col-span-3 py-8 text-center text-on-surface-variant">
            No hay asignaturas para este periodo todavía.
          </p>
        )}
      </div>

      {modalOpen && <NewSubjectModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

function NewSubjectModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", code: "", category: "" });

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/subjects", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-surface-lowest p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-on-surface">Nueva Asignatura</h2>
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
            <span className="mb-1 block font-semibold text-on-surface">Nombre</span>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Laboratorio de Enzimas"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-on-surface">Código</span>
            <input
              required
              className="input"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="Ej. BIO-402"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-on-surface">Categoría</span>
            <input
              required
              className="input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Ej. Ciencias"
            />
          </label>
          {mutation.isError && <p className="text-sm text-danger">No se pudo crear la asignatura.</p>}
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
              {mutation.isPending ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
