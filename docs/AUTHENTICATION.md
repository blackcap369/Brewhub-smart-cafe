# BrewHub Phone OTP Authentication System

## Overview

Complete phone-based OTP authentication system using Supabase Auth with:
- Phone number input with +91 (India) prefix
- 6-digit OTP verification with auto-focus
- Resend OTP timer (30 seconds)
- Session persistence and auto-refresh
- Protected routes
- Error handling for all edge cases

## Architecture

```
src/
├── services/
│   └── authService.ts          # Core auth service (sendOTP, verifyOTP, etc.)
├── contexts/
│   └── AuthContext.tsx          # React Context provider for auth state
├── hooks/
│   └── useAuth.ts              # Custom hook for auth operations
├── components/
│   └── ui/
│       └── ProtectedRoute.tsx  # Route protection component
└── pages/
    └── LoginPage.tsx           # Login UI with phone + OTP inputs
```

## Features

### 1. **Auth Service** (`src/services/authService.ts`)

Core authentication functions:

```typescript
// Send OTP to phone number
sendOTP(phone: string): Promise<SendOTPResponse>

// Verify OTP and authenticate
verifyOTP(phone: string, token: string): Promise<VerifyOTPResponse>

// Get current user
getCurrentUser(): Promise<User | null>

// Sign out
logout(): Promise<{ success: boolean; error?: string }>

// Listen to auth state changes
onAuthStateChange(callback): () => void

// Refresh session
refreshSession(): Promise<Session | null>
```

**Error Handling:**
- Invalid phone format
- Expired OTP
- Rate limiting (too many requests)
- Network errors
- Invalid OTP format

### 2. **Auth Context** (`src/contexts/AuthContext.tsx`)

React Context provider that:
- Initializes auth state on app load
- Listens to auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
- Auto-refreshes session every 4 minutes
- Provides auth state to all components

**Usage:**
```typescript
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

### 3. **useAuth Hook** (`src/hooks/useAuth.ts`)

Custom hook wrapping auth context:

```typescript
const {
  user,              // Current user object
  session,           // Current session
  loading,           // Loading state
  error,             // Error message
  isAuthenticated,   // Boolean flag
  login,             // Verify OTP function
  sendOTP,           // Send OTP function
  logout,            // Logout function
  refresh,           // Refresh session
  clearError,        // Clear error state
} = useAuth();
```

### 4. **Login Page** (`src/pages/LoginPage.tsx`)

Two-step authentication flow:

**Step 1: Phone Input**
- Phone number input with +91 prefix
- 10-digit validation
- Send OTP button with loading state

**Step 2: OTP Verification**
- 6 individual digit inputs
- Auto-focus between fields
- Paste support (paste full OTP)
- Backspace navigation
- 30-second resend timer
- Success/error messages

**Features:**
- Framer Motion animations
- Loading states
- Error handling
- Redirect on success
- Change number option

### 5. **Protected Routes** (`src/components/ui/ProtectedRoute.tsx`)

Component to protect routes:

```typescript
import ProtectedRoute from './components/ui/ProtectedRoute';

<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="owner">
      <Admin />
    </ProtectedRoute>
  }
/>
```

**Features:**
- Redirects to login if not authenticated
- Optional role-based access control
- Loading state while checking auth

### 6. **Header Integration** (`src/components/layout/Header.tsx`)

Updated header with:
- Login button when not authenticated
- User menu when authenticated (profile, orders, logout)
- Mobile menu support

## Setup Instructions

### 1. Supabase Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/)
2. Select your project
3. Navigate to **Authentication → Providers**
4. Enable **Phone** provider
5. Configure SMS provider:
   - **Twilio** (recommended for production)
   - **MessageBird**
   - **Vonage**

### 2. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Testing Without SMS

For development/testing, you can add test phone numbers:

1. Go to **Authentication → Phone Providers → SMS**
2. Add test numbers:
   - Phone: `+911234567890`
   - OTP: `123456`
3. Use these credentials in your app

### 4. Rate Limits

Configure rate limits in Supabase:
- **Authentication → Rate Limits**
- Default: 3 OTP requests per phone per hour
- Adjust based on your needs

## Usage Examples

### Basic Login Flow

```typescript
import { useAuth } from './hooks/useAuth';

