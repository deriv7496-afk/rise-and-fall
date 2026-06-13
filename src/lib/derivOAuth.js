/**
 * derivOAuth.js
 * Handles OAuth 2.0 authentication flow with Deriv API
 */

const DERIV_OAUTH_ENDPOINTS = {
  production: 'https://www.deriv.com/oauth/authorize',
  staging: 'https://staging.deriv.com/oauth/authorize',
};

export const getOAuthEndpoint = () => {
  const env = process.env.NEXT_PUBLIC_DERIV_ENV || 'production';
  return env === 'production'
    ? DERIV_OAUTH_ENDPOINTS.production
    : DERIV_OAUTH_ENDPOINTS.staging;
};

/**
 * Initiates OAuth login flow by redirecting to Deriv
 */
export const initiateOAuthLogin = () => {
  const appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
  const redirectUri = process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI;
  const scopes = process.env.NEXT_PUBLIC_DERIV_OAUTH_SCOPES || 'trade,account_manage';

  if (!appId || !redirectUri) {
    console.error('OAuth configuration missing: APP_ID or REDIRECT_URI');
    return;
  }

  const oauthUrl = new URL(getOAuthEndpoint());
  oauthUrl.searchParams.append('app_id', appId);
  oauthUrl.searchParams.append('scope', scopes);
  oauthUrl.searchParams.append('redirect_uri', redirectUri);

  window.location.href = oauthUrl.toString();
};

/**
 * Extracts access token from redirect URL hash
 * OAuth 2.0 Implicit Flow returns token in #access_token=...
 */
export const extractTokenFromRedirect = () => {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get('access_token');
};

/**
 * Stores token in localStorage
 */
export const storeToken = (token) => {
  if (!token) return;
  localStorage.setItem('deriv_token', token);
  localStorage.setItem('deriv_token_timestamp', Date.now().toString());
};

/**
 * Retrieves stored token from localStorage
 */
export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('deriv_token');
};

/**
 * Clears token from localStorage (logout)
 */
export const clearToken = () => {
  localStorage.removeItem('deriv_token');
  localStorage.removeItem('deriv_token_timestamp');
};

/**
 * Checks if token is likely expired (> 24 hours old)
 */
export const isTokenExpired = () => {
  const timestamp = localStorage.getItem('deriv_token_timestamp');
  if (!timestamp) return true;
  const ageMs = Date.now() - parseInt(timestamp, 10);
  const oneDayMs = 24 * 60 * 60 * 1000;
  return ageMs > oneDayMs;
};

/**
 * Returns token if valid, null if missing or expired
 */
export const getValidToken = () => {
  const token = getStoredToken();
  if (!token || isTokenExpired()) return null;
  return token;
};
