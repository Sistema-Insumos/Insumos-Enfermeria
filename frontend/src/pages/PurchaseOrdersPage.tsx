import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { api } from "../lib/api";
import type { PurchaseOrder, Supply } from "../types";

const STATUS_LABEL: Record<PurchaseOrder["status"], string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  RECEIVED: "Recibida",
  CANCELLED: "Cancelada",
};

export function PurchaseOrdersPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const ordersQuery = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data } = await api.get("/api/purchase-orders");
      return data as PurchaseOrder[];
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Órdenes de Compra</h1>
          <p className="mt-1 text-on-surface-variant">Consolida insumos escasos y compara cotizaciones.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:opacity-90"
        >
          <Plus size={18} />
          Nueva Orden
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {ordersQuery.data?.map((order) => (
          <div key={order.id} className="rounded-lg border border-outline-variant bg-surface-lowest p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-xs text-on-surface-variant">
                Orden #{order.id.slice(-6).toUpperCase()} ·{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
                {STATUS_LABEL[order.status]}
              </span>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th className="py-1">Insumo</th>
                  <th className="py-1 text-right">Cantidad</th>
                  <th className="py-1 text-right">Costo Estimado</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-t border-outline-variant">
                    <td className="py-1.5">{item.supply.name}</td>
                    <td className="py-1.5 text-right">{item.quantity}</td>
                    <td className="py-1.5 text-right">${Number(item.estimatedCost).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {order.quotes.length > 0 && (
              <div className="mt-3 border-t border-outline-variant pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Cotizaciones
                </p>
                <div className="flex flex-wrap gap-2">
                  {order.quotes.map((q) => (
                    <span
                      key={q.id}
                      className="rounded-md border border-outline-variant px-2 py-1 text-xs text-on-surface-variant"
                    >
                      {q.supplier.name}: ${Number(q.total).toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {ordersQuery.data?.length === 0 && (
          <p className="py-8 text-center text-on-surface-variant">No hay órdenes de compra todavía.</p>
        )}
      </div>

      {modalOpen && <NewOrderModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

function NewOrderModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const suppliesQuery = useQuery({
    queryKey: ["supplies", ""],
    queryFn: async () => {
      const { data } = await api.get("/api/supplies", { params: { pageSize: 100 } });
      return data.items as Supply[];
    },
  });

  const [items, setItems] = useState([{ supplyId: "", quantity: 1, estimatedCost: 0 }]);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/purchase-orders", { items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      onClose();
    },
  });

  function updateItem(index: number, patch: Partial<(typeof items)[number]>) {
    setItems((list) => list.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-surface-lowest p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-on-surface">Nueva Orden de Compra</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-5 gap-2">
              <select
                required
                className="input col-span-3"
                value={item.supplyId}
                onChange={(e) => updateItem(i, { supplyId: e.target.value })}
              >
                <option value="">Seleccionar insumo...</option>
                {suppliesQuery.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                className="input"
                placeholder="Cant."
                value={item.quantity}
                onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
              />
              <input
                type="number"
                min={0}
                className="input"
                placeholder="Costo"
                value={item.estimatedCost}
                onChange={(e) => updateItem(i, { estimatedCost: Number(e.target.value) })}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => setItems((list) => [...list, { supplyId: "", quantity: 1, estimatedCost: 0 }])}
            className="self-start text-sm font-semibold text-secondary hover:underline"
          >
            + Añadir insumo
          </button>

          {mutation.isError && <p className="text-sm text-danger">No se pudo crear la orden.</p>}

          <div className="mt-2 flex justify-end gap-3 border-t border-outline-variant pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-outline-variant px-4 py-2 text-sm font-semibold hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:opacity-90 disabled:opacity-60"
            >
              {mutation.isPending ? "Creando..." : "Crear Orden"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
