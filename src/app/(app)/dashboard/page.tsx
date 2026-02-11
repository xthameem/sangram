'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
    BookOpen, Target, Trophy, CheckCircle2, ChevronRight,
    Atom, FlaskConical, Calculator, GraduationCap, TrendingUp,
    BarChart3, Loader2
} from 'lucide-react';

interface UserProfile {
    email: string;
    username: string;
    full_name: string;
    avatar_url: string;
    exam: string;
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

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Stats
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [rank, setRank] = useState(0);
    const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
    const [chapterProgress, setChapterProgress] = useState<ChapterProgress[]>([]);

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (!authUser) {
                    router.push('/');
                    return;
                }

                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (!profile?.username) {
                    router.push('/onboarding');
                    return;
                }

                setUser({
                    email: authUser.email || '',
                    username: profile.username || '',
                    full_name: profile.full_name || profile.username || '',
                    avatar_url: profile.avatar_url || '',
                    exam: profile.exam || 'KEAM',
                });

                // Fetch stats
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch('/api/dashboard/stats', {
                    headers: { Authorization: `Bearer ${session?.access_token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setTotalAttempts(data.totalAttempts || 0);
                    setCorrectAnswers(data.correctAnswers || 0);
                    setAccuracy(data.accuracy || 0);
                    setRank(data.rank || 0);
                    setSubjectProgress(data.subjectProgress || []);
                    setChapterProgress(data.chapterProgress || []);
                }
            } catch (error) {
                console.error('Init error:', error);
            } finally {
                setLoading(false);
            }
        };

        init();
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

    if (!user) return null;

    const userInitials = user.username.substring(0, 2).toUpperCase();

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Banner */}
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {user.avatar_url ? (
                                <Image src={user.avatar_url} alt={user.username} width={56} height={56} className="rounded-full" />
                            ) : (
                                userInitials
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Welcome back, {user.full_name || user.username}! 👋
                            </h1>
                            <p className="text-muted-foreground text-sm mt-0.5">
                                @{user.username} • Preparing for {user.exam}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/keam/chapterwise"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                        Start Practicing <ChevronRight size={18} />
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <BookOpen size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{totalAttempts || '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Questions Attempted</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{correctAnswers || '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Questions Solved</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Target size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{accuracy ? `${accuracy}%` : '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Accuracy</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                            <Trophy size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{rank ? `#${rank}` : '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Leaderboard Rank</div>
                </div>
            </div>

            {/* Subject Progress */}
            {subjectProgress.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp className="text-primary" size={20} />
                        Subject Progress
                    </h2>
                    <div className="space-y-5">
                        {subjectProgress.map(sp => {
                            const Icon = subjectIcons[sp.subject] || BookOpen;
                            const colors = subjectColors[sp.subject] || { text: 'text-primary', bg: 'bg-primary/10', gradient: 'from-primary to-primary' };

                            return (
                                <div key={sp.subject}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${colors.bg} ${colors.text}`}>
                                                <Icon size={16} />
                                            </div>
                                            <span className="font-medium text-sm">{sp.subject}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {sp.solved}/{sp.total} solved ({sp.percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full transition-all duration-700`}
                                            style={{ width: `${sp.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Chapter Progress */}
            {chapterProgress.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <BarChart3 className="text-primary" size={20} />
                        Chapter Progress
                    </h2>
                    <div className="space-y-3">
                        {chapterProgress.slice(0, 10).map(cp => {
                            const progress = cp.total > 0 ? Math.round((cp.solved / cp.total) * 100) : 0;
                            const colors = subjectColors[cp.subject] || { text: 'text-primary', bg: 'bg-primary/10', gradient: 'from-primary to-primary' };

                            return (
                                <Link
                                    key={cp.chapter}
                                    href={`/keam/chapterwise/${cp.class_level}/${cp.slug}`}
                                    className="block group"
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">
                                                {cp.chapter}
                                            </span>
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{cp.subject}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{cp.solved}/{cp.total}</span>
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

            {/* Exams */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        name: 'KEAM',
                        description: 'Kerala Engineering & Medical',
                        href: '/keam',
                        available: true,
                        gradient: 'from-indigo-500 to-purple-500',
                        bgGlow: 'group-hover:shadow-indigo-500/10',
                    },
                    {
                        name: 'NEET',
                        description: 'Medical Entrance',
                        href: '#',
                        available: false,
                        gradient: 'from-green-500 to-emerald-500',
                        bgGlow: '',
                    },
                    {
                        name: 'CUSAT',
                        description: 'Cochin University',
                        href: '#',
                        available: false,
                        gradient: 'from-blue-500 to-cyan-500',
                        bgGlow: '',
                    },
                    {
                        name: 'JEE',
                        description: 'Joint Entrance Exam',
                        href: '#',
                        available: false,
                        gradient: 'from-orange-500 to-red-500',
                        bgGlow: '',
                    },
                ].map(exam => (
                    <Link
                        key={exam.name}
                        href={exam.available ? exam.href : '#'}
                        className={`group relative rounded-2xl border p-5 transition-all duration-300 ${exam.available
                                ? `border-border bg-card hover:border-primary/30 hover:shadow-lg ${exam.bgGlow}`
                                : 'border-border bg-card/50 opacity-60 cursor-default'
                            }`}
                    >
                        <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${exam.gradient} text-white mb-3 shadow-lg`}>
                            <GraduationCap size={22} />
                        </div>
                        <h3 className="font-bold text-foreground text-lg">{exam.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{exam.description}</p>
                        {exam.available ? (
                            <div className="mt-3 flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                                Open <ChevronRight size={14} />
                            </div>
                        ) : (
                            <span className="mt-3 inline-block px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground font-medium">
                                Coming Soon
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            {/* Empty State */}
            {totalAttempts === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
                    <BookOpen size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                    <h3 className="font-semibold text-lg mb-2">Start your KEAM journey!</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                        Practice chapter-wise questions to track your progress and climb the leaderboard.
                    </p>
                    <Link
                        href="/keam/chapterwise"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                        Start Practicing <ChevronRight size={18} />
                    </Link>
                </div>
            )}
        </div>
    );
}
