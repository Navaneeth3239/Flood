import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, RegisterPayload } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (payload: RegisterPayload) => Promise<boolean>;
  login: (mail: string, password: string) => Promise<boolean>;
  sendOtp: (phone: string) => Promise<{ success: boolean; devOtp?: string; message: string }>;
  verifyOtp: (phone: string, code: string, name?: string) => Promise<boolean>;
  logout: () => void;
  showAuthModal: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'scms_auth_token';
const USER_KEY = 'scms_auth_user';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const cached = localStorage.getItem(USER_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Validate session on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Backend offline or unreachable, keeping cached user if available.');
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const register = async (payload: RegisterPayload) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setShowAuthModal(false);
      return true;
    }
    return false;
  };

  const login = async (mail: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mail, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setShowAuthModal(false);
      return true;
    }
    return false;
  };

  const sendOtp = async (phone: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to dispatch verification code.');
    }
    return data;
  };

  const verifyOtp = async (phone: string, code: string, name?: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, name }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid OTP code.');
    }

    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setShowAuthModal(false);
      return true;
    }
    return false;
  };

  const logout = () => {
    try {
      fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' }).catch(() => {});
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        register,
        login,
        sendOtp,
        verifyOtp,
        logout,
        showAuthModal,
        openAuthModal: () => setShowAuthModal(true),
        closeAuthModal: () => setShowAuthModal(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

