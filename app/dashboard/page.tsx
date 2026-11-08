import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import Dashboard from '@/components/dashboard';
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as {id?: string} | undefined)?.id;
  if (!userId) redirect('/');
  const [count, latest, connection] = await Promise.all([
    db.attachment.count({ where: { userId } }),
    db.scanJob.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    db.gmailConnection.findUnique({ where: { userId } })
  ]);
  return <Dashboard name={session?.user?.name || 'there'} email={session?.user?.email || ''} count={count} initialJob={latest} connected={Boolean(connection)}/>;
}
