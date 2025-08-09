import { httpClient, ApiResponse } from './http-client';

// User API methods
export const userApi = {
  getAll: (params?: string) => httpClient.get(`/users${params || ''}`),
  
  getById: (id: string) => httpClient.get(`/users/${id}`),
  
  create: (userData: {
    name: string;
    email: string;
    role: string;
    password: string;
  }) => httpClient.post('/users', userData),
  
  update: (id: string, userData: {
    name: string;
    email: string;
    role: string;
    password?: string;
  }) => httpClient.put(`/users/${id}`, userData),
  
  delete: (id: string) => httpClient.delete(`/users/${id}`),
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
  getAll: () => httpClient.get('/shops'),
  
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

// Auth API methods
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    httpClient.post('/auth/login', credentials),
    
  logout: () => httpClient.post('/auth/logout'),
  
  refreshToken: () => httpClient.post('/auth/refresh'),
  
  getCurrentUser: () => httpClient.get('/auth/me'),
};
