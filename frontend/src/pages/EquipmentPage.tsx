import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DoorOpen } from "lucide-react";
import { api } from "../lib/api";
import type { Room } from "../types";

export function EquipmentPage() {
  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data } = await api.get("/api/rooms");
      return data as Room[];
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-on-surface">Equipamiento</h1>
        <p className="mt-1 text-on-surface-variant">
          Selecciona una sala para ver y gestionar su equipamiento.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {roomsQuery.data?.map((room) => (
          <Link
            key={room.id}
            to={`/equipamiento/${room.id}`}
            className="rounded-lg border border-outline-variant bg-surface-lowest p-4 hover:shadow-sm"
          >
            <span className="rounded-md bg-surface-container p-2">
              <DoorOpen size={18} className="text-secondary" />
            </span>
            <h3 className="mt-3 text-lg font-semibold text-on-surface">{room.name}</h3>
            <p className="mt-2 border-t border-outline-variant pt-3 text-sm text-secondary">
              {room._count?.equipment ?? 0} equipos →
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
