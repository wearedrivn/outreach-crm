import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo123", 12);
  const user = await prisma.user.create({
    data: {
      name: "Jamel",
      email: "jamel@demo.com",
      passwordHash,
    },
  });

  await prisma.lead.createMany({
    data: [
      {
        companyName: "Maison Noir",
        niche: "Luxury Fashion",
        instagramHandle: "@maisonnoir",
        website: "https://maisonnoir.com",
        brandScore: 9,
        contentScore: 3,
        revenueScore: 8,
        status: "new",
        notes: "Strong visual identity but Instagram is inconsistent. High-ticket products.",
        userId: user.id,
      },
      {
        companyName: "Elevate Coaching",
        niche: "High-Ticket Coach",
        instagramHandle: "@elevatecoach",
        website: "https://elevatecoaching.io",
        brandScore: 7,
        contentScore: 4,
        revenueScore: 9,
        status: "new",
        notes: "Premium pricing, weak social proof. Content lacks authority.",
        userId: user.id,
      },
      {
        companyName: "Aura Skincare",
        niche: "Premium Beauty",
        instagramHandle: "@auraskin",
        website: "https://auraskincare.co",
        brandScore: 6,
        contentScore: 6,
        revenueScore: 6,
        status: "new",
        notes: "Mid-range positioning. Could go premium with better content strategy.",
        userId: user.id,
      },
      {
        companyName: "Atelier Blanc",
        niche: "Interior Design",
        instagramHandle: "@atelierblanc",
        website: "https://atelierblanc.com",
        brandScore: 8,
        contentScore: 2,
        revenueScore: 8,
        status: "new",
        notes: "Stunning portfolio, barely posting. Massive content opportunity.",
        userId: user.id,
      },
      {
        companyName: "Vertex Capital",
        niche: "Wealth Management",
        instagramHandle: "@vertexcap",
        website: "https://vertexcapital.com",
        brandScore: 8,
        contentScore: 5,
        revenueScore: 10,
        status: "contacted",
        notes: "Ultra high-net-worth clientele. Content is corporate and flat.",
        userId: user.id,
      },
    ],
  });

  console.log("Seeded 1 user (jamel@demo.com / demo123) and 5 leads");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
