# Module 2: Authentication & Security

## 🎯 Learning Objectives

By the end of this module, you will be able to:

1. Configure NextAuth.js for various authentication scenarios
2. Implement OAuth providers (Google, GitHub, etc.)
3. Build custom credential-based authentication
4. Implement two-factor authentication (2FA)
5. Configure security headers and Content Security Policy
6. Implement rate limiting and IP allowlisting
7. Understand session management and token security

## ⏱️ Duration: 6 hours

---

## Lesson 2.1: NextAuth.js Configuration

### Understanding NextAuth.js

NextAuth.js is the authentication backbone of Proveniq Core. It provides:

- **Multiple Providers**: OAuth, email, credentials
- **Session Management**: JWT or database sessions
- **Security**: CSRF protection, secure cookies
- **Callbacks**: Customize authentication flow

### Core Configuration

```typescript
// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  
  providers: [
    // Providers configured here
  ],
  
  session: {
    strategy: "jwt", // or "database"
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    newUser: "/onboarding",
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
```

### Session Strategies

| Strategy | Pros | Cons | Use Case |
|----------|------|------|----------|
| **JWT** | Stateless, scalable | Can't revoke instantly | Most applications |
| **Database** | Revocable, more control | DB query per request | High-security apps |

### API Route Setup

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### Accessing Session

```typescript
// Server Component
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  return <div>Welcome, {session.user.name}</div>;
}

// Client Component
"use client";
import { useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <Spinner />;
  if (!session) return <SignInButton />;
  
  return <div>{session.user.name}</div>;
}
```

### Knowledge Check 2.1

1. What is the difference between JWT and database session strategies?
2. How do you access the session in a Server Component vs Client Component?
3. What is the purpose of the `callbacks` configuration?

---

## Lesson 2.2: OAuth Providers & Social Login

### Configuring Google OAuth

```typescript
// In authOptions.providers
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code",
    },
  },
}),
```

**Setup Steps:**
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `{NEXTAUTH_URL}/api/auth/callback/google`
4. Copy Client ID and Secret to `.env`

### Configuring GitHub OAuth

```typescript
GitHubProvider({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
}),
```

**Setup Steps:**
1. Go to GitHub Developer Settings
2. Create new OAuth App
3. Set callback URL: `{NEXTAUTH_URL}/api/auth/callback/github`
4. Copy Client ID and Secret to `.env`

### Adding Custom OAuth Provider

```typescript
import type { OAuthConfig } from "next-auth/providers";

const CustomProvider: OAuthConfig<any> = {
  id: "custom",
  name: "Custom Provider",
  type: "oauth",
  authorization: {
    url: "https://provider.com/oauth/authorize",
    params: { scope: "openid email profile" },
  },
  token: "https://provider.com/oauth/token",
  userinfo: "https://provider.com/oauth/userinfo",
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
    };
  },
  clientId: process.env.CUSTOM_CLIENT_ID,
  clientSecret: process.env.CUSTOM_CLIENT_SECRET,
};
```

### Account Linking

When a user signs in with multiple providers:

```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: user.email! },
    });
    
    if (existingUser && account) {
      // Link account to existing user
      await db.account.create({
        data: {
          userId: existingUser.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          // ... other fields
        },
      });
    }
    
    return true;
  },
}
```

### Knowledge Check 2.2

1. What redirect URI format does NextAuth.js use for OAuth callbacks?
2. How would you add a new OAuth provider not built into NextAuth.js?
3. What happens when a user tries to sign in with a different provider using the same email?

---

## Lesson 2.3: Session Management

### Session Configuration

```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60,   // 24 hours - refresh token
},

jwt: {
  maxAge: 30 * 24 * 60 * 60,
  // Custom encode/decode for additional security
  async encode({ secret, token }) {
    // Custom JWT encoding
  },
  async decode({ secret, token }) {
    // Custom JWT decoding
  },
},
```

### Extending Session Data

```typescript
// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      organizationId?: string;
    } & DefaultSession["user"];
  }
  
  interface User extends DefaultUser {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    organizationId?: string;
  }
}
```

### Session Security Best Practices

```typescript
// Secure cookie configuration
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  },
},
```

### Forcing Session Refresh

```typescript
// Client-side session refresh
import { useSession } from "next-auth/react";

function Component() {
  const { update } = useSession();
  
  const handleRoleChange = async () => {
    // After role change, refresh session
    await update();
  };
}
```

### Knowledge Check 2.3

1. What is the purpose of `updateAge` in session configuration?
2. How do you add custom fields to the session object?
3. What cookie settings improve session security?

---

## Lesson 2.4: Two-Factor Authentication

### 2FA Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    2FA FLOW                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User enters credentials                                  │
│         │                                                    │
│         ▼                                                    │
│  2. Verify password ──────────────────┐                     │
│         │                             │                      │
│         ▼                             ▼                      │
│  3. Check if 2FA enabled         [FAIL] → Error             │
│         │                                                    │
│    ┌────┴────┐                                              │
│    │         │                                              │
│    ▼         ▼                                              │
│  [NO]      [YES]                                            │
│    │         │                                              │
│    ▼         ▼                                              │
│  Login    4. Prompt for TOTP code                           │
│              │                                              │
│              ▼                                              │
│           5. Verify TOTP ─────────────┐                     │
│              │                        │                      │
│              ▼                        ▼                      │
│           [VALID]                 [INVALID]                 │
│              │                        │                      │
│              ▼                        ▼                      │
│           Login                    Error                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// lib/security/twoFactor.ts
import { authenticator } from "otplib";
import QRCode from "qrcode";

export async function generateTwoFactorSecret(email: string) {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, "Proveniq", secret);
  const qrCode = await QRCode.toDataURL(otpauth);
  
  return { secret, qrCode };
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return authenticator.verify({ token, secret });
}

