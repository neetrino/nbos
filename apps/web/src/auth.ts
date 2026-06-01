import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: DefaultSession['user'] & {
      id: string;
      firstName: string;
      lastName: string;
    };
  }

  interface User {
    accessToken: string;
    firstName: string;
    lastName: string;
  }
}

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            return null;
          }

          const body = (await res.json()) as {
            data: {
              accessToken: string;
              user: { id: string; email: string; firstName: string; lastName: string };
            };
          };

          const { accessToken, user } = body.data;

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            accessToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token['accessToken'] = user.accessToken;
        token['firstName'] = user.firstName;
        token['lastName'] = user.lastName;
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.accessToken = (token['accessToken'] as string) ?? '';
      session.user.id = token.sub ?? '';
      session.user.firstName = (token['firstName'] as string) ?? '';
      session.user.lastName = (token['lastName'] as string) ?? '';
      return session;
    },
  },
  events: {
    // Best-effort: revoke the backend access token when the user signs out,
    // so a leaked token cannot be reused after logout.
    async signOut(message) {
      const accessToken =
        'token' in message ? (message.token?.['accessToken'] as string | undefined) : undefined;
      if (!accessToken) {
        return;
      }
      try {
        await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        // Signing out client-side must succeed even if the backend is unreachable.
      }
    },
  },
  pages: {
    signIn: '/sign-in',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  // Force the Secure cookie flag + `__Secure-` prefix in production.
  // The session cookie itself stays httpOnly + sameSite=lax (Auth.js defaults).
  useSecureCookies: process.env.NODE_ENV === 'production',
});
