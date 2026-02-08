import Link from 'next/link';
import { Bell, Flame, ChevronDown } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 dark:border-white/10 border-slate-200 bg-background/80 backdrop-blur-md transition-colors">
      <div className="container mx-auto flex h-full items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <span className="font-bold text-lg">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">Sangram</span>
              <span className="text-[10px] text-muted-foreground leading-none">Entrance Prep Platform</span>
            </div>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {['Practice', 'Mock Tests', 'Study Material'].map((item) => (
            <Link
              key={item}
              href={`/${item.toLowerCase().replace(' ', '-')}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={20} />
          </button>

          <div className="flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1.5 border border-orange-500/20">
            <Flame size={16} className="text-orange-500" fill="currentColor" />
            <span className="text-sm font-semibold text-orange-500">5 Days</span>
          </div>

          <button className="flex items-center gap-2 rounded-full border border-white/10 dark:border-white/10 border-slate-200 p-1 pr-3 transition-colors hover:bg-white/5 dark:hover:bg-white/5 hover:bg-slate-100">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}
