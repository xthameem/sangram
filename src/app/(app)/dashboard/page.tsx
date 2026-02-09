'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    ChevronRight, Atom, FlaskConical, Calculator, Lock, ArrowRight, MapPin, Target, Edit
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

interface Profile {
    username: string;
    full_name: string;
    avatar_url: string;
    district: string;
    target_exam: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/');
                    return;
                }

                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setProfile(data);
                } else {
                    setProfile({
                        username: user.email?.split('@')[0] || 'User',
                        full_name: 'Student',
                        avatar_url: '',
                        district: '',
                        target_exam: 'KEAM'
                    });
                }
            } catch (error) {
                console.error('Auth error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
        );
    }

    if (!profile) return null;

    const userInitials = profile.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : profile.username.substring(0, 2).toUpperCase();

    return (
        <div className="pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Left Sidebar - Profile Information */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        {/* Profile Card */}
                        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col items-center text-center">
                            <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-lg">
                                {profile.avatar_url && profile.avatar_url.startsWith('http') ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.full_name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl font-bold">
                                        {userInitials}
                                    </div>
                                )}
                            </div>

                            <h2 className="text-lg font-bold text-foreground truncate w-full">
                                {profile.full_name}
                            </h2>
                            <p className="text-sm text-muted-foreground mb-4">@{profile.username}</p>

                            <div className="w-full space-y-2 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm">
                                {profile.district && (
                                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} />
                                            <span>District</span>
                                        </div>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{profile.district}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Target size={14} />
                                        <span>Target</span>
                                    </div>
                                    <span className="font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded text-xs">
                                        {profile.target_exam || 'KEAM'}
                                    </span>
                                </div>
                            </div>

                            <Link
                                href="/onboarding"
                                className="mt-5 w-full py-2 px-4 rounded-xl border border-border bg-muted hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit size={14} />
                                Edit Profile
                            </Link>
                        </div>

                        {/* Quick Stats Card */}
                        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 p-5">
                            <h3 className="font-semibold mb-2 text-indigo-900 dark:text-indigo-100">Keep going! 🚀</h3>
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">View your detailed progress and stats.</p>
                            <Link href="/dashboard/progress" className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline block">
                                View Full Stats →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Content - Exams & Subjects */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Welcome Section */}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                            Hello, {profile.full_name.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Ready to continue your preparation?
                        </p>
                    </div>

                    {/* Exam Selection */}
                    <div>
                        <h2 className="text-lg font-semibold mb-4 text-foreground">Choose Your Exam</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {exams.map((exam) => (
                                <div
                                    key={exam.id}
                                    className={`relative rounded-2xl border p-5 transition-all cursor-pointer ${exam.available
                                        ? 'border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/30'
                                        : 'border-border bg-muted/50 opacity-60 cursor-not-allowed'
                                        }`}
                                    onClick={() => exam.available && router.push('/keam')}
                                >
                                    {!exam.available && (
                                        <div className="absolute top-3 right-3">
                                            <Lock size={14} className="text-slate-400" />
                                        </div>
                                    )}
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{exam.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{exam.description}</p>
                                    {exam.available ? (
                                        <div className="mt-3 flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                                            Start Practice <ArrowRight size={14} className="ml-1" />
                                        </div>
                                    ) : (
                                        <div className="mt-3 text-xs text-slate-500 bg-slate-200 dark:bg-slate-700 rounded px-2 py-1 w-fit">Coming Soon</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subject Cards */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick Start - Subjects</h2>
                            <h2 className="text-lg font-semibold text-foreground">Quick Start - Subjects</h2>
                            <Link href="/keam/chapterwise" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                                View All Chapters
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {subjects.map((subject) => (
                                <Link
                                    key={subject.id}
                                    href={`/keam/chapterwise/${subject.id}`}
                                    className="rounded-2xl border border-border bg-card p-5 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${subject.color} text-white shadow-md`}>
                                            <subject.icon size={22} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{subject.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Practice questions
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 font-medium group-hover:gap-2 gap-1 transition-all">
                                        Start Now <ChevronRight size={16} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
