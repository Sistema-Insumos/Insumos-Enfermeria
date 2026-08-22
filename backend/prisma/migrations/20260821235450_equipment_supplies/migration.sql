-- CreateTable: a stock pool exclusive to equipment, separate from the general Supply inventory
CREATE TABLE "EquipmentSupply" (
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

    CONSTRAINT "EquipmentSupply_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EquipmentSupply_sku_key" ON "EquipmentSupply"("sku");

-- Repoint EquipmentSupplyLink from Supply to EquipmentSupply (table was empty)
ALTER TABLE "EquipmentSupplyLink" DROP CONSTRAINT "EquipmentSupplyLink_supplyId_fkey";
DROP INDEX "EquipmentSupplyLink_equipmentId_supplyId_key";
ALTER TABLE "EquipmentSupplyLink" DROP COLUMN "supplyId";
ALTER TABLE "EquipmentSupplyLink" ADD COLUMN "equipmentSupplyId" TEXT NOT NULL;
CREATE UNIQUE INDEX "EquipmentSupplyLink_equipmentId_equipmentSupplyId_key" ON "EquipmentSupplyLink"("equipmentId", "equipmentSupplyId");
ALTER TABLE "EquipmentSupplyLink" ADD CONSTRAINT "EquipmentSupplyLink_equipmentSupplyId_fkey" FOREIGN KEY ("equipmentSupplyId") REFERENCES "EquipmentSupply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Repoint EquipmentUsage from Supply to EquipmentSupply (no rows existed)
ALTER TABLE "EquipmentUsage" DROP CONSTRAINT "EquipmentUsage_supplyId_fkey";
ALTER TABLE "EquipmentUsage" DROP COLUMN "supplyId";
ALTER TABLE "EquipmentUsage" ADD COLUMN "equipmentSupplyId" TEXT;
ALTER TABLE "EquipmentUsage" ADD CONSTRAINT "EquipmentUsage_equipmentSupplyId_fkey" FOREIGN KEY ("equipmentSupplyId") REFERENCES "EquipmentSupply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
