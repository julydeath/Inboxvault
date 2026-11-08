'use client';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
type Job = { id:string; status:string; processed:number; found:number; error:string|null; query:string };
type FileItem = { id:string; filename:string; mimeType:string; size:number; emailDate:string|null };
export default function Dashboard({name,email,count,initialJob,connected}:{name:string;email:string;count:number;initialJob:Job|null;connected:boolean}) {
  const [job,setJob] = useState<Job|null>(initialJob);
  const [query,setQuery] = useState('has:attachment');
  const [search,setSearch] = useState('');
  const [type,setType] = useState('');
  const [files,setFiles] = useState<FileItem[]>([]);
  const [cursor,setCursor] = useState<string|null>(null);
  const [total,setTotal] = useState(count);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  async function loadFiles(next?:string|null) {
    const params = new URLSearchParams({search,mime:type});
    if (next) params.set('cursor',next);
    const response = await fetch('/api/files?'+params,{cache:'no-store'});
    if (!response.ok) return;
    const data = await response.json();
    setFiles(old=>next?[...old,...data.files]:data.files);
    setCursor(data.nextCursor);
  }
  useEffect(()=>{void loadFiles(null);},[search,type]);
  async function start() {
    setBusy(true);setError('');
    try {const res=await fetch('/api/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query})});const data=await res.json();if(!res.ok)throw new Error(data.error);setJob(data);} catch(e){setError(String(e));} finally{setBusy(false);}
  }
  async function run() {
    if(!job)return;setBusy(true);setError('');
    try {const res=await fetch(`/api/jobs/${job.id}/run`,{method:'POST'});const data=await res.json();if(!res.ok)throw new Error(data.error);setJob(data);setTotal(n=>Math.max(n,data.found));await loadFiles(null);} catch(e){setError(String(e));}finally{setBusy(false);}
  }
  return <div className="shell"><aside className="sidebar"><div className="brand"><span className="logo">▣</span> inboxvault</div><div className="nav active">▦ &nbsp; Overview</div><div className="nav">▤ &nbsp; My attachments</div><div className="nav">◷ &nbsp; Scan history</div><div className="nav">⚙ &nbsp; Settings</div><div className="sidefoot">Developer preview<br/><span>No billing enabled</span></div></aside><main className="content"><header><div><div className="eyebrow">WORKSPACE / OVERVIEW</div><h1>Good to see you, {name.split(' ')[0]}.</h1><p>Find, index, and access files from your Gmail inbox.</p></div><button className="ghost" onClick={()=>signOut({callbackUrl:'/'})}>Sign out</button></header><section className="stats"><div className="stat"><small>Indexed files</small><strong>{total.toLocaleString()}</strong><span>Across your Gmail account</span></div><div className="stat"><small>Gmail connection</small><strong className="smallstat">{connected?'Connected':'Not connected'}</strong><span>{email}</span></div><div className="stat"><small>Messages scanned</small><strong>{(job?.processed??0).toLocaleString()}</strong><span>{job?.status??'No scan started'}</span></div></section><section className="panel"><div className="sectionhead"><div><h2>Import from Gmail</h2><p>Run a historical search to index file metadata. Your emails are not modified.</p></div><span className="tag">BETA</span></div><label className="label" htmlFor="query">Gmail search query</label><div className="actionrow"><input id="query" value={query} onChange={e=>setQuery(e.target.value)} placeholder="has:attachment"/><button className="primary" disabled={busy||!!(job && ['running','queued'].includes(job.status))} onClick={start}>Start scan</button></div><div className="muted">Examples: <code>has:attachment filename:pdf</code> or <code>after:2025/01/01 has:attachment</code></div>{job&&<div className="job"><div><b>Latest scan</b><span className="tag">{job.status}</span></div><p>{job.processed} messages checked · {job.found} attachments indexed</p>{job.status!=='completed'&&<button className="secondary" disabled={busy} onClick={run}>Process next 10 messages</button>}{job.error&&<p className="error">{job.error}</p>}</div>}{error&&<div className="error">{error}</div>}</section><section className="panel"><div className="sectionhead"><div><h2>Attachment library</h2><p>Metadata only. Files download securely from Gmail on demand.</p></div></div><div className="filters"><input aria-label="Search filenames" placeholder="Search file names..." value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Filter file types" value={type} onChange={e=>setType(e.target.value)}><option value="">All types</option><option value="application/pdf">PDF</option><option value="image/">Images</option><option value="video/">Videos</option><option value="audio/">Audio</option><option value="application/">Other documents / archives</option></select></div><div className="tablewrap"><table><thead><tr><th>Filename</th><th>Type</th><th>Size</th><th>Date</th><th></th></tr></thead><tbody>{files.length===0?<tr><td colSpan={5} className="empty">No attachments indexed yet. Start a Gmail scan above.</td></tr>:files.map(file=><tr key={file.id}><td className="filename">▤ &nbsp; {file.filename}</td><td>{file.mimeType}</td><td>{(file.size/1024/1024).toFixed(2)} MB</td><td>{file.emailDate?new Date(file.emailDate).toLocaleDateString():'—'}</td><td><a className="download" href={'/api/files/'+file.id+'/download'}>Download ↓</a></td></tr>)}</tbody></table></div>{cursor&&<button className="secondary more" onClick={()=>loadFiles(cursor)}>Load more</button>}</section><footer>InboxVault 0.1 · Gmail content stays with its account owner · Delete/disconnect controls are required before public launch.</footer></main></div>;
}
