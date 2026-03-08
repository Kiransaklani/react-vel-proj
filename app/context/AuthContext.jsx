"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { API_ENDPOINTS } from "../config/api";

const AuthContext = createContext(null);

// Pages that don't require auth
const PUBLIC_PATHS = ["/login", "/register"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      setLoading(false);
      if (!PUBLIC_PATHS.includes(pathname)) {
        router.push("/login");
      }
      return;
    }

    // On public pages, use cached user data instead of calling API
    if (PUBLIC_PATHS.includes(pathname)) {
      const cached = localStorage.getItem("user");
      if (cached) {
        setUser(JSON.parse(cached));
      }
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.PROFILE, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.data || data;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        // Token invalid
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        setUser(null);
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push("/login");
        }
      }
    } catch {
      // Network error — use cached user data if available
      const cached = localStorage.getItem("user");
      if (cached) {
        setUser(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    const token = data.token || data.data?.token;
    const userData = data.user || data.data?.user;

    if (token) {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      router.push("/dashboard");
    } else {
      throw new Error("No token received");
    }

    return data;
  };

  const register = async (name, email, password, passwordConfirmation) => {
    const response = await fetch(API_ENDPOINTS.REGISTER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle Laravel validation errors
      if (data.errors) {
        const firstError = Object.values(data.errors)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
      }
      throw new Error(data.message || "Registration failed");
    }

    const token = data.token || data.data?.token;
    const userData = data.user || data.data?.user;

    if (token) {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      router.push("/dashboard");
    } else {
      throw new Error("No token received");
    }

    return data;
  };

  const logout = async () => {
    const token = localStorage.getItem("auth_token");

    try {
      await fetch(API_ENDPOINTS.LOGOUT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Logout even if API fails
    }

    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
