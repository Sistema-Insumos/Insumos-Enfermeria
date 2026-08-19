import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertTriangle, Boxes, DollarSign, ShoppingCart } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

interface DashboardStats {
  totalInventoryValue: number;
  totalSkus: number;
  lowStockCount: number;
  categoriesCount: number;
  pendingOrders: number;
}

export function DashboardPage() {
  const { user } = useAuth();

  const statsQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/dashboard");
      return data as DashboardStats;
    },
  });

  const stats = statsQuery.data;

  return (
    <div>
      <h1 className="text-3xl font-bold text-on-surface">
        Bienvenido, {user?.firstName}
      </h1>
      <p className="mt-1 text-on-surface-variant">Resumen general del inventario académico.</p>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Valor Total del Inventario"
          value={`$${(stats?.totalInventoryValue ?? 0).toLocaleString()}`}
        />
        <StatCard icon={Boxes} label="Total de SKUs" value={String(stats?.totalSkus ?? "—")} />
        <StatCard
          icon={AlertTriangle}
          label="Artículos Bajo Stock"
          value={String(stats?.lowStockCount ?? "—")}
          tone={stats && stats.lowStockCount > 0 ? "danger" : "default"}
        />
        <StatCard
          icon={ShoppingCart}
          label="Órdenes Pendientes"
          value={String(stats?.pendingOrders ?? "—")}
        />
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <QuickLink to="/inventario" title="Inventario" description="Ver y gestionar insumos" />
        <QuickLink to="/asignaturas" title="Asignaturas" description="Gestión académica por periodo" />
        <QuickLink to="/proyecciones" title="Proyecciones" description="Necesidades del próximo semestre" />
        <QuickLink to="/equipamiento" title="Equipamiento" description="Activos fijos y mantenimiento" />
        <QuickLink to="/ordenes-compra" title="Órdenes de Compra" description="Cotizaciones y reposición" />
        <QuickLink to="/reportes" title="Reportes" description="Monitoreo anual de eficiencia" />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        tone === "danger" ? "border-danger/30 bg-danger-bg/40" : "border-outline-variant bg-surface-lowest"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
        <Icon size={16} className="text-on-surface-variant" />
      </div>
      <p className={`text-2xl font-bold ${tone === "danger" ? "text-danger" : "text-on-surface"}`}>{value}</p>
    </div>
  );
}

function QuickLink({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-outline-variant bg-surface-lowest p-4 hover:shadow-sm"
    >
      <h3 className="font-semibold text-on-surface">{title}</h3>
      <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
    </Link>
  );
}
