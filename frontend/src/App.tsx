import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { InventoryPage } from "./pages/InventoryPage";
import { SubjectsPage } from "./pages/SubjectsPage";
import { SubjectDetailPage } from "./pages/SubjectDetailPage";
import { WorkshopDetailPage } from "./pages/WorkshopDetailPage";
import { NewSectionPage } from "./pages/NewSectionPage";
import { SectionDetailPage } from "./pages/SectionDetailPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { RoomDetailPage } from "./pages/RoomDetailPage";
import { AllEquipmentPage } from "./pages/AllEquipmentPage";
import { EquipmentSuppliesPage } from "./pages/EquipmentSuppliesPage";
import { ProjectionsPage } from "./pages/ProjectionsPage";
import { PurchaseOrdersPage } from "./pages/PurchaseOrdersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportsPage } from "./pages/ReportsPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/asignaturas" element={<SubjectsPage />} />
          <Route path="/asignaturas/:subjectId" element={<SubjectDetailPage />} />
          <Route
            path="/asignaturas/:subjectId/talleres/:workshopId"
            element={<WorkshopDetailPage />}
          />
          <Route
            path="/asignaturas/:subjectId/talleres/:workshopId/nueva-seccion"
            element={<NewSectionPage />}
          />
          <Route path="/secciones/:sectionId" element={<SectionDetailPage />} />
          <Route path="/inventario" element={<InventoryPage />} />
          <Route path="/proyecciones" element={<ProjectionsPage />} />
          <Route path="/ordenes-compra" element={<PurchaseOrdersPage />} />
          <Route path="/equipamiento" element={<EquipmentPage />} />
          <Route path="/equipamiento/general" element={<AllEquipmentPage />} />
          <Route path="/equipamiento/insumos" element={<EquipmentSuppliesPage />} />
          <Route path="/equipamiento/:roomId" element={<RoomDetailPage />} />
          <Route path="/reportes" element={<ReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
