import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutGrid,
  GraduationCap,
  Archive,
  TrendingUp,
  ShoppingCart,
  Wrench,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../lib/auth";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/asignaturas", label: "Asignaturas", icon: GraduationCap },
  { to: "/inventario", label: "Inventario", icon: Archive },
  { to: "/proyecciones", label: "Proyecciones", icon: TrendingUp },
  { to: "/ordenes-compra", label: "Órdenes de Compra", icon: ShoppingCart },
  { to: "/equipamiento", label: "Equipamiento", icon: Wrench },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
];

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-72 flex-col justify-between border-r border-outline-variant bg-surface-lowest px-4 py-6">
        <div>
          <div className="mb-8 px-2">
            <h1 className="text-xl font-bold text-primary">AcademicStock</h1>
            <p className="text-sm text-on-surface-variant">Gestión Académica</p>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-on-secondary"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-outline-variant pt-4">
          <div className="mb-2 px-2 text-sm">
            <p className="font-semibold text-on-surface">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-on-surface-variant">{user?.department ?? user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
