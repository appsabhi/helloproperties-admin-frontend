import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://helloproperties-admin-backend.vercel.app/api'
);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Helper to build headers with Authorization Bearer token if available
  const getAuthHeaders = () => {
    const token = localStorage.getItem('hp_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Check existing HTTP-Only cookie OR Bearer token session on initial mount / refresh
  const checkAuthStatus = async () => {
    try {
      setIsLoadingAuth(true);
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('hp_auth_token');
      }
    } catch (err) {
      console.warn('Session verification notice:', err.message);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Login handler
  const login = async (username, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        if (data.token) {
          localStorage.setItem('hp_auth_token', data.token);
        }
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true, user: data.user };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to authenticate. Please check your credentials.'
        };
      }
    } catch (err) {
      return {
        success: false,
        error: 'Unable to connect to authentication server. Please check your connection.'
      };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
    } catch (err) {
      console.warn('Logout API warning:', err.message);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('hp_auth_token');
      localStorage.removeItem('hp_logged_in');
      localStorage.removeItem('hp_user_role');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        login,
        logout,
        checkAuthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
