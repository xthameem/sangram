'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, BarChart2, Award, User as UserIcon, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Practice', href: '/keam', icon: BookOpen },
    { name: 'My Progress', href: '/dashboard/progress', icon: BarChart2 },
    { name: 'Leaderboard', href: '/leaderboard', icon: Award },
    { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
            setLoading(false);
        };
        getProfile();
    }, []);

    const userInitials = profile?.full_name
        ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : 'GU';

    return (
        <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-slate-200 dark:border-white/5 bg-background lg:flex transition-colors">
            {/* Logo Area */}
            <div className="flex h-16 items-center border-b border-slate-200 dark:border-white/5 px-6">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <Image src="/logo.svg" alt="sangram" width={32} height={32} />
                    <span className="text-xl font-bold tracking-tight text-foreground">sangram</span>
                </Link>
            </div>

            {/* Profile Section */}
            <div className="flex flex-col items-center border-b border-slate-200 dark:border-white/5 px-6 py-8 text-center bg-slate-50/50 dark:bg-slate-900/20">
                <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full border-4 border-background shadow-lg">
                    {profile?.avatar_url && profile.avatar_url.startsWith('http') ? (
                        <Image
                            src={profile.avatar_url}
                            alt={profile.full_name || 'User'}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl font-bold">
                            {userInitials}
                        </div>
                    )}
                </div>
                {loading ? (
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                ) : (
                    <>
                        <h3 className="text-lg font-semibold text-foreground truncate w-full px-2">
                            {profile?.full_name || 'Student'}
                        </h3>
                        <p className="text-sm text-primary font-medium">@{profile?.username || 'user'}</p>
                        {profile?.district && (
                            <p className="mt-1 text-xs text-muted-foreground">{profile.district}</p>
                        )}
                    </>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                        : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 hover:text-foreground'
                                )}
                            >
                                <item.icon size={20} className={clsx("transition-transform", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Footer / Quote */}
            <div className="p-4 m-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-muted-foreground italic text-center">
                    "Success is the sum of small efforts, repeated day in and day out."
                </p>
            </div>
        </aside>
    );
}
