"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import axiosInstance from "@/utils/axiosInstance";

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

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const userData = localStorage.getItem("user_data");
        
        if (token && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
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
          const response = await axiosInstance.get("/auth/me");
          const refreshedUser = response.data;
          storeAuthData(storedAuth.token, refreshedUser);
          setUser(refreshedUser);
          console.log("Session auto-refreshed successfully");
        } catch (error) {
          console.error("Failed to auto-refresh session:", error);
          // Check if it's an axios error with 401 status
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { status: number } };
            if (axiosError.response?.status === 401) {
              // Session is invalid, logout
              clearAuthData();
            }
          }
        }
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkAndRefreshSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password
      });

      const { token, user } = response.data;
      
      // Store authentication data
      storeAuthData(token, user);
      setUser(user);
    } catch (error) {
      console.error("Login failed:", error);
      // Check if it's an axios error with response data
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        const errorMessage = axiosError.response?.data?.message || 'Login failed';
        throw new Error(errorMessage);
      }
      throw new Error('Network error occurred');
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    setUser(null);
    Cookies.remove("session_id", { path: "/" });
    clearStoredAuthData();
    console.log("Authentication data cleared");
  };

  const clearAuthData = () => {
    setUser(null);
    Cookies.remove("session_id", { path: "/" });
    clearStoredAuthData();
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
