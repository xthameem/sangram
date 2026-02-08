'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ChartPie, Clock, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Subject Analysis', href: '/dashboard/analysis', icon: ChartPie },
    { name: 'Test History', href: '/dashboard/history', icon: Clock },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'GU';
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest User';

    return (
        <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-72 flex-col border-r border-white/5 dark:border-white/5 border-slate-200 bg-background/30 backdrop-blur-xl lg:flex transition-colors">
            <div className="flex flex-col items-center border-b border-white/5 dark:border-white/5 border-slate-200 px-6 py-8 text-center">
                <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-primary/20 shadow-lg shadow-primary/10">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
                        {userInitials}
                    </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground truncate w-full">{userName}</h3>
                <p className="mt-1 text-xs text-muted-foreground">JEE Advanced 2025 Aspirant</p>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    'group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                                        : 'text-muted-foreground hover:bg-white/5 dark:hover:bg-white/5 hover:bg-slate-100 hover:text-foreground'
                                )}
                            >
                                <item.icon size={20} className={clsx("transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <div className="border-t border-white/5 dark:border-white/5 border-slate-200 p-4">
                <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 border border-indigo-500/20">
                    <h4 className="text-sm font-semibold text-indigo-400 dark:text-indigo-400 text-indigo-600 mb-1">Pro Plan</h4>
                    <p className="text-xs text-muted-foreground mb-3">Your subscription expires in 5 days.</p>
                    <button className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors">
                        Upgrade Now
                    </button>
                </div>
            </div>
        </aside>
    );
}
