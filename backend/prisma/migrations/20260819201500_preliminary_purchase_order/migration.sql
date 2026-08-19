-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN "isPreliminary" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderItem_purchaseOrderId_supplyId_key" ON "PurchaseOrderItem"("purchaseOrderId", "supplyId");
