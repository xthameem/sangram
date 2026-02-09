'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    ChevronRight, Atom, FlaskConical, Calculator, Lock, ArrowRight
} from 'lucide-react';

const exams = [
    { id: 'keam', name: 'KEAM', available: true, description: 'Kerala Engineering & Medical' },
    { id: 'cusat', name: 'CUSAT CAT', available: false, description: 'Cochin University' },
    { id: 'jee', name: 'JEE Main', available: false, description: 'Joint Entrance Exam' },
    { id: 'neet', name: 'NEET', available: false, description: 'Medical Entrance' },
];

const subjects = [
    { id: 'physics', name: 'Physics', icon: Atom, color: 'from-blue-500 to-cyan-500' },
    { id: 'chemistry', name: 'Chemistry', icon: FlaskConical, color: 'from-green-500 to-emerald-500' },
    { id: 'maths', name: 'Mathematics', icon: Calculator, color: 'from-purple-500 to-pink-500' },
];

interface UserInfo {
    email: string;
    username: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (!authUser) {
                    router.push('/');
                    return;
                }

                setUser({
                    email: authUser.email || '',
                    username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'User',
                });
            } catch (error) {
                console.error('Auth error:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const needsUsername = user.username === user.email.split('@')[0] || user.username.includes('@');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Username Setup Banner */}
            {needsUsername && (
                <Link
                    href="/dashboard/profile"
                    className="block rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 hover:bg-yellow-500/15 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-yellow-600 dark:text-yellow-400">Set up your username</h3>
                            <p className="text-sm text-muted-foreground">Choose a unique username to appear on the leaderboard</p>
                        </div>
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium text-sm">Set up →</span>
                    </div>
                </Link>
            )}

            {/* Welcome Section - Simple */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">
                    Welcome, {user.username}! 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                    Choose an exam to start practicing
                </p>
            </div>

            {/* Exam Selection - Now at Top */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Choose Your Exam</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {exams.map((exam) => (
                        <div
                            key={exam.id}
                            className={`relative rounded-2xl border p-5 transition-all ${exam.available
                                ? 'border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer hover:shadow-lg'
                                : 'border-border bg-card/50 opacity-60'
                                }`}
                            onClick={() => exam.available && router.push('/keam')}
                        >
                            {!exam.available && (
                                <div className="absolute top-3 right-3">
                                    <Lock size={16} className="text-muted-foreground" />
                                </div>
                            )}
                            <h3 className="font-bold text-lg">{exam.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{exam.description}</p>
                            {exam.available ? (
                                <div className="mt-3 flex items-center text-primary text-sm font-medium">
                                    Start Practice <ArrowRight size={14} className="ml-1" />
                                </div>
                            ) : (
                                <div className="mt-3 text-xs text-muted-foreground">Coming Soon</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Subject Progress */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Quick Start - Subjects</h2>
                    <Link href="/keam/chapterwise" className="text-sm text-primary hover:underline">
                        View All Chapters
                    </Link>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    {subjects.map((subject) => (
                        <Link
                            key={subject.id}
                            href={`/keam/chapterwise/${subject.id}`}
                            className="rounded-2xl border border-border bg-card p-5 hover:shadow-md hover:border-primary/30 transition-all group"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${subject.color} text-white`}>
                                    <subject.icon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{subject.name}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Practice questions
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 gap-1 transition-all">
                                Start Now <ChevronRight size={16} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
