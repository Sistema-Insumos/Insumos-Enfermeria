import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

interface ReportRecord {
  id: string;
  sectionId: string;
  supplyName: string;
  subjectName: string;
  workshopName: string;
  sectionCode: string;
  usedQty: string;
  reusedQty: string;
  discardedQty: string;
  reportedAt: string;
}

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
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();
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

  const recordsQuery = useQuery({
    queryKey: ["reports-records", year, semester],
    queryFn: async () => {
      const { data } = await api.get("/api/reports/records", {
        params: { year: year ?? undefined, semester: semester ?? undefined },
      });
      return data as ReportRecord[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (record: ReportRecord) => {
      await api.delete(`/api/sections/${record.sectionId}/consumption/${record.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports-records"] });
      queryClient.invalidateQueries({ queryKey: ["reports-annual"] });
      queryClient.invalidateQueries({ queryKey: ["supplies"] });
    },
    onError: () => {
      alert("No se pudo eliminar el reporte. Intenta nuevamente.");
    },
  });

  function handleDeleteRecord(record: ReportRecord) {
    if (
      confirm(
        `¿Eliminar este reporte de "${record.supplyName}" (${record.subjectName} / ${record.workshopName} / ${record.sectionCode})? Esto revierte el stock descontado.`
      )
    ) {
      deleteMutation.mutate(record);
    }
  }

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

      <h2 className="mt-8 mb-4 text-lg font-semibold text-on-surface">Historial de Reportes</h2>
      <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Insumo</th>
              <th className="px-4 py-3">Asignatura / Taller / Sección</th>
              <th className="px-4 py-3 text-right">Utilizada</th>
              <th className="px-4 py-3 text-right">Reutilizada</th>
              <th className="px-4 py-3 text-right">Desechada</th>
              {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {recordsQuery.data?.map((record) => (
              <tr key={record.id} className="border-t border-outline-variant hover:bg-surface-low">
                <td className="px-4 py-3 text-on-surface-variant">
                  {new Date(record.reportedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-medium">{record.supplyName}</td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {record.subjectName} / {record.workshopName} / {record.sectionCode}
                </td>
                <td className="px-4 py-3 text-right">{record.usedQty}</td>
                <td className="px-4 py-3 text-right text-success">{record.reusedQty}</td>
                <td className="px-4 py-3 text-right text-danger">{record.discardedQty}</td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteRecord(record)}
                      title="Eliminar reporte"
                      className="rounded-md p-1 text-on-surface-variant hover:bg-danger-bg hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {recordsQuery.data?.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-4 py-8 text-center text-on-surface-variant">
                  No hay reportes para este período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
