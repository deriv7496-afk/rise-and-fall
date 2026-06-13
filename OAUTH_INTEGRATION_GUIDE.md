# OAuth 2.0 Authentication Guide

## Files Created

### Core OAuth Module
- **`src/lib/derivOAuth.js`** — OAuth utilities and token management
  - `initiateOAuthLogin()` — Redirects to Deriv OAuth
  - `extractTokenFromRedirect()` — Extracts token from URL hash
  - `storeToken()` / `getStoredToken()` — Local storage management
  - `getValidToken()` — Returns token if valid & not expired
  - `clearToken()` — Logout function

### React Hooks & Context
- **`src/hooks/useAuth.js`** — Authentication state management
  - `AuthProvider` — Wraps your app
  - `useAuth()` — Hook to access auth state and methods
  - Handles redirect token extraction on mount
  - Manages token persistence across page reloads
  - 24-hour token expiration check

### UI Components
- **`src/components/LoginButton.jsx`** — OAuth login/logout button
- **`src/components/AuthStatus.jsx`** — Displays authentication state
- **`src/components/ProtectedRoute.jsx`** — Guards routes requiring auth

### Styles
- **`src/styles/auth.css`** — Authentication UI styling

---

## Integration Steps

### 1. Wrap your app with AuthProvider

In `_app.js` (Next.js) or `main.jsx` (React):

```jsx
import { AuthProvider } from './hooks/useAuth';
import './styles/auth.css';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
```

### 2. Use LoginButton in your header

```jsx
import { LoginButton } from './components/LoginButton';
import { AuthStatus } from './components/AuthStatus';

export function Header() {
  return (
    <header>
      <h1>Rise/Fall Trading</h1>
      <AuthStatus />
      <LoginButton />
    </header>
  );
}
```

### 3. Protect trading components with ProtectedRoute

```jsx
import { ProtectedRoute } from './components/ProtectedRoute';
import { TradingDashboard } from './pages/TradingDashboard';

export function App() {
  return (
    <ProtectedRoute>
      <TradingDashboard />
    </ProtectedRoute>
  );
}
```

### 4. Access token in your components

```jsx
import { useAuth } from './hooks/useAuth';

function TradingComponent() {
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize WebSocket with token
      initializeDerivWS(token);
    }
  }, [token, isAuthenticated]);

  return <div>Trading...</div>;
}
```

---

## OAuth Flow Diagram

```
1. User clicks "Sign in with Deriv"
   ↓
2. Redirected to https://www.deriv.com/oauth/authorize?app_id=...&scope=...&redirect_uri=...
   ↓
3. User logs in & grants permissions
   ↓
4. Redirected back to: https://rise-and-fall-sigma.vercel.app/#access_token=...
   ↓
5. useAuth hook extracts token from URL hash
   ↓
6. Token stored in localStorage
   ↓
7. URL cleaned (no hash exposed in history)
   ↓
8. App components can access token via useAuth()
```

---

## Token Management

### Token Storage
Tokens are stored in `localStorage` with a timestamp for expiration checking.

### Token Expiration
- Tokens are considered expired after **24 hours**
- Expired tokens are cleared on next app load
- User must re-authenticate

### Security Notes
- Tokens are **never** sent to your backend (client-side OAuth)
- Always use HTTPS in production (Vercel does this automatically)
- Set `Secure` and `SameSite` flags if storing in cookies
- Never expose token in URL parameters in production logs

---

## API Scopes

Current scopes in `.env.production`:
```
trade          — Execute trades (CALL/PUT contracts)
account_manage — Access account info
```

Available Deriv scopes:
- `trade` — Read/write trading contracts
- `account_manage` — Manage account settings
- `payments` — Process withdrawals
- `admin` — Admin-level access (if applicable)

To add more scopes, update `NEXT_PUBLIC_DERIV_OAUTH_SCOPES` in `.env.production`.

---

## Environment Variables Reference

| Variable | Value | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_DERIV_APP_ID` | `33xR9OsjYqbU5iuUF8Evt` | Deriv App Registration |
| `NEXT_PUBLIC_DERIV_REDIRECT_URI` | `https://rise-and-fall-sigma.vercel.app/` | Your domain |
| `NEXT_PUBLIC_DERIV_OAUTH_SCOPES` | `trade,account_manage` | Required permissions |
| `NEXT_PUBLIC_DERIV_ENV` | `production` | `production` or `staging` |

---

## Troubleshooting

### "OAuth configuration missing"
- Check `.env.production` is loaded
- Verify `NEXT_PUBLIC_DERIV_APP_ID` and `NEXT_PUBLIC_DERIV_REDIRECT_URI` are set
- On Vercel, ensure env vars are added to project settings

### Token not persisting across page reload
- Check browser allows localStorage
- Verify cookies/storage not blocked in browser settings
- Check browser DevTools → Application → Local Storage

### "Invalid redirect URI"
- Redirect URI in `.env.production` must **exactly** match registered URI in Deriv dashboard
- No trailing slash mismatches
- Must be HTTPS in production

### Token extraction fails
- Check browser console for errors
- Verify redirect URL contains `#access_token=...`
- Check OAuth endpoint is correct for `NEXT_PUBLIC_DERIV_ENV`

---

## Next Steps

1. Append `src/styles/auth.css` to your main stylesheet
2. Wrap your app with `<AuthProvider>`
3. Add `<LoginButton />` and `<AuthStatus />` to header
4. Wrap trading routes with `<ProtectedRoute>`
5. Use `useAuth()` in components to access token
6. Deploy to Vercel

**Your app is now OAuth-protected! 🔐**
