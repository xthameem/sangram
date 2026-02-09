'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
    ChevronRight, Atom, FlaskConical, Calculator, Lock, ArrowRight, User, MapPin, Target, Edit
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!profile) return null;

    const userInitials = profile.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : profile.username.substring(0, 2).toUpperCase();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

                {/* Left Sidebar - Profile Information (Only on Dashboard) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 shadow-sm p-6 flex flex-col items-center text-center backdrop-blur-sm">
                            <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-slate-100 dark:border-slate-800 shadow-lg bg-slate-100 dark:bg-slate-800">
                                {profile.avatar_url && profile.avatar_url.startsWith('http') ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.full_name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold">
                                        {userInitials}
                                    </div>
                                )}
                            </div>

                            <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate w-full px-2">
                                {profile.full_name}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4">@{profile.username}</p>

                            <div className="w-full space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-sm">
                                {profile.district && (
                                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} />
                                            <span>District</span>
                                        </div>
                                        <span className="font-medium text-slate-900 dark:text-white">{profile.district}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Target size={16} />
                                        <span>Target</span>
                                    </div>
                                    <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">{profile.target_exam || 'KEAM'}</span>
                                </div>
                            </div>

                            <Link
                                href="/onboarding"
                                className="mt-6 w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit size={14} />
                                Edit Profile
                            </Link>
                        </div>

                        {/* Quick Stats or Motivation */}
                        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/10 p-5">
                            <h3 className="font-semibold mb-2 text-indigo-900 dark:text-indigo-100">Keep going! 🚀</h3>
                            <p className="text-sm text-indigo-600/80 dark:text-indigo-300/80">Detailed progress stats are available in the "My Progress" tab.</p>
                            <Link href="/dashboard/progress" className="mt-3 text-sm text-primary font-medium hover:underline block">
                                View Full Stats →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Content - Exams & Subjects */}
                <div className="lg:col-span-3 space-y-10">
                    {/* Welcome Section */}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Hello, {profile.full_name.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                            Ready to continue your preparation?
                        </p>
                    </div>

                    {/* Exam Selection */}
                    <div>
                        <h2 className="text-xl font-semibold mb-5 text-slate-900 dark:text-white">Choose Your Exam</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {exams.map((exam) => (
                                <div
                                    key={exam.id}
                                    className={`relative rounded-2xl border p-6 transition-all ${exam.available
                                        ? 'border-primary/50 bg-primary/5 hover:bg-primary/10 cursor-pointer hover:shadow-lg hover:-translate-y-1'
                                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60'
                                        }`}
                                    onClick={() => exam.available && router.push('/keam')}
                                >
                                    {!exam.available && (
                                        <div className="absolute top-4 right-4">
                                            <Lock size={16} className="text-slate-400" />
                                        </div>
                                    )}
                                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">{exam.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{exam.description}</p>
                                    {exam.available ? (
                                        <div className="mt-4 flex items-center text-primary text-sm font-medium">
                                            Start Practice <ArrowRight size={14} className="ml-1" />
                                        </div>
                                    ) : (
                                        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 font-medium px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded w-fit">Coming Soon</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subject Progress */}
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quick Start - Subjects</h2>
                            <Link href="/keam/chapterwise" className="text-sm text-primary hover:underline font-medium">
                                View All Chapters
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            {subjects.map((subject) => (
                                <Link
                                    key={subject.id}
                                    href={`/keam/chapterwise/${subject.id}`}
                                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 p-6 hover:shadow-md hover:border-primary/30 transition-all group hover:-translate-y-1"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${subject.color} text-white shadow-md`}>
                                            <subject.icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">{subject.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
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
            </div>
        </div>
    );
}
