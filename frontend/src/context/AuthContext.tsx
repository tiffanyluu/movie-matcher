import React, { useState, useEffect, ReactNode } from 'react';
import { AuthContext } from './auth-context';
import { authAPI } from '../services/api';
import type { AuthContextType, LoginRequest, SignupRequest, User } from '../types';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendationsKey, setRecommendationsKey] = useState(0); // Add this

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('moviematcher_token');
      const storedUser = localStorage.getItem('moviematcher_user');

      if (storedToken && storedUser) {
        try {
          const profileResponse = await authAPI.getProfile();
          setToken(storedToken);
          setUser(profileResponse.user);
        } catch {
          localStorage.removeItem('moviematcher_token');
          localStorage.removeItem('moviematcher_user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    const response = await authAPI.login(credentials);
    
    localStorage.setItem('moviematcher_token', response.token);
    localStorage.setItem('moviematcher_user', JSON.stringify(response.user));
    
    setToken(response.token);
    setUser(response.user);
  };

  const signup = async (credentials: SignupRequest): Promise<void> => {
    const response = await authAPI.signup(credentials);
    
    localStorage.setItem('moviematcher_token', response.token);
    localStorage.setItem('moviematcher_user', JSON.stringify(response.user));
    
    setToken(response.token);
    setUser(response.user);
  };

  const logout = (): void => {
    localStorage.removeItem('moviematcher_token');
    localStorage.removeItem('moviematcher_user');
    setToken(null);
    setUser(null);
  };

  const invalidateRecommendations = (): void => {
    console.log('🔄 Invalidating recommendations, key was:', recommendationsKey);
    setRecommendationsKey(prev => prev + 1);
    console.log('🔄 New recommendations key will be:', recommendationsKey + 1);
  };

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    signup,
    logout,
    loading,
    recommendationsKey,
    invalidateRecommendations,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};