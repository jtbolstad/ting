import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const items = await prisma.$queryRaw<{ id: string; name: string }[]>`
    SELECT id, name FROM "Item" WHERE slug IS NULL
  `;

  console.log(`Backfilling ${items.length} items...`);

  for (const item of items) {
    const base = toSlug(item.name);
    const suffix = item.id.slice(-6);
    const slug = `${base}-${suffix}`;
    await prisma.$executeRaw`UPDATE "Item" SET slug = ${slug} WHERE id = ${item.id}`;
    console.log(`  ${item.id} → ${slug}`);
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
