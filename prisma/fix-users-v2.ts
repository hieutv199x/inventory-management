import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixUpdatedAtField() {
  console.log("Fixing updatedAt field for existing users...");

  try {
    // Fix string dates first - convert string ISO dates to proper Date objects
    const stringDateResult = await prisma.$runCommandRaw({
      update: "User",
      updates: [
        {
          q: { updatedAt: { $type: "string" } },
          u: [{ $set: { updatedAt: { $dateFromString: { dateString: "$updatedAt" } } } }],
          multi: true
        }
      ]
    });
    
    console.log("String date conversion result:", stringDateResult);

    // Then handle null/missing updatedAt fields
    const now = new Date();
    const result = await prisma.$runCommandRaw({
      update: "User",
      updates: [
        {
          q: { updatedAt: { $exists: false } },
          u: { $set: { updatedAt: now } },
          multi: true
        },
        {
          q: { updatedAt: null },
          u: { $set: { updatedAt: now } },
          multi: true
        }
      ]
    });

    console.log("Null date fix result:", result);

    // Verify the fix by counting users
    const userCount = await prisma.user.count();
    console.log(`Total users after fix: ${userCount}`);

    console.log("All users have been updated successfully!");
    
    // Now try to test if we can fetch users
    console.log("Testing user fetch...");
    const testUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
      take: 3,
    });

    console.log("Sample users after fix:");
    testUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}): updatedAt = ${user.updatedAt}`);
    });

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
