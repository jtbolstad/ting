-- CreateTable
CREATE TABLE "ItemTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "ItemTag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ItemTag_itemId_idx" ON "ItemTag"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemTag_itemId_name_key" ON "ItemTag"("itemId", "name");
