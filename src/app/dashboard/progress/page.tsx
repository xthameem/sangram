'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    BookOpen, Target, Trophy, Clock, CheckCircle2, XCircle,
    TrendingUp, BarChart3, Zap, Award, ChevronRight
} from 'lucide-react';

interface Stats {
    questionsAttempted: number;
    correctAnswers: number;
    accuracy: number;
    totalScore: number;
    rank: number;
    mockTestsTaken: number;
    chaptersCompleted: number;
}

interface UserInfo {
    email: string;
    username: string;
}

export default function ProgressPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({
        questionsAttempted: 0,
        correctAnswers: 0,
        accuracy: 0,
        totalScore: 0,
        rank: 0,
        mockTestsTaken: 0,
        chaptersCompleted: 0,
    });

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            if (res.ok) {
                const data = await res.json();
                setStats({
                    questionsAttempted: data.totalAttempts || 0,
                    correctAnswers: data.correctAnswers || 0,
                    accuracy: data.accuracy || 0,
                    totalScore: data.score || 0,
                    rank: data.rank || 0,
                    mockTestsTaken: data.mockTests || 0,
                    chaptersCompleted: data.chapters || 0,
                });
            }
        } catch (e) {
            console.log('Stats fetch error', e);
        }
    };

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

                // Initial Fetch
                await fetchStats();

                // Real-time Subscription for MY progress
                const channel = supabase
                    .channel('my-progress-updates')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'user_progress',
                            filter: `user_id=eq.${authUser.id}`
                        },
                        () => {
                            fetchStats();
                        }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };

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

    if (!user) return null;

    const userInitials = user.username.substring(0, 2).toUpperCase();

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <BarChart3 className="text-primary" size={32} />
                        My Progress
                    </h1>
                    <p className="text-muted-foreground mt-1">Track your preparation journey</p>
                </div>
                <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
                >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {userInitials}
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-sm">{user.username}</div>
                        <div className="text-xs text-muted-foreground">Edit Profile</div>
                    </div>
                </Link>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <BookOpen size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.questionsAttempted || '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Questions Attempted</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                            <Target size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.accuracy ? `${stats.accuracy}%` : '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Accuracy Rate</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                            <Trophy size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalScore || '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Score</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Award size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.rank ? `#${stats.rank}` : '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Your Rank</div>
                </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Performance Breakdown */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="text-primary" size={20} />
                        Performance Breakdown
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="text-green-500" size={20} />
                                <span>Correct Answers</span>
                            </div>
                            <span className="font-bold text-green-500">{stats.correctAnswers || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <XCircle className="text-red-500" size={20} />
                                <span>Wrong Answers</span>
                            </div>
                            <span className="font-bold text-red-500">{Math.max(0, stats.questionsAttempted - stats.correctAnswers)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="text-purple-500" size={20} />
                                <span>Mock Tests Taken</span>
                            </div>
                            <span className="font-bold">{stats.mockTestsTaken || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <BookOpen className="text-blue-500" size={20} />
                                <span>Chapters Completed</span>
                            </div>
                            <span className="font-bold">{stats.chaptersCompleted || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Zap className="text-yellow-500" size={20} />
                        Quick Actions
                    </h3>
                    <div className="space-y-3">
                        <Link href="/keam/mocktest"
                            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors">
                            <div className="flex items-center gap-3">
                                <Clock className="text-purple-500" size={20} />
                                <div>
                                    <p className="font-medium">Take Mock Test</p>
                                    <p className="text-xs text-muted-foreground">2x leaderboard points</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-muted-foreground" />
                        </Link>
                        <Link href="/keam/chapterwise"
                            className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
                            <div className="flex items-center gap-3">
                                <BookOpen className="text-blue-500" size={20} />
                                <div>
                                    <p className="font-medium">Practice Chapterwise</p>
                                    <p className="text-xs text-muted-foreground">+1 point per correct</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-muted-foreground" />
                        </Link>
                        <Link href="/leaderboard"
                            className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
                            <div className="flex items-center gap-3">
                                <Trophy className="text-yellow-500" size={20} />
                                <div>
                                    <p className="font-medium">View Leaderboard</p>
                                    <p className="text-xs text-muted-foreground">See rankings</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-muted-foreground" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {stats.questionsAttempted === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
                    <BarChart3 size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                    <h3 className="font-semibold text-lg mb-2">No activity yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                        Start solving questions to see your progress stats here!
                    </p>
                    <Link href="/keam" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                        Start Practicing <ChevronRight size={18} />
                    </Link>
                </div>
            )}
        </div>
    );
}
