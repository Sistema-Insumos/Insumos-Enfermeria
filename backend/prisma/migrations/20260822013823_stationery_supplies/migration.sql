-- CreateTable: a stock pool for office/stationery supplies, independent from
-- the general Supply inventory and from EquipmentSupply
CREATE TABLE "StationerySupply" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "unit" TEXT NOT NULL DEFAULT 'uds',
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "maxStock" INTEGER,
    "newStock" INTEGER NOT NULL DEFAULT 0,
    "reusableStock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationerySupply_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StationerySupply_sku_key" ON "StationerySupply"("sku");
