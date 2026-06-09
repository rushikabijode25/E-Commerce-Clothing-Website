import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('luxe_token') || null);

  useEffect(() => {
    if (token) {
      try {
        const payloadStr = atob(token.split('.')[1]);
        const payload = JSON.parse(payloadStr);
        // ✅ Now email & name are in JWT payload so they survive page refresh
        setUser({
          id: payload.id,
          role: payload.role,
          email: payload.email || null,
          name: payload.name || null
        });
      } catch (e) {
        setToken(null);
        localStorage.removeItem('luxe_token');
      }
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post((import.meta.env.VITE_API_URL || 'https://e-commerce-wensite.onrender.com/api') + '/users/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('luxe_token', res.data.token);
  };

  const register = async (name, email, password) => {
    const res = await axios.post((import.meta.env.VITE_API_URL || 'https://e-commerce-wensite.onrender.com/api') + '/users/register', { name, email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('luxe_token', res.data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('luxe_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
