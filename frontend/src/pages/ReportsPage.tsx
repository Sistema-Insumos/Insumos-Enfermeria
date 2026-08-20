import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface AnnualItem {
  id: string;
  name: string;
  category: string;
  totalReused: number;
  totalDiscarded: number;
  efficiency: number;
  currentStock: number;
  maxStock: number | null;
  stockRatio: number | null;
  qtyToBuy: number;
}

interface AnnualReport {
  items: AnnualItem[];
  totalReused: number;
  totalDiscarded: number;
  avgEfficiency: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export function ReportsPage() {
  const [year, setYear] = useState<number | null>(null);
  const [semester, setSemester] = useState<number | null>(null);

  const reportQuery = useQuery({
    queryKey: ["reports-annual", year, semester],
    queryFn: async () => {
      const { data } = await api.get("/api/reports/annual", {
        params: { year: year ?? undefined, semester: semester ?? undefined },
      });
      return data as AnnualReport;
    },
  });

  const data = reportQuery.data;
  const totalToBuy = data?.items.reduce((sum, i) => sum + i.qtyToBuy, 0) ?? 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-on-surface">Monitoreo Anual</h1>
      <p className="mt-1 text-on-surface-variant">
        Ciclo de vida de insumos y métricas de eficiencia a través de los periodos académicos.
      </p>

      <div className="my-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setYear(null)}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            year === null ? "bg-secondary text-on-secondary" : "border border-outline-variant text-on-surface-variant"
          }`}
        >
          Todos los años
        </button>
        {YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
              year === y ? "bg-secondary text-on-secondary" : "border border-outline-variant text-on-surface-variant"
            }`}
          >
            {y}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-outline-variant" />
        <button
          onClick={() => setSemester(null)}
          className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
            semester === null
              ? "border-secondary bg-secondary/10 text-secondary"
              : "border-outline-variant text-on-surface-variant"
          }`}
        >
          Ambos Semestres
        </button>
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

      <div className="mb-6 grid grid-cols-4 gap-4">
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
        <div className="rounded-lg border border-outline-variant bg-surface-lowest p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Cantidad a Comprar (hasta el máximo)
          </p>
          <p className="mt-1 text-2xl font-bold text-secondary">{totalToBuy}</p>
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
              <th className="px-4 py-3 text-right">Stock / Máximo</th>
              <th className="px-4 py-3 text-right">Cant. a Comprar</th>
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
                <td className="px-4 py-3 text-right">
                  {item.maxStock !== null ? (
                    <>
                      {item.currentStock} / {item.maxStock}
                      <p className="text-xs text-on-surface-variant">{item.stockRatio?.toFixed(0)}%</p>
                    </>
                  ) : (
                    <span className="text-on-surface-variant">sin máximo definido</span>
                  )}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${item.qtyToBuy > 0 ? "text-secondary" : ""}`}>
                  {item.qtyToBuy}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                  Aún no hay ajustes post-clase registrados para este período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
