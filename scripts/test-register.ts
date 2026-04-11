import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const testEmail = `test-${Date.now()}@example.com`;
  console.log("Attempting to create user:", testEmail);

  try {
    const existing = await prisma.user.findUnique({ where: { email: testEmail } });
    console.log("findUnique OK, existing:", existing);

    const passwordHash = await bcrypt.hash("testpass123", 12);
    console.log("hash OK, length:", passwordHash.length);

    const user = await prisma.user.create({
      data: { name: "Test User", email: testEmail, passwordHash },
    });
    console.log("CREATED:", user);

    const check = await prisma.user.findUnique({ where: { email: testEmail } });
    console.log("verified:", check?.id);

    await prisma.user.delete({ where: { id: user.id } });
    console.log("cleanup OK");
  } catch (e) {
    console.error("ERROR:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
