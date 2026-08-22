-- AlterTable: mark the auto-managed draft order accumulated from Proyección sends,
-- kept separate from the stock-based "isPreliminary" order and manual orders.
ALTER TABLE "PurchaseOrder" ADD COLUMN "fromProjection" BOOLEAN NOT NULL DEFAULT false;
