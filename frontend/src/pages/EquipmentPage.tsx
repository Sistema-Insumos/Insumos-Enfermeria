import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Boxes, DoorOpen, LayoutGrid, NotebookText } from "lucide-react";
import { api } from "../lib/api";
import type { EquipmentSupply, Room, StationerySupply } from "../types";

export function EquipmentPage() {
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data } = await api.get("/api/rooms");
      return data as Room[];
    },
  });

  const equipmentSuppliesQuery = useQuery({
    queryKey: ["equipment-supplies", ""],
    queryFn: async () => {
      const { data } = await api.get("/api/equipment-supplies", { params: { pageSize: 1000 } });
      return data as { items: EquipmentSupply[]; total: number };
    },
  });

  const lowStockSupplies =
    equipmentSuppliesQuery.data?.items.filter((i) => i.currentStock < i.minStock).length ?? 0;

  const stationerySuppliesQuery = useQuery({
    queryKey: ["stationery-supplies", ""],
    queryFn: async () => {
      const { data } = await api.get("/api/stationery-supplies", { params: { pageSize: 1000 } });
      return data as { items: StationerySupply[]; total: number };
    },
  });

  const lowStockStationery =
    stationerySuppliesQuery.data?.items.filter((i) => i.currentStock < i.minStock).length ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-on-surface">Equipamiento</h1>
        <p className="mt-1 text-on-surface-variant">
          Selecciona una sala para ver y gestionar su equipamiento.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {roomsQuery.data && roomsQuery.data.length > 0 && (
          <Link
            to="/equipamiento/general"
            className="rounded-lg border border-secondary bg-secondary/5 p-4 hover:shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/15">
                <LayoutGrid size={22} className="text-secondary" />
              </span>
              {roomsQuery.data.reduce((sum, r) => sum + r.badCount, 0) > 0 && (
                <span className="rounded-full bg-danger-bg px-2 py-0.5 text-xs font-semibold text-danger">
                  {roomsQuery.data.reduce((sum, r) => sum + r.badCount, 0)} en mal estado
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-on-surface">GENERAL</h3>
            <p className="mt-3 border-t border-outline-variant pt-3 text-sm text-secondary">
              {roomsQuery.data.reduce((sum, r) => sum + r.equipmentCount, 0)} equipos en todas las salas →
            </p>
          </Link>
        )}
        <Link
          to="/equipamiento/insumos"
          className="rounded-lg border border-secondary bg-secondary/5 p-4 hover:shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/15">
              <Boxes size={22} className="text-secondary" />
            </span>
            {lowStockSupplies > 0 && (
              <span className="rounded-full bg-danger-bg px-2 py-0.5 text-xs font-semibold text-danger">
                {lowStockSupplies} bajo stock
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-on-surface">COMPLEMENTARIO</h3>
          <p className="mt-3 border-t border-outline-variant pt-3 text-sm text-secondary">
            {equipmentSuppliesQuery.data?.total ?? 0} insumos propios de equipos →
          </p>
        </Link>
        <Link
          to="/equipamiento/papeleria"
          className="rounded-lg border border-secondary bg-secondary/5 p-4 hover:shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/15">
              <NotebookText size={22} className="text-secondary" />
            </span>
            {lowStockStationery > 0 && (
              <span className="rounded-full bg-danger-bg px-2 py-0.5 text-xs font-semibold text-danger">
                {lowStockStationery} bajo stock
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-on-surface">PAPELERIA</h3>
          <p className="mt-3 border-t border-outline-variant pt-3 text-sm text-secondary">
            {stationerySuppliesQuery.data?.total ?? 0} insumos de oficina →
          </p>
        </Link>
        {roomsQuery.data?.map((room) => (
          <Link
            key={room.id}
            to={`/equipamiento/${room.id}`}
            className="rounded-lg border border-outline-variant bg-surface-lowest p-4 hover:shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/10">
                <DoorOpen size={22} className="text-secondary" />
              </span>
              {room.badCount > 0 && (
                <span className="rounded-full bg-danger-bg px-2 py-0.5 text-xs font-semibold text-danger">
                  {room.badCount} en mal estado
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-on-surface">{room.name}</h3>
            <p className="mt-3 border-t border-outline-variant pt-3 text-sm text-secondary">
              {room.equipmentCount} equipos →
            </p>
          </Link>
        ))}

        {roomsQuery.data?.length === 0 && (
          <p className="col-span-3 py-8 text-center text-on-surface-variant">No hay salas registradas.</p>
        )}
      </div>
    </div>
  );
}
