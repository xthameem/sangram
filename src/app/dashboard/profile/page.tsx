'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Clock, BookOpen, Target, CheckCircle2, Trophy, Edit2 } from 'lucide-react';

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
}

export default function ProfilePage() {
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [subjectStats, setSubjectStats] = useState<SubjectProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editUsername, setEditUsername] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await fetch('/api/user');
                if (userRes.ok) {
                    const data = await userRes.json();
                    setUserData(data);
                    setEditUsername(data.user?.username || '');
                } else if (userRes.status === 401) {
                    router.push('/');
                    return;
                }

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

    const handleSaveProfile = async () => {
        if (!editUsername.trim()) return;

        try {
            const res = await fetch('/api/user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: editUsername.trim() }),
            });

            if (res.ok) {
                setUserData(prev => prev ? {
                    ...prev,
                    user: { ...prev.user, username: editUsername.trim() }
                } : null);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const userInitials = userData?.user?.username?.substring(0, 2).toUpperCase() || 'GU';
    const hasProgress = userData?.stats?.totalAttempts && userData.stats.totalAttempts > 0;

    // Prepare radar data from actual subject stats
    const radarData = subjectStats.length > 0
        ? subjectStats.map(s => ({
            subject: s.subject,
            A: s.accuracy,
            fullMark: 100
        }))
        : [];

    const stats = [
        {
            label: 'Total Questions',
            value: userData?.stats?.totalAttempts || 0,
            icon: BookOpen,
            empty: !hasProgress
        },
        {
            label: 'Correct Answers',
            value: userData?.stats?.correctAnswers || 0,
            icon: CheckCircle2,
            empty: !hasProgress
        },
        {
            label: 'Accuracy Rate',
            value: hasProgress ? `${userData?.stats?.accuracy}%` : '-',
            icon: Target,
            empty: !hasProgress
        },
        {
            label: 'Your Rank',
            value: hasProgress ? `#${userData?.stats?.rank}` : '-',
            icon: Trophy,
            empty: !hasProgress
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* Profile Card */}
                <div className="w-full md:w-1/3 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-full border-4 border-primary/20">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600" />
                            <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                                {userInitials}
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="w-full space-y-3">
                                <input
                                    type="text"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    className="w-full text-center text-xl font-bold bg-secondary rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Enter username"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-foreground">{userData?.user?.username || 'Set Username'}</h2>
                                <p className="text-muted-foreground">{userData?.user?.email}</p>
                                <div className="mt-4 flex gap-2">
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                        {userData?.user?.targetExam || 'KEAM'} Aspirant
                                    </span>
                                </div>

                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
                                >
                                    <Edit2 size={16} />
                                    Edit Profile
                                </button>
                            </>
                        )}
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Email</span>
                            <span className="font-medium truncate ml-2">{userData?.user?.email || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Target Exam</span>
                            <span className="font-medium">{userData?.user?.targetExam || 'KEAM'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total Score</span>
                            <span className="font-medium">{userData?.stats?.score || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="w-full md:w-2/3 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`p-2 rounded-lg ${stat.empty ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                                        <stat.icon size={16} />
                                    </div>
                                </div>
                                <div className={`text-2xl font-bold ${stat.empty ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    {stat.value}
                                </div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-foreground">Performance by Subject</h3>
                        </div>

                        {radarData.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid stroke="var(--muted-foreground)" opacity={0.2} />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="Accuracy"
                                            dataKey="A"
                                            stroke="var(--primary)"
                                            strokeWidth={2}
                                            fill="var(--primary)"
                                            fillOpacity={0.4}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                <Target size={48} className="mb-4 opacity-30" />
                                <p className="text-center">No practice data yet</p>
                                <p className="text-sm text-center mt-1">Start solving questions to see your performance chart</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
