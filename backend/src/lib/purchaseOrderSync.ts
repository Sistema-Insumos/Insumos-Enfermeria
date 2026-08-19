import { Prisma, PrismaClient } from "@prisma/client";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Keeps the single auto-managed "preliminary" draft purchase order in sync with a
 * supply's current stock: below minStock adds/updates a line item for the deficit,
 * back at or above minStock removes it.
 */
export async function syncPreliminaryPurchaseOrder(tx: Tx, supplyId: string) {
  const supply = await tx.supply.findUnique({ where: { id: supplyId } });
  if (!supply) return;

  const neededQty = Math.max(supply.minStock - supply.currentStock, 0);
  const order = await tx.purchaseOrder.findFirst({
    where: { isPreliminary: true, status: "DRAFT" },
  });

  if (neededQty === 0) {
    if (order) {
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: order.id, supplyId } });
    }
    return;
  }

  const orderId = order ? order.id : (await tx.purchaseOrder.create({ data: { isPreliminary: true } })).id;
  const estimatedCost = new Prisma.Decimal(neededQty).mul(supply.unitValue);

  await tx.purchaseOrderItem.upsert({
    where: { purchaseOrderId_supplyId: { purchaseOrderId: orderId, supplyId } },
    create: { purchaseOrderId: orderId, supplyId, quantity: neededQty, estimatedCost },
    update: { quantity: neededQty, estimatedCost },
  });
}
