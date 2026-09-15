import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { DefaultSession, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { authorizeBackendLogin } from './lib/auth/login-backend';
import { BackendLoginError } from './lib/auth/sign-in-errors';
import { resolveWebSessionMaxAgeSeconds } from './lib/auth/session-lifetime';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      firstName: string;
      lastName: string;
    };
  }

  interface User {
    accessToken: string;
    refreshToken?: string;
    sessionId?: string;
    firstName: string;
    lastName: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    /** Server-only opaque refresh; never copied into Session. */
    refreshToken?: string;
    sessionId?: string;
    firstName?: string;
    lastName?: string;
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
      authorize: async (credentials, request) => {
        try {
          return await authorizeBackendLogin(credentials ?? {}, request);
        } catch (error) {
          if (error instanceof BackendLoginError) {
            const signInError = new CredentialsSignin();
            signInError.code = error.code;
            throw signInError;
          }
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.sessionId = user.sessionId;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }: { session: DefaultSession; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.firstName = token.firstName ?? '';
        session.user.lastName = token.lastName ?? '';
      }
      // Never expose accessToken / refreshToken to the browser session object.
      return session;
    },
  },
  events: {
    // Best-effort: revoke the backend access token when the user signs out,
    // so a leaked token cannot be reused after logout.
    async signOut(message) {
      const accessToken = 'token' in message ? message.token?.accessToken : undefined;
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
    maxAge: resolveWebSessionMaxAgeSeconds(),
  },
  // Force the Secure cookie flag + `__Secure-` prefix in production.
  // The session cookie itself stays httpOnly + sameSite=lax (Auth.js defaults).
  useSecureCookies: process.env.NODE_ENV === 'production',
});
