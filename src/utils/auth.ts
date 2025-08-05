/* eslint-disable @typescript-eslint/no-unused-vars */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient, User as PrismaUser } from "@prisma/client";
import Cookies from "js-cookie"; // Import js-cookie
import { NextApiRequest, NextApiResponse } from "next";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

type User = PrismaUser;

export const generateToken = (userId: string): string => {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" });
  console.log("Generated Token:", token);
  return token;
};

export const verifyToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    console.log("Verified Token:", decoded);
    return decoded;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
};

export const getSessionServer = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<User | null> => {
  const token = req.cookies["session_id"];
  console.log("Session ID from cookies:", token);
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  console.log("User from session:", user);
  return user;
};

export const getSessionClient = async (): Promise<User | null> => {
  const token = Cookies.get("session_id");
  console.log("Session ID from cookies:", token);
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  console.log("User from session:", user);
  return user;
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Add AUTH_STORAGE_KEYS constant to match the context
const AUTH_STORAGE_KEYS = {
  TOKEN: "auth_token",
  USER: "auth_user",
  EXPIRY: "auth_expiry",
};

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    // Handle different token formats (JWT vs simple tokens)
    const parts = token.split(".");
    if (parts.length !== 3) {
      // Not a JWT token, assume it's valid for now
      // You might want to implement different validation logic here
      return false;
    }

    const payload = JSON.parse(atob(parts[1]));

    // Check if exp field exists
    if (!payload.exp) {
      // No expiration field, assume token is valid
      return false;
    }

    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error("Token validation error:", error);
    // If we can't parse the token, don't immediately assume it's expired
    // This prevents issues with non-JWT tokens
    return false;
  }
};

export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    // Use consistent AUTH_STORAGE_KEYS
    return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN) || null;
  }
  return null;
};

export const clearToken = (): void => {
  if (typeof window !== "undefined") {
    // Use consistent AUTH_STORAGE_KEYS
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    localStorage.removeItem(AUTH_STORAGE_KEYS.EXPIRY);
    // Clear cookie as well
    Cookies.remove("session_id", { path: "/" });
  }
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  // Check if we have expiry time stored
  if (typeof window !== "undefined") {
    const expiryStr = localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRY);
    if (expiryStr) {
      const expiry = parseInt(expiryStr);
      const isExpired = Date.now() >= expiry;
      if (isExpired) {
        clearToken(); // Clean up expired session
        return false;
      }
    }
  }

  return !isTokenExpired(token);
};

// Add helper function to get stored user data
export const getStoredUser = () => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        return null;
      }
    }
  }
  return null;
};

// Add helper function to check if session is expiring soon
export const isSessionExpiringSoon = (minutes: number = 15): boolean => {
  if (typeof window !== "undefined") {
    const expiryStr = localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRY);
    if (expiryStr) {
      const expiry = parseInt(expiryStr);
      const warningTime = expiry - minutes * 60 * 1000;
      return Date.now() >= warningTime;
    }
  }
  return false;
};
