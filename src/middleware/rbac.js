const permissionService = require('../services/permissionService');

const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const shopId = req.params.shopId || req.body.shopId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      if (!shopId) {
        return res.status(400).json({
          success: false,
          message: 'Shop ID is required'
        });
      }
      
      await permissionService.checkPermission(userId, shopId, roles);
      
      // Add user role to request for further use
      const userRole = await permissionService.getUserRole(userId, shopId);
      req.userRole = userRole;
      
      next();
    } catch (error) {
      res.status(403).json({
        success: false,
        message: error.message
      });
    }
  };
};

module.exports = {
  requireRole,
  requireOwner: requireRole(['OWNER']),
  requireManager: requireRole(['OWNER', 'MANAGER']),
  requireStaff: requireRole(['OWNER', 'MANAGER', 'STAFF'])
};
