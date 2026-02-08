import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/login-bg.png')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl shadow-purple-500/20">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
        </div>

        <h1 className="mb-4 text-5xl font-bold tracking-tight text-white md:text-7xl">
          Keam<span className="text-primary">-Pro</span>
        </h1>
        <p className="mb-10 max-w-lg text-lg text-muted-foreground">
          Master your concepts and ace the exam with the most advanced analysis platform for JEE & NEET.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/login" className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40 hover:-translate-y-0.5">
            Log In <ArrowRight size={18} />
          </Link>
          <Link href="/dashboard" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5">
            View Dashboard Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
