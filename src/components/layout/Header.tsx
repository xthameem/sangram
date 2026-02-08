'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bell, LogOut } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-white/5 dark:border-white/5 border-slate-200 bg-background/80 backdrop-blur-xl transition-colors">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Logo - Left Corner */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 p-1.5">
            <Image src="/logo.svg" alt="Sangram" width={28} height={28} />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">Sangram</span>
        </Link>

        {/* Navigation Links - Center */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 dark:hover:bg-white/5 hover:bg-slate-100 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/keam"
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 dark:hover:bg-white/5 hover:bg-slate-100 transition-colors"
          >
            Practice
          </Link>
          <Link
            href="/leaderboard"
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 dark:hover:bg-white/5 hover:bg-slate-100 transition-colors"
          >
            Leaderboard
          </Link>
        </nav>

        {/* User Actions - Right */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 dark:hover:bg-white/5 hover:bg-slate-100 transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
