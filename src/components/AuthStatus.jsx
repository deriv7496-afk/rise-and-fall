/**
 * AuthStatus.jsx
 * Displays current authentication status and user info
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';

export function AuthStatus() {
  const { isAuthenticated, isLoading, error, token } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-status auth-status-loading">
        <span className="status-spinner" />
        <span className="status-text">Initializing...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-status auth-status-error">
        <span className="status-icon">⚠️</span>
        <span className="status-text">Error: {error}</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-status auth-status-unauthenticated">
        <span className="status-icon">🔓</span>
        <span className="status-text">Not logged in</span>
      </div>
    );
  }

  const tokenPreview = token ? `${token.substring(0, 8)}...${token.slice(-4)}` : '';

  return (
    <div className="auth-status auth-status-authenticated">
      <span className="status-icon">✓</span>
      <span className="status-text">Authenticated</span>
      {tokenPreview && <span className="status-token">{tokenPreview}</span>}
    </div>
  );
}
