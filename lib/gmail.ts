import { google } from 'googleapis';
import { db } from './db';
import { decrypt } from './crypto';
export async function gmailClient(userId: string) {
  const connection = await db.gmailConnection.findUnique({ where: { userId } });
  if (!connection) throw new Error('Gmail is not connected; reconnect your Google account.');
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: decrypt(connection.refreshTokenEncrypted) });
  return google.gmail({ version: 'v1', auth });
}
export type GmailPart = { partId?: string | null; filename?: string | null; mimeType?: string | null; body?: { attachmentId?: string | null; size?: number | null; data?: string | null } | null; parts?: GmailPart[] | null };
export function attachments(parts: GmailPart | undefined | null): GmailPart[] {
  if (!parts) return [];
  const result: GmailPart[] = [];
  if (parts.filename && parts.body?.size && (parts.body.attachmentId || parts.body.data)) result.push(parts);
  for (const part of parts.parts || []) result.push(...attachments(part));
  return result;
}
export function decodeBase64Url(input: string) {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}