export async function enableTwoFactor(userId: string, secret: string) {
  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString("hex")
  );
  
  // Hash backup codes before storing
  const hashedCodes = await Promise.all(
    backupCodes.map((code) => bcrypt.hash(code, 10))
  );
  
  await db.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: true,
      backupCodes: hashedCodes,
    },
  });
  
  return backupCodes; // Return unhashed codes to user ONCE
}
```

### Credentials Provider with 2FA

```typescript
CredentialsProvider({
  name: "credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
    totp: { label: "2FA Code", type: "text" },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) {
      throw new Error("Email and password required");
    }
    
    const user = await db.user.findUnique({
      where: { email: credentials.email },
    });
    
    if (!user || !user.passwordHash) {
      throw new Error("Invalid credentials");
    }
    
    const passwordValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );
    
    if (!passwordValid) {
      throw new Error("Invalid credentials");
    }
    
    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!credentials.totp) {
        throw new Error("2FA_REQUIRED");
      }
      
      const totpValid = verifyTwoFactorToken(
        user.twoFactorSecret!,
        credentials.totp
      );
      
      if (!totpValid) {
        // Check backup codes
        const backupValid = await verifyBackupCode(
          user.id,
          credentials.totp
        );
        
        if (!backupValid) {
          throw new Error("Invalid 2FA code");
        }
      }
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  },
}),
```

### Knowledge Check 2.4

1. What is TOTP and how does it work?
2. Why are backup codes important for 2FA?
3. How should backup codes be stored in the database?

---

## Lesson 2.5: Security Headers & CSP

### Security Headers Configuration

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

export default {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
```

### Content Security Policy

```typescript
{
  key: "Content-Security-Policy",
  value: `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self';
    connect-src 'self' https://api.segment.io https://*.sentry.io;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\n/g, ""),
}
```

### CSP Directives Explained

| Directive | Purpose | Example |
|-----------|---------|---------|
| `default-src` | Fallback for other directives | `'self'` |
| `script-src` | JavaScript sources | `'self' 'unsafe-inline'` |
| `style-src` | CSS sources | `'self' 'unsafe-inline'` |
| `img-src` | Image sources | `'self' data: https:` |
| `connect-src` | XHR, WebSocket, fetch | `'self' https://api.example.com` |
| `frame-ancestors` | Who can embed this page | `'none'` |

### Knowledge Check 2.5

1. What does HSTS (Strict-Transport-Security) do?
2. Why is X-Frame-Options important?
3. What is the purpose of Content-Security-Policy?

---

## Lesson 2.6: Rate Limiting & IP Allowlisting

### Rate Limiting Implementation

```typescript
// lib/security/rateLimit.ts
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): { success: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }
  
  if (record.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }
  
  record.count++;
  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetIn: record.resetTime - now,
  };
}
```

### Rate Limit Middleware

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/security/rateLimit";

export function middleware(request: NextRequest) {
  // Get client IP
  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown";
  
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const result = rateLimit(ip, {
      windowMs: 60000,  // 1 minute
      maxRequests: 100, // 100 requests per minute
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(result.resetIn / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }
  
  return NextResponse.next();
}
```

### IP Allowlisting

```typescript
// lib/security/ipAllowlist.ts
export interface IpAllowlistEntry {
  ip: string;
  description: string;
  createdAt: Date;
  expiresAt?: Date;
}

const allowlist: IpAllowlistEntry[] = [];

export function isIpAllowed(ip: string): boolean {
  // If allowlist is empty, allow all
  if (allowlist.length === 0) return true;
  
  const now = new Date();
  
  return allowlist.some((entry) => {
    // Check expiration
    if (entry.expiresAt && entry.expiresAt < now) {
      return false;
    }
    
    // Exact match
    if (entry.ip === ip) return true;
    
    // CIDR range match
    if (entry.ip.includes("/")) {
      return isIpInCidr(ip, entry.ip);
    }
    
    return false;
  });
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  
  return (ipNum & mask) === (rangeNum & mask);
}

function ipToNumber(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
}
```

### Knowledge Check 2.6

1. What is the purpose of rate limiting?
2. How does CIDR notation work for IP ranges?
3. When should you use IP allowlisting vs rate limiting?

---

## 🔬 Lab 2: Implementing Custom Auth Provider

### Objective
Implement a custom authentication provider with 2FA support.

### Requirements
1. Create a credentials provider with email/password
2. Add 2FA enrollment flow
3. Implement backup codes
4. Add rate limiting to login endpoint

### Steps

#### Step 1: Create Login API
```typescript
// app/api/auth/login/route.ts
// Implement password verification with rate limiting
```

#### Step 2: Create 2FA Enrollment
```typescript
// app/api/auth/2fa/setup/route.ts
// Generate secret and QR code
```

#### Step 3: Create 2FA Verification
```typescript
// app/api/auth/2fa/verify/route.ts
// Verify TOTP and enable 2FA
```

#### Step 4: Update Credentials Provider
```typescript
// Add 2FA check to authorize function
```

### Verification Checklist

- [ ] Users can register with email/password
- [ ] Users can log in with credentials
- [ ] 2FA can be enabled via QR code
- [ ] 2FA is required after enabling
- [ ] Backup codes work for recovery
- [ ] Rate limiting prevents brute force

---

## 📝 Module 2 Assessment

Complete the following to finish Module 2:

1. **Knowledge Test** (25 questions, 70% to pass)
2. **Lab Completion** (verified by checklist)
3. **Security Audit Exercise**: Review a sample auth implementation and identify vulnerabilities

---

**Next Module**: [Module 3: Multi-Tenancy & Access Control](../module-03-multitenancy/README.md)
