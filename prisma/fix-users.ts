import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixUpdatedAtField() {
  console.log("Fixing updatedAt field for existing users...");

  try {
    // Use raw MongoDB operations to fix null updatedAt fields
    const result = await prisma.$runCommandRaw({
      update: "User",
      updates: [
        {
          q: { updatedAt: { $exists: false } },
          u: { $set: { updatedAt: new Date() } },
          multi: true
        },
        {
          q: { updatedAt: null },
          u: { $set: { updatedAt: new Date() } },
          multi: true
        }
      ]
    });

    console.log("Update result:", result);

    // Verify the fix by counting users
    const userCount = await prisma.user.count();
    console.log(`Total users after fix: ${userCount}`);

    // Test if we can now fetch users
    const testUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
      take: 5,
    });

    console.log("Sample users after fix:");
    testUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}): updatedAt = ${user.updatedAt}`);
    });

    console.log("All users have been updated successfully!");
  } catch (error) {
    console.error("Error fixing updatedAt field:", error);
  }
}

fixUpdatedAtField()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
