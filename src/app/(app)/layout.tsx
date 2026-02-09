'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';

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
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            <Header />
            <main className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl">
                {children}
            </main>
        </div>
    );
}
