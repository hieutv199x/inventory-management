import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with demo users...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin User",
      username: "admin",
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // Create manager user
  const managerPassword = await bcrypt.hash("manager@1234", 12);
  const manager = await prisma.user.upsert({
    where: { username: "manager" },
    update: {},
    create: {
      name: "Manager User",
      username: "manager",
      password: managerPassword,
      role: UserRole.MANAGER,
      isActive: true,
      createdBy: admin.id,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
