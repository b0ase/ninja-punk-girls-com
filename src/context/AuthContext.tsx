'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null; // Replace 'any' with your actual user type if available
  loading: boolean;
  // Add login/logout functions or other auth methods as needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Assume loading initially

  // TODO: Add effect here to check for existing session/token on load
  useEffect(() => {
    // Example: Check local storage, validate token, fetch user data
    // For now, just set loading to false after a delay
    const timer = setTimeout(() => {
      setLoading(false);
      // setIsAuthenticated(true); // Example: set auth based on check
      // setUser({ name: 'Example User'}); // Example: set user data
    }, 500); 
    return () => clearTimeout(timer);
  }, []);

  const value = {
    isAuthenticated,
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 