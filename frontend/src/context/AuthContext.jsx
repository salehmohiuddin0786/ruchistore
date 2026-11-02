"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { getSocket, disconnectSocket } from "../lib/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (token) {
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          // Verify with server
          const res = await apiClient.get("/auth/me");
          if (res.data?.data?.user) {
            setUser(res.data.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.data.user));
            getSocket(); // Initialize real-time socket
          }
        }
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        disconnectSocket();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Password login
  const login = async (email, password) => {
    try {
      const res = await apiClient.post("/auth/login", { email, password });
      const { user: userData, token } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      getSocket();

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed. Check your credentials.",
      };
    }
  };

  // Request Phone OTP
  const requestOtp = async (phone) => {
    try {
      const res = await apiClient.post("/auth/send-otp", { phone });
      return { success: true, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Could not send OTP. Try again.",
      };
    }
  };

  // Verify Phone OTP & Login
  const loginWithOtp = async (phone, otp, name) => {
    try {
      const res = await apiClient.post("/auth/verify-otp", { phone, otp, name });
      const { user: userData, token } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      getSocket();

      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Invalid or expired OTP",
      };
    }
  };

  // Register
  const register = async (userData) => {
    try {
      const res = await apiClient.post("/auth/register", userData);
      const { user: newUser, token } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      getSocket();

      return { success: true, user: newUser };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  // Sign in with Google (Native Google Identity Services - No Firebase)
  const loginWithGoogle = async () => {
    try {
      const { loginWithGoogleSdk } = await import("../lib/googleAuth");
      const googleProfile = await loginWithGoogleSdk();

      const res = await apiClient.post("/auth/google", {
        accessToken: googleProfile.accessToken,
        email: googleProfile.email,
        name: googleProfile.name,
        photoURL: googleProfile.photoURL,
        uid: googleProfile.uid,
      });

      const { user: userData, token } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      getSocket();

      return { success: true, user: userData };
    } catch (error) {
      console.error("Google login error:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to sign in with Google";
      return { success: false, message };
    }
  };

  // Sign in with Facebook (Official Facebook JavaScript SDK - No Firebase)
  const loginWithFacebook = async () => {
    try {
      const { loginWithFacebookSdk } = await import("../lib/facebook");
      const fbProfile = await loginWithFacebookSdk();

      const res = await apiClient.post("/auth/facebook", fbProfile);
      const { user: userData, token } = res.data.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      getSocket();

      return { success: true, user: userData };
    } catch (error) {
      console.error("Facebook login error:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to sign in with Facebook";
      return { success: false, message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      disconnectSocket();
      window.location.href = "/";
    }
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem("user", JSON.stringify(merged));
      return merged;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get("/auth/me");
      if (res.data?.data?.user) {
        setUser(res.data.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.data.user));
        return res.data.data.user;
      }
    } catch (e) {}
  };

  const role = user?.role || "GUEST";
  const isAdmin = role === "ADMIN";
  const isShopOwner = role === "SHOP_OWNER";
  const isDeliveryPartner = role === "DELIVERY_PARTNER";
  const isCustomer = role === "CUSTOMER";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        isAdmin,
        isShopOwner,
        isDeliveryPartner,
        isCustomer,
        isAuthenticated: !!user,
        login,
        requestOtp,
        loginWithOtp,
        loginWithGoogle,
        loginWithFacebook,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
