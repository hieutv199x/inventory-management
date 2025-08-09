const userShopRoleService = require('../services/userShopRoleService');
const { validateRequest } = require('../middleware/validation');

class UserShopRoleController {
  async assignRole(req, res) {
    try {
      const { userId, shopId, role } = req.body;
      const assignedBy = req.user.id;
      
      const userShopRole = await userShopRoleService.assignRole({
        userId,
        shopId,
        role,
        assignedBy
      });
      
      res.status(201).json({
        success: true,
        data: userShopRole
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const updatedBy = req.user.id;
      
      const userShopRole = await userShopRoleService.updateRole(id, role, updatedBy);
      
      res.json({
        success: true,
        data: userShopRole
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async removeRole(req, res) {
    try {
      const { id } = req.params;
      const removedBy = req.user.id;
      
      await userShopRoleService.removeRole(id, removedBy);
      
      res.json({
        success: true,
        message: 'User role removed successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getShopUsers(req, res) {
    try {
      const { shopId } = req.params;
      
      const users = await userShopRoleService.getShopUsers(shopId);
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getUserShops(req, res) {
    try {
      const { userId } = req.params;
      
      const shops = await userShopRoleService.getUserShops(userId);
      
      res.json({
        success: true,
        data: shops
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new UserShopRoleController();
