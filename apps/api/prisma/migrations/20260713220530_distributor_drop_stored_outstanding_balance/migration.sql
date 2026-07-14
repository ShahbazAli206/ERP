-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Distributor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "creditLimit" REAL NOT NULL DEFAULT 0,
    "pricingGroupId" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Distributor_pricingGroupId_fkey" FOREIGN KEY ("pricingGroupId") REFERENCES "PricingGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Distributor" ("address", "contactEmail", "contactName", "contactPhone", "createdAt", "creditLimit", "id", "isActive", "name", "pricingGroupId", "region", "updatedAt") SELECT "address", "contactEmail", "contactName", "contactPhone", "createdAt", "creditLimit", "id", "isActive", "name", "pricingGroupId", "region", "updatedAt" FROM "Distributor";
DROP TABLE "Distributor";
ALTER TABLE "new_Distributor" RENAME TO "Distributor";
CREATE INDEX "Distributor_region_idx" ON "Distributor"("region");
CREATE INDEX "Distributor_pricingGroupId_idx" ON "Distributor"("pricingGroupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
