import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Set up Axios default headers
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/auth/me`);
      setUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user context', err);
      logout();
    }
  };

  const login = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    try {
      const response = await axios.get(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${newToken}` }
      });
      setUser(response.data);
    } catch (err) {
      console.error('Login profile check failed', err);
      logout();
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        await fetchUser();
      }
      setLoading(false);
    };
    initializeAuth();
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchUser }}>
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
