"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import axiosInstance from "@/utils/axiosInstance";

interface User {
  id: string;
  name?: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "ACCOUNTANT" | "SELLER" | "RESOURCE";
  isActive: boolean;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Auto-refresh session when it's close to expiring
  useEffect(() => {
    if (!isLoggedIn) return;

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
  }, [isLoggedIn]);

  useEffect(() => {
    // Initialize local storage with default values if not already set
    if (localStorage.getItem("theme") === null) {
      localStorage.setItem("theme", "light");
    }

    const checkSession = async () => {
      // First, check if we have stored session data in localStorage
      const storedAuth = getStoredAuthData();

      console.log("Checking stored session data:", storedAuth);

      // If we have stored data and it hasn't expired, restore the session
      if (storedAuth && !isSessionExpired(storedAuth.expiry)) {
        setIsLoggedIn(true);
        setUser(storedAuth.user);
        
        // Also set the cookie for API requests
        Cookies.set("session_id", storedAuth.token, { path: "/" });
        
        console.log("Session restored from localStorage:", storedAuth.user);
        
        // Check if session is expiring soon and refresh if needed
        if (isSessionExpiringSoon(storedAuth.expiry)) {
          console.log("Session expiring soon, attempting to refresh...");
          try {
            const response = await axiosInstance.get("/auth/me");
            const refreshedUser = response.data;
            
            // Update stored data with fresh expiry time
            storeAuthData(storedAuth.token, refreshedUser);
            setUser(refreshedUser);
            console.log("Session refreshed successfully");
          } catch (error) {
            console.error("Failed to refresh session:", error);
            // If refresh fails, keep the current session until it expires
          }
        }
        
        return; // Early return, no need to check server
      }

      // If stored session has expired or doesn't exist, clean up
      if (storedAuth && isSessionExpired(storedAuth.expiry)) {
        console.log("Stored session has expired");
        clearAuthData();
      }

      // Check cookies for fallback compatibility
      const sessionId = Cookies.get("session_id");
      console.log("Session ID from cookies:", sessionId);
      
      if (sessionId) {
        try {
          // Validate session with server
          const response = await axiosInstance.get("/auth/me");
          const session = response.data;
          
          console.log("Session validated with server:", session);
          
          if (session) {
            const userData = {
              id: session.id,
              name: session.name,
              email: session.email,
              role: session.role || "SELLER",
              isActive: session.isActive !== false,
            };
            
            setIsLoggedIn(true);
            setUser(userData);
            
            // Store in localStorage for persistence
            storeAuthData(sessionId, userData);
            
            console.log("Session stored in localStorage");
          } else {
            clearAuthData();
          }
        } catch (error) {
          console.error("Error validating session:", error);
          clearAuthData();
        }
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      const result = response.data;
      const userData: User = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        isActive: result.user.isActive,
      };

      setIsLoggedIn(true);
      setUser(userData);
      
      // Set cookie for API requests
      Cookies.set("session_id", result.token, { 
        path: "/",
        expires: 1, // 1 day
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Store in localStorage for persistence
      storeAuthData(result.token, userData);

      console.log("Login successful, session stored:", {
        token: result.token,
        sessionId: result.sessionId,
        user: userData
      });
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
      clearAuthData();
      console.log("Logout successful, session ID removed");
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  };

  const clearAuthData = () => {
    setIsLoggedIn(false);
    setUser(null);
    Cookies.remove("session_id", { path: "/" });
    clearStoredAuthData();
    console.log("Authentication data cleared");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
