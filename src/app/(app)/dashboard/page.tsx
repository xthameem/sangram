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
                    // Should be handled by layout guard ideally, but safe fallback
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Left Sidebar - Profile Information (Only on Dashboard) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col items-center text-center">
                            <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-background shadow-lg">
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

                            <h2 className="text-xl font-bold text-foreground truncate w-full px-2">
                                {profile.full_name}
                            </h2>
                            <p className="text-sm text-muted-foreground font-medium mb-4">@{profile.username}</p>

                            <div className="w-full space-y-3 pt-4 border-t border-border/50 text-sm">
                                {profile.district && (
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} />
                                            <span>District</span>
                                        </div>
                                        <span className="font-medium text-foreground">{profile.district}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Target size={16} />
                                        <span>Target</span>
                                    </div>
                                    <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">{profile.target_exam || 'KEAM'}</span>
                                </div>
                            </div>

                            <Link
                                href="/onboarding"
                                className="mt-6 w-full py-2 px-4 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit size={14} />
                                Edit Profile
                            </Link>
                        </div>

                        {/* Quick Stats or Motivation */}
                        <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-5">
                            <h3 className="font-semibold mb-2">Keep going! 🚀</h3>
                            <p className="text-sm text-muted-foreground">Detailed progress stats are available in the "My Progress" tab.</p>
                            <Link href="/dashboard/progress" className="mt-3 text-sm text-primary font-medium hover:underline block">
                                View Full Stats →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Content - Exams & Subjects */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Welcome Section */}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Hello, {profile.full_name.split(' ')[0]}! 👋
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Ready to continue your preparation?
                        </p>
                    </div>

                    {/* Exam Selection */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Choose Your Exam</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            </div>
        </div>
    );
}