function LoginComponent() {
  const { sendOTP, login, loading, error } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const handleSendOTP = async () => {
    const result = await sendOTP(`+91${phone}`);
    if (result.success) {
      // Show OTP input
    }
  };

  const handleLogin = async () => {
    const result = await login(`+91${phone}`, otp);
    if (result.success) {
      // Redirect to dashboard
    }
  };

  return (
    // Your UI
  );
}
```

### Protected Route

```typescript
import ProtectedRoute from './components/ui/ProtectedRoute';

<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route
    path="/admin"
    element={
      <ProtectedRoute requiredRole="owner">
        <Admin />
      </ProtectedRoute>
    }
  />
  <Route
    path="/menu"
    element={
      <ProtectedRoute>
        <Menu />
      </ProtectedRoute>
    }
  />
</Routes>
```

### Access User Data

```typescript
import { useAuth } from './hooks/useAuth';

function ProfileComponent() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <p>Name: {user?.user_metadata?.name}</p>
      <p>Phone: {user?.phone}</p>
      <p>Email: {user?.email}</p>
    </div>
  );
}
```

### Logout

```typescript
import { useAuth } from './hooks/useAuth';

function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout}>
      Logout
    </button>
  );
}
```

## Error Handling

The system handles various error cases:

### Invalid Phone Number
```
Error: "Invalid phone number format. Please use +91 followed by 10 digits."
```

### Expired OTP
```
Error: "OTP has expired or is invalid. Please request a new one."
```

### Rate Limiting
```
Error: "Too many requests. Please wait a few minutes before trying again."
```

### Network Error
```
Error: "Network error. Please check your connection and try again."
```

## Security Features

1. **JWT Tokens**: Supabase uses JWT for session management
2. **Auto-refresh**: Sessions auto-refresh every 4 minutes
3. **Secure Storage**: Tokens stored in localStorage with Supabase's secure handling
4. **Rate Limiting**: Prevents OTP spam
5. **OTP Expiry**: OTPs expire after a set time (default: 1 hour)
6. **Phone Validation**: Validates phone format before sending OTP
7. **CSRF Protection**: Built into Supabase Auth

## Database Integration

After successful authentication, you can:

1. **Create user profile** in `users` table:
```typescript
const { data, error } = await supabase
  .from('users')
  .insert({
    id: user.id,
    phone: user.phone,
    name: user.user_metadata?.name,
    role: 'customer',
    cafe_id: selectedCafeId,
  });
```

2. **Set cafe context** for multi-tenant isolation:
```typescript
await setCafeContext(cafeId);
```

3. **Query tenant-isolated data**:
```typescript
const { data } = await supabase
  .from('orders')
  .select('*');
```

## Troubleshooting

### OTP Not Received
- Check phone number format (+91XXXXXXXXXX)
- Verify SMS provider configuration in Supabase
- Check rate limits (3 requests per hour per phone)
- For testing, use test phone numbers

### Session Expires
- Auto-refresh runs every 4 minutes
- Check if browser allows localStorage
- Verify Supabase session settings

### Authentication Errors
- Check browser console for detailed errors
- Verify environment variables are set correctly
- Ensure Supabase project is active

## Production Checklist

- [ ] Configure SMS provider (Twilio recommended)
- [ ] Set up custom SMS templates
- [ ] Configure rate limits appropriately
- [ ] Enable phone number verification in Supabase
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure session expiry settings
- [ ] Test with real phone numbers
- [ ] Set up backup authentication method
- [ ] Document recovery procedures

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Phone Auth Guide](https://supabase.com/docs/guides/auth/auth-phone)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Twilio SMS Setup](https://www.twilio.com/docs/sms)
