const express = require('express');
const router = express.Router();
const userShopRoleController = require('../controllers/userShopRoleController');
const { requireManager, requireOwner } = require('../middleware/rbac');
const { authenticateToken } = require('../middleware/auth');

// Protect all routes with authentication
router.use(authenticateToken);

// Assign role to user in shop (Manager+ required)
router.post('/assign', requireManager, userShopRoleController.assignRole);

// Update user role in shop (Manager+ required)
router.put('/:id', requireManager, userShopRoleController.updateRole);

// Remove user from shop (Owner required)
router.delete('/:id', requireOwner, userShopRoleController.removeRole);

// Get all users in a shop
router.get('/shop/:shopId/users', requireStaff, userShopRoleController.getShopUsers);

// Get all shops for a user
router.get('/user/:userId/shops', userShopRoleController.getUserShops);

module.exports = router;
