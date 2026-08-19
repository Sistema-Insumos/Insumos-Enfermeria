import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { api } from "../lib/api";
import type { Workshop, Subject } from "../types";

export function WorkshopDetailPage() {
  const { subjectId, workshopId } = useParams<{ subjectId: string; workshopId: string }>();

  const workshopQuery = useQuery({
    queryKey: ["workshop", workshopId],
    queryFn: async () => {
      const { data } = await api.get(`/api/workshops/${workshopId}`);
      return data as Workshop & { subject: Subject };
    },
  });

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
                <span className="text-sm text-on-surface-variant">{section.studentsCount} alumnos</span>
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
    </div>
  );
}
