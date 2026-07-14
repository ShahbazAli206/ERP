-- DropIndex
DROP INDEX "InventoryLot_lotNumber_idx";

-- DropIndex
DROP INDEX "InventoryLot_productId_warehouseId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLot_productId_warehouseId_lotNumber_key" ON "InventoryLot"("productId", "warehouseId", "lotNumber");
