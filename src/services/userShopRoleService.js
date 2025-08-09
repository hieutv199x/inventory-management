const userShopRoleRepository = require('../repositories/userShopRoleRepository');
const permissionService = require('./permissionService');

class UserShopRoleService {
  async assignRole({ userId, shopId, role, assignedBy }) {
    // Check if assigner has permission
    await permissionService.checkPermission(assignedBy, shopId, ['OWNER', 'MANAGER']);
    
    // Prevent downgrading owners (business rule)
    const existingRole = await userShopRoleRepository.findByUserAndShop(userId, shopId);
    if (existingRole && existingRole.role === 'OWNER' && role !== 'OWNER') {
      throw new Error('Cannot downgrade an owner role');
    }
    
    return await userShopRoleRepository.upsertRole({
      userId,
      shopId,
      role
    });
  }

  async updateRole(id, role, updatedBy) {
    const existingRole = await userShopRoleRepository.findById(id);
    if (!existingRole) {
      throw new Error('User shop role not found');
    }
    
    await permissionService.checkPermission(updatedBy, existingRole.shopId, ['OWNER', 'MANAGER']);
    
    // Prevent downgrading owners
    if (existingRole.role === 'OWNER' && role !== 'OWNER') {
      throw new Error('Cannot downgrade an owner role');
    }
    
    return await userShopRoleRepository.updateRole(id, role);
  }

  async removeRole(id, removedBy) {
    const existingRole = await userShopRoleRepository.findById(id);
    if (!existingRole) {
      throw new Error('User shop role not found');
    }
    
    await permissionService.checkPermission(removedBy, existingRole.shopId, ['OWNER']);
    
    // Prevent removing the last owner
    if (existingRole.role === 'OWNER') {
      const ownerCount = await userShopRoleRepository.countOwners(existingRole.shopId);
      if (ownerCount <= 1) {
        throw new Error('Cannot remove the last owner of a shop');
      }
    }
    
    return await userShopRoleRepository.deleteRole(id);
  }

  async getShopUsers(shopId) {
    return await userShopRoleRepository.findUsersByShop(shopId);
  }

  async getUserShops(userId) {
    return await userShopRoleRepository.findShopsByUser(userId);
  }
}

module.exports = new UserShopRoleService();
