'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LogOut, Menu } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/keam', label: 'Practice' },
    { href: '/dashboard/progress', label: 'My Progress' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-slate-200 dark:border-white/5 bg-background/80 backdrop-blur-xl transition-colors">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Logo - Left Corner */}
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
            <Image
              src="/logo.svg"
              alt="sangram"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block text-slate-800 dark:text-white">sangram</span>
        </Link>

        {/* Navigation Links - Center (Desktop but hidden on LG sidebar layout) */}
        <nav className="hidden md:flex lg:hidden items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.href)
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User Actions - Right */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:block">Logout</span>
          </button>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-white/5 bg-background/95 backdrop-blur-xl">
          <nav className="flex flex-col p-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(link.href)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
