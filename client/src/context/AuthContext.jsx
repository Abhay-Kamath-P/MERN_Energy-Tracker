import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('energy_tracker_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('energy_tracker_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('energy_tracker_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('energy_tracker_token', res.data.token);
      localStorage.setItem('energy_tracker_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
  };

  const quickLogin = async (role) => {
    const roleCredentials = {
      Admin: { email: 'admin@factory.com', password: 'admin123' },
      Manager: { email: 'manager@factory.com', password: 'manager123' },
      Operator: { email: 'operator@factory.com', password: 'operator123' },
    };
    const creds = roleCredentials[role] || roleCredentials.Operator;
    return await login(creds.email, creds.password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('energy_tracker_token');
    localStorage.removeItem('energy_tracker_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, quickLogin, logout }}>
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
