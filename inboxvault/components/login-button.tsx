'use client';
import { signIn } from 'next-auth/react';
export default function LoginButton() { return <button className="primary" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>Continue with Google <span>→</span></button>; }
