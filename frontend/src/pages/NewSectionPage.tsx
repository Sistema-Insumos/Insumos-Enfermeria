import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Workshop, Subject } from "../types";

const CURRENT_YEAR = new Date().getFullYear();

export function NewSectionPage() {
  const { subjectId, workshopId } = useParams<{ subjectId: string; workshopId: string }>();
  const navigate = useNavigate();

  const workshopQuery = useQuery({
    queryKey: ["workshop", workshopId],
    queryFn: async () => {
      const { data } = await api.get(`/api/workshops/${workshopId}`);
      return data as Workshop & { subject: Subject };
    },
  });

  const [form, setForm] = useState({
    code: "",
    year: CURRENT_YEAR,
    semester: 1,
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    location: "",
    studentsCount: 0,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/sections", { ...form, workshopId });
    },
    onSuccess: () => navigate(`/asignaturas/${subjectId}/talleres/${workshopId}`),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg border border-outline-variant bg-surface-lowest p-6">
        <h1 className="text-xl font-bold text-on-surface">Crear Nueva Sección de Taller</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Configure los detalles de la sección para{" "}
          <span className="font-semibold">{workshopQuery.data?.subject.name}</span> —{" "}
          {workshopQuery.data?.name}.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mt-6 flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Código/Número de Sección">
              <input
                required
                className="input"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="Ej. Sección 02"
              />
            </Field>
            <Field label="Profesor / Ubicación">
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Ej. Lab. Química, Edificio Ciencias"
              />
            </Field>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Field label="Año">
              <input
                type="number"
                required
                className="input"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Semestre">
              <select
                className="input"
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}
              >
                <option value={1}>Primero</option>
                <option value={2}>Segundo</option>
              </select>
            </Field>
            <Field label="Día">
              <input
                className="input"
                value={form.dayOfWeek}
                onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
                placeholder="Lunes"
              />
            </Field>
            <Field label="Cantidad de Alumnos">
              <input
                type="number"
                min={0}
                className="input"
                value={form.studentsCount}
                onChange={(e) => setForm((f) => ({ ...f, studentsCount: Number(e.target.value) }))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Hora Inicio">
              <input
                type="time"
                className="input"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </Field>
            <Field label="Hora Término">
              <input
                type="time"
                className="input"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </Field>
          </div>

          <p className="text-xs text-on-surface-variant">
            Los alumnos por sección calcularán automáticamente los insumos necesarios para esta instancia
            específica del taller.
          </p>

          {mutation.isError && <p className="text-sm text-danger">No se pudo crear la sección.</p>}

          <div className="mt-2 flex justify-end gap-3 border-t border-outline-variant pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md border border-outline-variant px-4 py-2 text-sm font-semibold hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:opacity-90 disabled:opacity-60"
            >
              {mutation.isPending ? "Creando..." : "Crear Sección"}
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
