import { httpClient, ApiResponse } from './http-client';

// User API methods
export const userApi = {
  getAll: (params?: string) => httpClient.get(`/users${params || ''}`),
  
  getById: (id: string) => httpClient.get(`/users/${id}`),
  
  create: (userData: {
    name: string;
    username: string;
    role: string;
    password: string;
  }) => httpClient.post('/users', userData),
  
  update: (id: string, userData: {
    name: string;
    username: string;
    role: string;
    password?: string;
  }) => httpClient.put(`/users/${id}`, userData),
  
  delete: (id: string) => httpClient.delete(`/users/${id}`),

  toggleStatus: (id: string, statusData: { isActive: boolean }) =>
    httpClient.put(`/users/${id}/toggle-status`, statusData),

  resetPassword: (id: string, passwordData: { password: string }) =>
    httpClient.put(`/users/${id}/reset-password`, passwordData),
};

// User Shop Role API methods
export const userShopRoleApi = {
  getAll: (params?: string) => httpClient.get(`/user-shop-roles${params || ''}`),
  
  create: (roleData: {
    userId: string;
    shopId: string;
    role: string;
  }) => httpClient.post('/user-shop-roles', roleData),
  
  update: (id: string, roleData: { role: string }) => 
    httpClient.put(`/user-shop-roles/${id}`, roleData),
  
  delete: (id: string) => httpClient.delete(`/user-shop-roles/${id}`),
};

// Shop API methods
export const shopApi = {
  getAll: (params?: string) => httpClient.get(`/shops${params || ''}`),
  
  getById: (id: string) => httpClient.get(`/shops/${id}`),
  
  create: (shopData: {
    shopName: string;
    description?: string;
  }) => httpClient.post('/shops', shopData),
  
  update: (id: string, shopData: {
    shopName: string;
    description?: string;
  }) => httpClient.put(`/shops/${id}`, shopData),
  
  delete: (id: string) => httpClient.delete(`/shops/${id}`),
};

export const shopGroupApi = {
  getAll: (params?: string) => httpClient.get(`/shop-groups${params || ''}`),

  getById: (id: string) => httpClient.get(`/shop-groups/${id}`),

  create: (payload: {
    name: string;
    description?: string;
    managerId: string;
    memberIds?: string[];
  }) => httpClient.post('/shop-groups', payload),

  update: (id: string, payload: {
    name?: string;
    description?: string | null;
    managerId?: string;
    memberIds?: string[];
    defaultMemberId?: string | null;
  }) => httpClient.patch(`/shop-groups/${id}`, payload),

  delete: (id: string) => httpClient.delete(`/shop-groups/${id}`),

  moveShop: (shopId: string, payload: { groupId: string | null }) =>
    httpClient.patch(`/shops/${shopId}/group`, payload),
};

// Auth API methods
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    httpClient.post('/auth/login', credentials),
    
  logout: () => httpClient.post('/auth/logout'),
  
  refreshToken: () => httpClient.post('/auth/refresh'),
  
  getCurrentUser: () => httpClient.get('/auth/me'),
};
