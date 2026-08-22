import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileDown, Pencil, Plus, ShoppingCart, Sparkles, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../lib/api";
import { SupplyCombobox } from "../components/SupplyCombobox";
import type { PurchaseOrder, Supply } from "../types";

const STATUS_LABEL: Record<PurchaseOrder["status"], string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  RECEIVED: "Recibida",
  CANCELLED: "Cancelada",
};

function exportOrderToPdf(order: PurchaseOrder) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(`Orden de Compra #${order.id.slice(-6).toUpperCase()}`, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Fecha: ${new Date(order.createdAt).toLocaleDateString("es-CL")} · Estado: ${STATUS_LABEL[order.status]}`,
    14,
    24
  );

  autoTable(doc, {
    startY: 30,
    head: [["Insumo", "Cantidad", "Costo Estimado"]],
    body: order.items.map((item) => [
      item.supply.name,
      String(item.quantity),
      `$${Number(item.estimatedCost).toLocaleString()}`,
    ]),
  });

  if (order.quotes.length > 0) {
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Cotizaciones", 14, finalY + 10);
    autoTable(doc, {
      startY: finalY + 14,
      head: [["Proveedor", "Total", "Disponibilidad"]],
      body: order.quotes.map((q) => [
        q.supplier.name,
        `$${Number(q.total).toLocaleString()}`,
        q.availability ?? "—",
      ]),
    });
  }

  doc.save(`orden-compra-${order.id.slice(-6).toLowerCase()}.pdf`);
}

export function PurchaseOrdersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const { data } = await api.get("/api/purchase-orders");
      return data as PurchaseOrder[];
    },
  });

  const orders = [...(ordersQuery.data ?? [])].sort((a, b) =>
    a.isPreliminary === b.isPreliminary ? 0 : a.isPreliminary ? -1 : 1
  );

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
        {orders.map((order) => (
          <div
            key={order.id}
            className={`rounded-lg border p-4 ${
              order.isPreliminary
                ? "border-secondary/40 bg-secondary/5"
                : "border-outline-variant bg-surface-lowest"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-on-surface-variant">
                  Orden #{order.id.slice(-6).toUpperCase()} ·{" "}
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
                {order.isPreliminary && (
                  <span className="flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary">
                    <Sparkles size={12} />
                    Preliminar · se actualiza sola
                  </span>
                )}
                {order.fromProjection && (
                  <span className="flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary">
                    <ShoppingCart size={12} />
                    Desde Proyección
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
                  {STATUS_LABEL[order.status]}
                </span>
                <button
                  onClick={() => exportOrderToPdf(order)}
                  title="Exportar PDF"
                  className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                >
                  <FileDown size={14} />
                </button>
                <button
                  onClick={() => setEditingOrder(order)}
                  title="Editar orden"
                  className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                >
                  <Pencil size={14} />
                </button>
              </div>
            </div>
            {order.isPreliminary && (
              <p className="mb-3 text-xs text-on-surface-variant">
                Se arma automáticamente con los insumos que caen bajo su stock mínimo al reportar consumo o
                uso de equipamiento.
              </p>
            )}
            {order.fromProjection && (
              <p className="mb-3 text-xs text-on-surface-variant">
                Se arma con los insumos que enviaste manualmente desde Proyección.
              </p>
            )}

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

      {modalOpen && <OrderFormModal onClose={() => setModalOpen(false)} />}
      {editingOrder && (
        <OrderFormModal editing={editingOrder} onClose={() => setEditingOrder(null)} />
      )}
    </div>
  );
}

function OrderFormModal({ onClose, editing }: { onClose: () => void; editing?: PurchaseOrder }) {
  const queryClient = useQueryClient();
  const suppliesQuery = useQuery({
    queryKey: ["supplies", "", "asc"],
    queryFn: async () => {
      const { data } = await api.get("/api/supplies", {
        params: { pageSize: 1000, sortBy: "name", sortDir: "asc" },
      });
      return data.items as Supply[];
    },
  });

  const [items, setItems] = useState(
    editing
      ? editing.items.map((it) => ({
          supplyId: it.supplyId,
          quantity: it.quantity,
          estimatedCost: Number(it.estimatedCost),
        }))
      : [{ supplyId: "", quantity: 1, estimatedCost: 0 }]
  );
  const [status, setStatus] = useState<PurchaseOrder["status"]>(editing?.status ?? "DRAFT");

  const mutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await api.patch(`/api/purchase-orders/${editing.id}`, { status, items });
      } else {
        await api.post("/api/purchase-orders", { items });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      onClose();
    },
  });

  function updateItem(index: number, patch: Partial<(typeof items)[number]>) {
    setItems((list) => list.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    setItems((list) => list.filter((_, i) => i !== index));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-surface-lowest p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-on-surface">
            {editing ? "Editar Orden de Compra" : "Nueva Orden de Compra"}
          </h2>
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
          {editing && (
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-on-surface">Estado</span>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as PurchaseOrder["status"])}
              >
                <option value="DRAFT">Borrador</option>
                <option value="SENT">Enviada</option>
                <option value="RECEIVED">Recibida</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </label>
          )}
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-6 gap-2">
              <SupplyCombobox
                className="col-span-3"
                supplies={suppliesQuery.data ?? []}
                value={item.supplyId}
                onChange={(id) => updateItem(i, { supplyId: id })}
              />
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
              <button
                type="button"
                onClick={() => removeItem(i)}
                disabled={items.length <= 1}
                title="Quitar insumo"
                className="flex items-center justify-center rounded-md text-on-surface-variant hover:bg-danger-bg hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
              >
                <X size={16} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setItems((list) => [...list, { supplyId: "", quantity: 1, estimatedCost: 0 }])}
            className="self-start text-sm font-semibold text-secondary hover:underline"
          >
            + Añadir insumo
          </button>

          {mutation.isError && (
            <p className="text-sm text-danger">No se pudo guardar la orden.</p>
          )}

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
              {mutation.isPending
                ? "Guardando..."
                : editing
                  ? "Guardar Cambios"
                  : "Crear Orden"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
