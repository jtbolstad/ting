-- Add slug column to Item (nullable for backfill)
ALTER TABLE "Item" ADD COLUMN "slug" TEXT;

-- Create unique index
CREATE UNIQUE INDEX "Item_slug_key" ON "Item"("slug");
