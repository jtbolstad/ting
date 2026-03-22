-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "imageUrl" TEXT,
    "locationId" TEXT,
    "ownerId" TEXT,
    "ownerType" TEXT NOT NULL DEFAULT 'ORGANIZATION',
    "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "rejectionNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Item_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("approvalStatus", "categoryId", "createdAt", "description", "id", "imageUrl", "locationId", "name", "organizationId", "ownerId", "ownerType", "rejectionNote", "status", "updatedAt") SELECT "approvalStatus", "categoryId", "createdAt", "description", "id", "imageUrl", "locationId", "name", "organizationId", "ownerId", "ownerType", "rejectionNote", "status", "updatedAt" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_organizationId_idx" ON "Item"("organizationId");
CREATE INDEX "Item_ownerId_idx" ON "Item"("ownerId");
CREATE TABLE "new_ItemManual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ItemManual_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ItemManual" ("content", "createdAt", "id", "itemId", "label", "type", "updatedAt", "url") SELECT "content", "createdAt", "id", "itemId", "label", "type", "updatedAt", "url" FROM "ItemManual";
DROP TABLE "ItemManual";
ALTER TABLE "new_ItemManual" RENAME TO "ItemManual";
CREATE INDEX "ItemManual_itemId_idx" ON "ItemManual"("itemId");
CREATE TABLE "new_Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Location" ("address", "createdAt", "description", "id", "name", "organizationId", "updatedAt") SELECT "address", "createdAt", "description", "id", "name", "organizationId", "updatedAt" FROM "Location";
DROP TABLE "Location";
ALTER TABLE "new_Location" RENAME TO "Location";
CREATE INDEX "Location_organizationId_idx" ON "Location"("organizationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
