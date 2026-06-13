/**
 * ProtectedRoute.jsx
 * Route guard component — redirects to login if not authenticated
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children, fallback = null }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="protected-route-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="protected-route-unauthorized">
        <h2>Access Denied</h2>
        <p>You must be logged in to access this page.</p>
        <p>Please sign in with your Deriv account.</p>
      </div>
    );
  }

  return children;
}
