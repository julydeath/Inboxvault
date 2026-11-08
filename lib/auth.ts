import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from './db';
import { encrypt } from './crypto';
export const authOptions: NextAuthOptions = {
  providers: [GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: { params: {
      scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
      access_type: 'offline', prompt: 'consent'
    } }
  })],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && account.providerAccountId && token.email) {
        const id = account.providerAccountId;
        await db.user.upsert({ where: { id }, create: { id, email: token.email, name: token.name }, update: { email: token.email, name: token.name } });
        if (account.refresh_token) await db.gmailConnection.upsert({
          where: { userId: id }, create: { userId: id, refreshTokenEncrypted: encrypt(account.refresh_token) },
          update: { refreshTokenEncrypted: encrypt(account.refresh_token) }
        });
        token.userId = id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as typeof session.user & { id: string }).id = String(token.userId || '');
      return session;
    }
  },
  pages: { signIn: '/' }
};
