const userShopRoleRepository = require('../repositories/userShopRoleRepository');

class PermissionService {
  async checkPermission(userId, shopId, allowedRoles) {
    const userRole = await userShopRoleRepository.findByUserAndShop(userId, shopId);
    
    if (!userRole) {
      throw new Error('Access denied: User not associated with this shop');
    }
    
    if (!allowedRoles.includes(userRole.role)) {
      throw new Error(`Access denied: Requires one of: ${allowedRoles.join(', ')}`);
    }
    
    return true;
  }

  async getUserRole(userId, shopId) {
    const userRole = await userShopRoleRepository.findByUserAndShop(userId, shopId);
    return userRole?.role || null;
  }

  hasPermission(userRole, requiredRoles) {
    return requiredRoles.includes(userRole);
  }
}

module.exports = new PermissionService();
