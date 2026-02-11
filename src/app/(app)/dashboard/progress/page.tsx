'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    BookOpen, Target, Trophy, CheckCircle2, XCircle,
    TrendingUp, BarChart3, Award, ChevronRight, Loader2,
    Atom, FlaskConical, Calculator
} from 'lucide-react';

interface Stats {
    questionsAttempted: number;
    correctAnswers: number;
    accuracy: number;
    totalScore: number;
    rank: number;
    chaptersCompleted: number;
}

interface SubjectProgress {
    subject: string;
    total: number;
    solved: number;
    attempted: number;
    percentage: number;
}

interface ChapterProgress {
    chapter: string;
    slug: string;
    total: number;
    solved: number;
    attempted: number;
    subject: string;
    class_level: number;
}

export default function ProgressPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [stats, setStats] = useState<Stats>({
        questionsAttempted: 0,
        correctAnswers: 0,
        accuracy: 0,
        totalScore: 0,
        rank: 0,
        chaptersCompleted: 0,
    });
    const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
    const [chapterProgress, setChapterProgress] = useState<ChapterProgress[]>([]);

    const fetchStats = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/dashboard/stats', {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setStats({
                    questionsAttempted: data.totalAttempts || 0,
                    correctAnswers: data.correctAnswers || 0,
                    accuracy: data.accuracy || 0,
                    totalScore: data.score || 0,
                    rank: data.rank || 0,
                    chaptersCompleted: data.chapters || 0,
                });
                setSubjectProgress(data.subjectProgress || []);
                setChapterProgress(data.chapterProgress || []);
            }
        } catch (e) {
            console.error('Stats fetch error', e);
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

                setUsername(authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'User');
                await fetchStats();

                // Real-time subscription
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
                        () => fetchStats()
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

    const subjectIcons: Record<string, React.ElementType> = {
        'Physics': Atom,
        'Chemistry': FlaskConical,
        'Mathematics': Calculator,
    };
    const subjectColors: Record<string, { text: string; bg: string; gradient: string }> = {
        'Physics': { text: 'text-blue-500', bg: 'bg-blue-500/10', gradient: 'from-blue-500 to-cyan-500' },
        'Chemistry': { text: 'text-green-500', bg: 'bg-green-500/10', gradient: 'from-green-500 to-emerald-500' },
        'Mathematics': { text: 'text-orange-500', bg: 'bg-orange-500/10', gradient: 'from-orange-500 to-amber-500' },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

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
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Attempted</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.correctAnswers || '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Solved</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Target size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.accuracy ? `${stats.accuracy}%` : '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Accuracy</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                            <Award size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.rank ? `#${stats.rank}` : '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Rank</div>
                </div>
            </div>

            {/* Performance Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="text-primary" size={20} />
                        Performance
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="text-green-500" size={20} />
                                <span>Correct Answers</span>
                            </div>
                            <span className="font-bold text-green-500">{stats.correctAnswers}</span>
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
                                <BookOpen className="text-blue-500" size={20} />
                                <span>Chapters Touched</span>
                            </div>
                            <span className="font-bold">{stats.chaptersCompleted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Trophy className="text-yellow-500" size={20} />
                                <span>Total Score</span>
                            </div>
                            <span className="font-bold">{stats.totalScore}</span>
                        </div>
                    </div>
                </div>

                {/* Subject Progress */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="text-primary" size={20} />
                        Subject Progress
                    </h3>
                    {subjectProgress.length > 0 ? (
                        <div className="space-y-5">
                            {subjectProgress.map(sp => {
                                const Icon = subjectIcons[sp.subject] || BookOpen;
                                const colors = subjectColors[sp.subject] || { text: 'text-primary', bg: 'bg-primary/10', gradient: 'from-primary to-primary' };
                                return (
                                    <div key={sp.subject}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1 rounded ${colors.bg} ${colors.text}`}>
                                                    <Icon size={14} />
                                                </div>
                                                <span className="text-sm font-medium">{sp.subject}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{sp.solved}/{sp.total}</span>
                                        </div>
                                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-700`}
                                                style={{ width: `${sp.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No progress data yet. Start practicing!
                        </p>
                    )}
                </div>
            </div>

            {/* Chapter Progress */}
            {chapterProgress.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <BookOpen className="text-primary" size={20} />
                        Chapter-wise Progress
                    </h3>
                    <div className="space-y-3">
                        {chapterProgress.map(cp => {
                            const progress = cp.total > 0 ? Math.round((cp.solved / cp.total) * 100) : 0;
                            const colors = subjectColors[cp.subject] || { gradient: 'from-primary to-primary' };

                            return (
                                <Link
                                    key={cp.chapter}
                                    href={`/keam/chapterwise/${cp.class_level}/${cp.slug}`}
                                    className="block group"
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                                {cp.chapter}
                                            </span>
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{cp.subject}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-green-500 font-medium">{cp.solved} solved</span>
                                            {cp.attempted > 0 && (
                                                <span className="text-xs text-red-500">{cp.attempted - cp.solved} wrong</span>
                                            )}
                                            <span className="text-xs text-muted-foreground">/ {cp.total}</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-500`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {stats.questionsAttempted === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
                    <BarChart3 size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                    <h3 className="font-semibold text-lg mb-2">No activity yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                        Start solving questions to see your progress stats here!
                    </p>
                    <Link href="/keam/chapterwise" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                        Start Practicing <ChevronRight size={18} />
                    </Link>
                </div>
            )}
        </div>
    );
}
