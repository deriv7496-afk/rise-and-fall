/**
 * useAuth.js
 * React context and hook for authentication state management
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  extractTokenFromRedirect,
  storeToken,
  getStoredToken,
  clearToken,
  getValidToken,
  initiateOAuthLogin,
} from '../lib/derivOAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount, check for redirect token or stored token
  useEffect(() => {
    const initAuth = () => {
      try {
        // First, check for token in redirect URL
        const redirectToken = extractTokenFromRedirect();
        if (redirectToken) {
          storeToken(redirectToken);
          setToken(redirectToken);
          setIsAuthenticated(true);
          // Clean up URL hash
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsLoading(false);
          return;
        }

        // Otherwise, check for stored token
        const validToken = getValidToken();
        if (validToken) {
          setToken(validToken);
          setIsAuthenticated(true);
        } else {
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err.message);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(() => {
    setError(null);
    initiateOAuthLogin();
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const value = {
    isAuthenticated,
    token,
    isLoading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
