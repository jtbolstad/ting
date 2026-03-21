-- CreateTable: Location
CREATE TABLE "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: ItemManual
CREATE TABLE "ItemManual" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemManual_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AlterTable: Item - add ownership and approval fields
ALTER TABLE "Item" ADD COLUMN "locationId" TEXT;
ALTER TABLE "Item" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Item" ADD COLUMN "ownerType" TEXT NOT NULL DEFAULT 'ORGANIZATION';
ALTER TABLE "Item" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Item" ADD COLUMN "rejectionNote" TEXT;

-- CreateIndex
CREATE INDEX "Location_organizationId_idx" ON "Location"("organizationId");
CREATE INDEX "ItemManual_itemId_idx" ON "ItemManual"("itemId");
CREATE INDEX "Item_ownerId_idx" ON "Item"("ownerId");
