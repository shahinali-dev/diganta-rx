import { PrismaClient } from "@prisma/client";
import { seedIndustries } from "./seeds/industry.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");

  await seedIndustries(prisma);
  // future e notun seed module asle ekhane line add korbe:
  // await seedRolePermissions(prisma);

  console.log("🌱 Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
