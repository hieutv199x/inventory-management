import api from './api'; // Adjust the import path as necessary

export const userShopRoleApi = {
  assignRole: (data) => api.post('/user-shop-roles/assign', data),
  updateRole: (id, data) => api.put(`/user-shop-roles/${id}`, data),
  removeRole: (id) => api.delete(`/user-shop-roles/${id}`),
  getShopUsers: (shopId) => api.get(`/user-shop-roles/shop/${shopId}/users`),
  getUserShops: (userId) => api.get(`/user-shop-roles/user/${userId}/shops`),
  getUserRole: (userId, shopId) => api.get(`/user-shop-roles/user/${userId}/shops`).then(response => ({
    data: { data: response.data.data.find(shop => shop.shopId === shopId)?.role }
  }))
};