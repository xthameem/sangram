'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    BookOpen, Target, Trophy, Clock, ChevronRight,
    Atom, FlaskConical, Calculator, Lock, ArrowRight
} from 'lucide-react';

interface UserData {
    user: {
        id: string;
        email: string;
        username: string;
        fullName: string;
        avatarUrl: string | null;
        targetExam: string;
    };
    stats: {
        totalAttempts: number;
        correctAnswers: number;
        accuracy: number;
        rank: number | string;
        score: number;
    };
}

interface SubjectProgress {
    subject: string;
    totalAttempts: number;
    correctAnswers: number;
    accuracy: number;
    chaptersAttempted: number;
}

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

export default function DashboardPage() {
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [subjectStats, setSubjectStats] = useState<SubjectProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user data
                const userRes = await fetch('/api/user');
                if (userRes.ok) {
                    const data = await userRes.json();
                    setUserData(data);
                } else if (userRes.status === 401) {
                    router.push('/');
                    return;
                }

                // Fetch progress stats
                const progressRes = await fetch('/api/progress');
                if (progressRes.ok) {
                    const progressData = await progressRes.json();
                    setSubjectStats(progressData.subjectStats || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const userInitials = userData?.user?.username?.substring(0, 2).toUpperCase() || 'GU';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Welcome back, {userData?.user?.username || 'Student'}! 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {(userData?.stats?.totalAttempts ?? 0) > 0
                            ? `You've solved ${userData?.stats?.correctAnswers ?? 0} questions correctly. Keep going!`
                            : 'Start your preparation journey today!'
                        }
                    </p>
                </div>
                <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
                >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {userInitials}
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-sm">{userData?.user?.username}</div>
                        <div className="text-xs text-muted-foreground">View Profile</div>
                    </div>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <BookOpen size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{userData?.stats?.totalAttempts || 0}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Questions Attempted</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                            <Target size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{userData?.stats?.accuracy || 0}%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Accuracy Rate</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                            <Trophy size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{userData?.stats?.score || 0}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Score</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Clock size={20} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">#{userData?.stats?.rank || '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Your Rank</div>
                </div>
            </div>

            {/* Exam Selection */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Choose Your Exam</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {exams.map((exam) => (
                        <div
                            key={exam.id}
                            className={`relative rounded-2xl border p-5 transition-all ${exam.available
                                ? 'border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer'
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
                    <h2 className="text-xl font-semibold">Subject Progress</h2>
                    <Link href="/keam/chapterwise" className="text-sm text-primary hover:underline">
                        View All Chapters
                    </Link>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    {subjects.map((subject) => {
                        const stats = subjectStats.find(s => s.subject === subject.name);
                        const progressPercent = stats ? (stats.correctAnswers / Math.max(stats.totalAttempts, 1)) * 100 : 0;

                        return (
                            <Link
                                key={subject.id}
                                href={`/keam/chapterwise/${subject.id}`}
                                className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${subject.color} text-white`}>
                                        <subject.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{subject.name}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {stats?.totalAttempts || 0} questions attempted
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Accuracy</span>
                                        <span className="font-medium">{stats?.accuracy || 0}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${subject.color} transition-all duration-500`}
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    Practice Now <ChevronRight size={16} className="ml-1" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Leaderboard Preview */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Leaderboard</h2>
                    <Link href="/leaderboard" className="text-sm text-primary hover:underline">
                        View Full Rankings
                    </Link>
                </div>
                <div className="rounded-2xl border border-border bg-card p-5">
                    {userData?.stats?.rank && typeof userData.stats.rank === 'number' ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                    {userInitials}
                                </div>
                                <div>
                                    <div className="font-semibold">{userData.user.username}</div>
                                    <div className="text-sm text-muted-foreground">Score: {userData.stats.score}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-primary">#{userData.stats.rank}</div>
                                <div className="text-xs text-muted-foreground">Your Rank</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground">
                            <Trophy size={40} className="mx-auto mb-3 opacity-50" />
                            <p>Solve questions to appear on the leaderboard!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
