import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ProjectionResponse } from "../types";

const STATUS_LABEL = { CRITICO: "Crítico", ATENCION: "Atención", SUFICIENTE: "Suficiente" };
const STATUS_TONE = {
  CRITICO: "bg-danger-bg text-danger",
  ATENCION: "bg-warning-bg text-warning",
  SUFICIENTE: "bg-success-bg text-success",
};

export function ProjectionsPage() {
  const projectionQuery = useQuery({
    queryKey: ["projections"],
    queryFn: async () => {
      const { data } = await api.get("/api/projections");
      return data as ProjectionResponse;
    },
  });

  const data = projectionQuery.data;

  return (
    <div>
      <h1 className="text-3xl font-bold text-on-surface">Proyección de Semestre</h1>
      <p className="mt-1 text-on-surface-variant">Análisis de necesidades para el próximo periodo académico.</p>

      <div className="my-6 grid grid-cols-2 gap-4">
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
                <td className="px-4 py-3 text-right">{item.projectedNeed}</td>
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
    </div>
  );
}
