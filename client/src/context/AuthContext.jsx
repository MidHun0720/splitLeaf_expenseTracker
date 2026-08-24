import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const res = await API.get('/auth/profile');
          // If we have a stored user, keep it; otherwise set from profile
          if (!user) {
            setUser({ id: res.data.user.id });
          }
        } catch (error) {
          console.error("Token invalid", error);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    validateToken();
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token: newToken, name, email: userEmail } = res.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    const userData = { name, email: userEmail };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return res;
  };

  const signup = async (name, email, password) => {
    const res = await API.post('/auth/signup', { name, email, password });
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
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
