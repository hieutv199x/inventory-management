import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with demo users...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@demo.com",
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // Create manager user
  const managerPassword = await bcrypt.hash("manager123", 12);
  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: {},
    create: {
      name: "Manager User",
      email: "manager@demo.com",
      password: managerPassword,
      role: UserRole.MANAGER,
      isActive: true,
      createdBy: admin.id,
    },
  });

  // Create accountant user
  const accountantPassword = await bcrypt.hash("accountant123", 12);
  const accountant = await prisma.user.upsert({
    where: { email: "accountant@demo.com" },
    update: {},
    create: {
      name: "Accountant User",
      email: "accountant@demo.com",
      password: accountantPassword,
      role: UserRole.ACCOUNTANT,
      isActive: true,
      createdBy: admin.id,
    },
  });

  // Create seller user
  const sellerPassword = await bcrypt.hash("seller123", 12);
  const seller = await prisma.user.upsert({
    where: { email: "seller@demo.com" },
    update: {},
    create: {
      name: "Seller User",
      email: "seller@demo.com",
      password: sellerPassword,
      role: UserRole.SELLER,
      isActive: true,
      createdBy: manager.id,
    },
  });

  // Create resource user
  const resourcePassword = await bcrypt.hash("resource123", 12);
  const resource = await prisma.user.upsert({
    where: { email: "resource@demo.com" },
    update: {},
    create: {
      name: "Resource User",
      email: "resource@demo.com",
      password: resourcePassword,
      role: UserRole.RESOURCE,
      isActive: true,
      createdBy: manager.id,
    },
  });

  console.log("Demo users created:");
  console.log("- Admin:", admin.email);
  console.log("- Manager:", manager.email);
  console.log("- Accountant:", accountant.email);
  console.log("- Seller:", seller.email);
  console.log("- Resource:", resource.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
