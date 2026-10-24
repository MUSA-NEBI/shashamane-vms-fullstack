/**
 * useAuth.js
 * Context + hook for authentication state across the app.
 * Provides: user, isLoading, login, logout, register
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/authService';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until we check session

  // On mount: check if there's an active session (JWT cookie is still valid)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await authAPI.getMe();
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();

    // Listen for 401 events from api.js interceptor
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('svms:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('svms:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Still clear local state even if server call fails
    }
    setUser(null);
    toast.info('You have been logged out.');
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
