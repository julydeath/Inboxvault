import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginButton from '@/components/login-button';
export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');
  return <main className="landing"><div className="eyebrow">INBOXVAULT · DEVELOPMENT PREVIEW</div><h1>Find every attachment.<br/><span>Without digging through email.</span></h1><p>Connect Gmail and organize files by name and type. Built for large inboxes with indexed metadata and resumable scans.</p><LoginButton/><div className="notice">Private developer testing only. Public Gmail integration requires Google policy review and verification before launch.</div><div className="features"><div><strong>All file types</strong><small>PDF, DOCX, MP4, MP3, ZIP and more</small></div><div><strong>Searchable library</strong><small>Find files without opening email threads</small></div><div><strong>Private by design</strong><small>Files stay in Gmail until explicitly downloaded</small></div></div></main>;
}
