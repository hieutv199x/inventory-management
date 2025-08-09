const { prisma } = require('../config/database');

class UserShopRoleRepository {
  async findByUserAndShop(userId, shopId) {
    return await prisma.userShopRole.findUnique({
      where: {
        userId_shopId: {
          userId,
          shopId
        }
      },
      include: {
        user: true,
        shop: true
      }
    });
  }

  async findById(id) {
    return await prisma.userShopRole.findUnique({
      where: { id },
      include: {
        user: true,
        shop: true
      }
    });
  }

  async upsertRole({ userId, shopId, role }) {
    return await prisma.userShopRole.upsert({
      where: {
        userId_shopId: {
          userId,
          shopId
        }
      },
      create: {
        userId,
        shopId,
        role
      },
      update: {
        role
      },
      include: {
        user: true,
        shop: true
      }
    });
  }

  async updateRole(id, role) {
    return await prisma.userShopRole.update({
      where: { id },
      data: { role },
      include: {
        user: true,
        shop: true
      }
    });
  }

  async deleteRole(id) {
    return await prisma.userShopRole.delete({
      where: { id }
    });
  }

  async findUsersByShop(shopId) {
    return await prisma.userShopRole.findMany({
      where: { shopId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { user: { name: 'asc' } }
      ]
    });
  }

  async findShopsByUser(userId) {
    return await prisma.userShopRole.findMany({
      where: { userId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { shop: { name: 'asc' } }
      ]
    });
  }

  async countOwners(shopId) {
    return await prisma.userShopRole.count({
      where: {
        shopId,
        role: 'OWNER'
      }
    });
  }
}

module.exports = new UserShopRoleRepository();
