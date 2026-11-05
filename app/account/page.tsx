import type {Metadata} from 'next';
import {Suspense} from 'react';
import AccountPortal from '@/components/account/AccountPortal';
import AuthShell from '@/components/auth/AuthShell';
export const metadata:Metadata={title:'Your Account — ALORA',robots:{index:false,follow:false},description:'Your personal ALORA collection. Sign in securely with your mobile number to manage your profile, addresses, wishlist, and orders.'};
export default function AccountPage(){return <Suspense fallback={<AuthShell><div className="velora-auth-heading"><h1 id="signin-title">Welcome Back</h1><p>Sign in to your ALORA account with OTP</p></div><div className="velora-auth-loading" role="status">Opening your account…</div></AuthShell>}><AccountPortal/></Suspense>}
