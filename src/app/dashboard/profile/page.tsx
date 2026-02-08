'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Clock, BookOpen, Target, CheckCircle2, User as UserIcon } from 'lucide-react';

const radarData = [
    { subject: 'Physics', A: 90, fullMark: 100 },
    { subject: 'Chemistry', A: 78, fullMark: 100 },
    { subject: 'Mathematics', A: 72, fullMark: 100 },
    { subject: 'Biology', A: 85, fullMark: 100 },
    { subject: 'English', A: 65, fullMark: 100 },
];

const stats = [
    { label: 'Total Questions', value: '3,248', change: '+12%', trend: 'up', icon: BookOpen },
    { label: 'Accuracy Rate', value: '86.4%', change: '+2.1%', trend: 'up', icon: Target },
    { label: 'Study Time', value: '42h', change: '-5%', trend: 'down', icon: Clock },
    { label: 'Tests Taken', value: '24', change: '+4', trend: 'up', icon: CheckCircle2 },
];

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'GU';
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest User';
    const userEmail = user?.email || 'guest@example.com';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* Profile Card */}
                <div className="w-full md:w-1/3 rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4 h-32 w-32 overflow-hidden rounded-full border-4 border-primary/20">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 opacity-80" />
                            <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                                {userInitials}
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">{userName}</h2>
                        <p className="text-muted-foreground">JEE Advanced 2025 Aspirant</p>
                        <div className="mt-4 flex gap-2">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Pro Member</span>
                            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">Online</span>
                        </div>

                        <button className="mt-6 w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors">
                            Edit Profile
                        </button>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Email</span>
                            <span className="font-medium">{userEmail}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Phone</span>
                            <span className="font-medium">+1 (555) 000-0000</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Location</span>
                            <span className="font-medium">New York, USA</span>
                        </div>
                    </div>
                </div>

                {/* Analytics Section */}
                <div className="w-full md:w-2/3 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:shadow-md">
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`p-2 rounded-lg ${stat.trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        <stat.icon size={16} />
                                    </div>
                                    <div className={`text-xs font-semibold flex items-center ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                        {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        <span className="ml-0.5">{stat.change}</span>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-foreground mb-0.5">{stat.value}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-foreground">Performance Radar</h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="var(--muted-foreground)" opacity={0.2} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Performance"
                                        dataKey="A"
                                        stroke="var(--primary)"
                                        strokeWidth={2}
                                        fill="var(--primary)"
                                        fillOpacity={0.4}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                                        itemStyle={{ color: 'var(--foreground)' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
