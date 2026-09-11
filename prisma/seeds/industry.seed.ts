import { PrismaClient } from "@prisma/client";

export async function seedIndustries(prisma: PrismaClient) {
  const industries = [
    {
      name: "Pharmaceutical",
      code: "PHARMA",
      description: "Pharmaceutical & healthcare product companies",
      isFeatured: true,
      displayOrder: 1,
    },
    // future e notun industry add korte hole ekhane push koro, jemon:
    // { name: 'FMCG', code: 'FMCG', displayOrder: 2 },
  ];

  for (const industry of industries) {
    await prisma.industry.upsert({
      where: { code: industry.code },
      update: {},
      create: { ...industry, isActive: true },
    });
  }

  console.log(`✅ Seeded ${industries.length} industries`);
}
