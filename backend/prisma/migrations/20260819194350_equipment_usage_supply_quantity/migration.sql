-- AlterTable
ALTER TABLE "EquipmentUsage" ADD COLUMN     "quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "supplyId" TEXT;

-- AddForeignKey
ALTER TABLE "EquipmentUsage" ADD CONSTRAINT "EquipmentUsage_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "Supply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
