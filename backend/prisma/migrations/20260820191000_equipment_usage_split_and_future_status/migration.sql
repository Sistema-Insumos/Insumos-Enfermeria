-- AlterTable: split EquipmentUsage.quantity into used/reused/discarded
ALTER TABLE "EquipmentUsage" ADD COLUMN "usedQty" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "EquipmentUsage" ADD COLUMN "reusedQty" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "EquipmentUsage" ADD COLUMN "discardedQty" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "EquipmentUsage" SET "usedQty" = "quantity";

ALTER TABLE "EquipmentUsage" DROP COLUMN "quantity";

-- CreateEnum
CREATE TYPE "FutureNeedStatus" AS ENUM ('PENDING', 'IN_PROGRESS');

-- AlterTable
ALTER TABLE "FutureSupplyNeed" ADD COLUMN "status" "FutureNeedStatus" NOT NULL DEFAULT 'PENDING';
