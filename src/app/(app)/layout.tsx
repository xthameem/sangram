'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('username, full_name')
                .eq('id', user.id)
                .single();

            // Check mandatory fields
            if (!profile?.username || !profile?.full_name) {
                router.push('/onboarding');
            } else {
                setChecking(false);
            }
        };

        checkUser();
    }, [router]);

    if (checking) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Sidebar - Visible on Desktop */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="lg:pl-72 min-h-screen flex flex-col transition-all duration-300">
                <div className="lg:hidden">
                    <Header />
                </div>

                <div className="hidden lg:block sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4 flex justify-end items-center gap-4">
                    <Header />
                </div>

                <main className="flex-1 container mx-auto px-4 py-8 lg:px-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
}
