"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { httpClient } from '@/lib/http-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'SELLER' | 'RESOURCE';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utility functions for localStorage session management
const AUTH_STORAGE_KEYS = {
  TOKEN: "auth_token",
  USER: "auth_user", 
  EXPIRY: "auth_expiry"
};

const isSessionExpired = (expiryTime: number): boolean => {
  return Date.now() >= expiryTime;
};

const isSessionExpiringSoon = (expiryTime: number, minutes: number = 30): boolean => {
  const warningTime = expiryTime - (minutes * 60 * 1000);
  return Date.now() >= warningTime;
};

const storeAuthData = (token: string, userData: User) => {
  const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(userData));
  localStorage.setItem(AUTH_STORAGE_KEYS.EXPIRY, expiryTime.toString());
};

const getStoredAuthData = () => {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
  const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
  const expiryStr = localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRY);
  
  if (!token || !userStr || !expiryStr) {
    return null;
  }
  
  try {
    const user = JSON.parse(userStr);
    const expiry = parseInt(expiryStr);
    return { token, user, expiry };
  } catch (error) {
    console.error("Error parsing stored auth data:", error);
    return null;
  }
};

const clearStoredAuthData = () => {
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  localStorage.removeItem(AUTH_STORAGE_KEYS.EXPIRY);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedAuth = getStoredAuthData();
        
        if (storedAuth) {
          if (isSessionExpired(storedAuth.expiry)) {
            // Session expired, clear data
            clearStoredAuthData();
            httpClient.clearAuthToken();
          } else {
            // Set token in HTTP client and restore user
            httpClient.setAuthToken(storedAuth.token);
            setUser(storedAuth.user);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        clearStoredAuthData();
        httpClient.clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Auto-refresh session when it's close to expiring
  useEffect(() => {
    if (!user) return;

    const checkAndRefreshSession = async () => {
      const storedAuth = getStoredAuthData();
      if (storedAuth && isSessionExpiringSoon(storedAuth.expiry, 15)) { // 15 minutes before expiry
        try {
          console.log("Auto-refreshing session...");
          const data = await httpClient.get("/auth/me");
          const refreshedUser = data.user;
          storeAuthData(storedAuth.token, refreshedUser);
          setUser(refreshedUser);
          console.log("Session auto-refreshed successfully");
        } catch (error) {
          console.error("Failed to auto-refresh session:", error);
          // Session is invalid, logout
          clearAuthData();
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkAndRefreshSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await httpClient.post('/auth/login', { email, password });
      
      // Store auth data
      storeAuthData(data.token, data.user);
      
      // Set token in HTTP client
      httpClient.setAuthToken(data.token);
      
      setUser(data.user);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthData();
    router.push('/signin');
  };

  const clearAuthData = () => {
    setUser(null);
    clearStoredAuthData();
    httpClient.clearAuthToken();
    console.log("Authentication data cleared");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};