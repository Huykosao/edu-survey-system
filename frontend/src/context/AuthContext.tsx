"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  authApi,
  setTokens,
  clearTokens,
  getAccessToken,
  setStoredUser,
  getStoredUser,
  ApiError,
} from "@/lib/api";

// =============================================================
// Types
// =============================================================
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  status: string;
  roles?: string[];
  last_login?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// =============================================================
// Context
// =============================================================
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check stored auth on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser as unknown as User);
      }
      // Optionally verify with /auth/me
      authApi
        .me()
        .then((data) => {
          const u = data as unknown as User;
          setUser(u);
          setStoredUser(data);
        })
        .catch(() => {
          // Token invalid
          clearTokens();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await authApi.login(email, password);
        setTokens(res.access_token, res.refresh_token);
        const u = res.user as unknown as User;
        setUser(u);
        setStoredUser(res.user);
        return { success: true };
      } catch (err) {
        if (err instanceof ApiError) {
          const detail =
            typeof err.data === "object" && err.data && "detail" in (err.data as Record<string, unknown>)
              ? String((err.data as Record<string, unknown>).detail)
              : err.message;
          return { success: false, error: detail };
        }
        return { success: false, error: "Lỗi kết nối máy chủ" };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore error on logout
    }
    clearTokens();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      const u = data as unknown as User;
      setUser(u);
      setStoredUser(data);
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
