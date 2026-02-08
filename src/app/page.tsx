'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Left Panel - Branding */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-slate-950 p-12 lg:flex">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-blue-950/20 mix-blend-overlay" />
          <Image
            src="/login-bg.png"
            alt="Background"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary backdrop-blur-md border border-primary/20">
              <span className="font-bold text-2xl">S</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Sangram</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg mb-12">
          <h1 className="text-5xl font-bold leading-tight text-white mb-6">
            Master Your Concepts.<br />
            Ace the Exam.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              JEE & NEET Prep.
            </span>
          </h1>
          <p className="text-lg text-slate-400">
            Join thousands of students practicing daily to achieve their dream rank.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex w-full flex-col justify-center bg-background px-8 md:px-12 lg:w-[55%] lg:px-24">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/20">
                <span className="font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold">Sangram</span>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {isSignUp ? 'Create an account' : 'Welcome back!'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isSignUp ? 'Start your preparation journey today.' : 'Please sign in to your account.'}
            </p>
          </div>

          <button
            onClick={handleGoogleAuth}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 font-medium transition-all hover:bg-white/10 hover:border-white/20 mb-8 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23.5 12 23.5z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.97 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            <span className="text-foreground">Continue with Google</span>
          </button>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <div className="group space-y-2">
              <label className="text-sm font-medium leading-none text-muted-foreground group-focus-within:text-primary transition-colors" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex h-12 w-full rounded-xl border border-white/10 dark:border-white/10 border-slate-200 bg-white/5 px-3 py-1 pl-11 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 text-foreground bg-slate-50 dark:bg-slate-900/50"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="group space-y-2">
              <label className="text-sm font-medium leading-none text-muted-foreground group-focus-within:text-primary transition-colors" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex h-12 w-full rounded-xl border border-white/10 dark:border-white/10 border-slate-200 bg-white/5 px-3 py-1 pl-11 text-sm shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 text-foreground bg-slate-50 dark:bg-slate-900/50"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <Link href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Forgot password?</Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold text-primary hover:text-primary/80 transition-colors ml-1"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
