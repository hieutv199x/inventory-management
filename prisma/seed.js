```javascript
// ...existing code...

async function seedUserShopRoles() {
  // Assume we have existing users and shops
  const users = await prisma.user.findMany();
  const shops = await prisma.shop.findMany();

  if (users.length === 0 || shops.length === 0) {
    console.log('No users or shops found for seeding roles');
    return;
  }

  // Seed some user-shop relationships
  const roleMappings = [
    { userId: users[0]?.id, shopId: shops[0]?.id, role: 'OWNER' },
    { userId: users[1]?.id, shopId: shops[0]?.id, role: 'MANAGER' },
    { userId: users[2]?.id, shopId: shops[0]?.id, role: 'STAFF' },
    { userId: users[0]?.id, shopId: shops[1]?.id, role: 'MANAGER' },
    { userId: users[1]?.id, shopId: shops[1]?.id, role: 'OWNER' }
  ].filter(mapping => mapping.userId && mapping.shopId);

  for (const mapping of roleMappings) {
    await prisma.userShopRole.upsert({
      where: {
        userId_shopId: {
          userId: mapping.userId,
          shopId: mapping.shopId
        }
      },
      create: mapping,
      update: mapping
    });
  }

  console.log('Seeded user shop roles');
}

// Add seedUserShopRoles() to your main seed function
```