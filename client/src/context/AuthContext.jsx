import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('leadflow_user') || 'null'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('leadflow_token')) && !user);

  useEffect(() => {
    const token = localStorage.getItem('leadflow_token');
    if (!token) return;
    api('/me').then(({ user }) => {
      setUser(user);
      localStorage.setItem('leadflow_user', JSON.stringify(user));
    }).catch(() => {
      localStorage.removeItem('leadflow_token');
      localStorage.removeItem('leadflow_user');
      setUser(null);
    }).finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api('/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('leadflow_token', data.token);
    localStorage.setItem('leadflow_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  async function register(name, email, password) {
    const data = await api('/register', { method: 'POST', body: { name, email, password } });
    localStorage.setItem('leadflow_token', data.token);
    localStorage.setItem('leadflow_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem('leadflow_token');
    localStorage.removeItem('leadflow_user');
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
