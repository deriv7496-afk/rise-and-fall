/**
 * LoginButton.jsx
 * OAuth login button component for Deriv authentication
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';

export function LoginButton() {
  const { isAuthenticated, isLoading, login, logout } = useAuth();

  if (isLoading) {
    return (
      <button className="login-btn login-btn-loading" disabled>
        <span className="login-spinner" />
        Loading...
      </button>
    );
  }

  if (isAuthenticated) {
    return (
      <button onClick={logout} className="login-btn login-btn-logout">
        <span className="logout-icon">⊗</span>
        Logout
      </button>
    );
  }

  return (
    <button onClick={login} className="login-btn login-btn-oauth">
      <span className="deriv-icon">🔐</span>
      Sign in with Deriv
    </button>
  );
}
