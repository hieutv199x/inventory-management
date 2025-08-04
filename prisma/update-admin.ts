import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateAdminUser() {
  console.log("Updating first user to ADMIN role...");

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: "tranlong2002.tt@gmail.com"
      }
    });

    if (user) {
      const updatedUser = await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          role: "ADMIN"
        }
      });

      console.log(`Updated user ${updatedUser.name} (${updatedUser.email}) to ADMIN role`);
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error("Error updating user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminUser();
