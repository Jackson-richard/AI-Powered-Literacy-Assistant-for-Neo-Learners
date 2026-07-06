import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await axios.get(`${API_URL}/auth/profile`);
          if (res.data && res.data.success) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data && res.data.success) {
        const { token: userToken, user: userData } = res.data;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        return { success: true };
      }
    } catch (err) {
      console.error('Login error:', err);
      return {
        success: false,
        message: err.response?.data?.message || err.response?.data?.error || 'Invalid credentials',
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, userData);
      if (res.data && res.data.success) {
        const { token: userToken, user: newUser } = res.data;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(newUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
        return { success: true };
      }
    } catch (err) {
      console.error('Registration error:', err);
      return {
        success: false,
        message: err.response?.data?.message || err.response?.data?.error || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updatePreferredLanguage = async (language) => {
    try {
      if (!user) return;
      const res = await axios.put(`${API_URL}/auth/profile`, { preferredLanguage: language });
      // Wait, our backend currently does not have a PUT /api/auth/profile, let's look at authController!
      // In authController, we only have getProfile.
      // Let's add a route/controller for updating user profile later if needed, or we can just update the backend or user state locally.
      // Wait, let's update user state locally and we can also update it via PUT if we implement it, or just let users update language.
      // Actually, since the prompt specifies that preferredLanguage can be edited in Profile, let's write a route for profile updates in authRoutes / authController!
      // Wait! We will implement profile updates in our backend, let's edit authController.js to support profile updates!
      // But for now, let's update the local user state. Let's make the API call, and if it fails, just fall back or we will add the profile PUT route.
      // Let's ensure the API call updates it. We'll update the user state:
      const updatedUser = { ...user, preferredLanguage: language };
      setUser(updatedUser);
      
      // Attempt backend update
      await axios.put(`${API_URL}/auth/profile`, { preferredLanguage: language });
    } catch (err) {
      console.error('Error updating profile language in backend:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updatePreferredLanguage,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
