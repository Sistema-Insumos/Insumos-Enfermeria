import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface AnnualItem {
  id: string;
  name: string;
  category: string;
  totalReused: number;
  totalDiscarded: number;
  efficiency: number;
}

interface AnnualReport {
  items: AnnualItem[];
  totalReused: number;
  totalDiscarded: number;
  avgEfficiency: number;
}

export function ReportsPage() {
  const reportQuery = useQuery({
    queryKey: ["reports-annual"],
    queryFn: async () => {
      const { data } = await api.get("/api/reports/annual");
      return data as AnnualReport;
    },
  });

  const data = reportQuery.data;

  return (
    <div>
      <h1 className="text-3xl font-bold text-on-surface">Monitoreo Anual</h1>
      <p className="mt-1 text-on-surface-variant">
        Ciclo de vida de insumos y métricas de eficiencia a través de los periodos académicos.
      </p>

      <div className="my-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-outline-variant bg-surface-lowest p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Total Reutilizado</p>
          <p className="mt-1 text-2xl font-bold text-success">{data?.totalReused ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-lowest p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Total Desechado</p>
          <p className="mt-1 text-2xl font-bold text-danger">{data?.totalDiscarded ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface-lowest p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Tasa de Eficiencia Promedio
          </p>
          <p className="mt-1 text-2xl font-bold text-on-surface">
            {data ? data.avgEfficiency.toFixed(1) : "—"}%
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Insumo</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Total Reutilizado</th>
              <th className="px-4 py-3 text-right">Total Desechado</th>
              <th className="px-4 py-3 text-right">Eficiencia</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => (
              <tr key={item.id} className="border-t border-outline-variant hover:bg-surface-low">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3 text-right">{item.totalReused}</td>
                <td className="px-4 py-3 text-right">{item.totalDiscarded}</td>
                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    item.efficiency >= 70 ? "text-success" : item.efficiency >= 40 ? "text-warning" : "text-danger"
                  }`}
                >
                  {item.efficiency.toFixed(1)}%
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-on-surface-variant">
                  Aún no hay ajustes post-clase registrados para generar el reporte.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
