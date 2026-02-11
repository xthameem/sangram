'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
    Edit2, Save, X, Loader2, ArrowLeft, CheckCircle2, Clock,
    BookOpen, Target, Trophy
} from 'lucide-react';

interface ProfileData {
    id: string;
    full_name: string;
    username: string;
    email: string;
    username_changed_at: string | null;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit states
    const [editingName, setEditingName] = useState(false);
    const [editingUsername, setEditingUsername] = useState(false);
    const [editName, setEditName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [successMsg, setSuccessMsg] = useState('');

    // Stats
    const [stats, setStats] = useState({ totalAttempts: 0, correctAnswers: 0, accuracy: 0, rank: 0 });

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { router.push('/'); return; }

                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url, username_changed_at')
                    .eq('id', user.id)
                    .single();

                if (!profileData?.username) {
                    router.push('/onboarding');
                    return;
                }

                setProfile({
                    id: profileData.id,
                    full_name: profileData.full_name || '',
                    username: profileData.username || '',
                    email: user.email || '',
                    username_changed_at: profileData.username_changed_at || null,
                });
                setEditName(profileData.full_name || '');
                setEditUsername(profileData.username || '');

                // Fetch stats
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch('/api/dashboard/stats', {
                    headers: { Authorization: `Bearer ${session?.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats({
                        totalAttempts: data.totalAttempts || 0,
                        correctAnswers: data.correctAnswers || 0,
                        accuracy: data.accuracy || 0,
                        rank: data.rank || 0,
                    });
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [router]);

    const canChangeUsername = () => {
        if (!profile?.username_changed_at) return true;
        const lastChanged = new Date(profile.username_changed_at);
        const daysSince = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince >= 14;
    };

    const daysUntilUsernameChange = () => {
        if (!profile?.username_changed_at) return 0;
        const lastChanged = new Date(profile.username_changed_at);
        const daysSince = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
        return Math.max(0, Math.ceil(14 - daysSince));
    };

    const handleSaveName = async () => {
        if (!editName.trim() || editName.trim().length < 2) {
            setErrors({ name: 'Name must be at least 2 characters' });
            return;
        }

        setSaving(true);
        setErrors({});
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: editName.trim(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', profile!.id);

            if (error) throw error;

            setProfile(prev => prev ? { ...prev, full_name: editName.trim() } : null);
            setEditingName(false);
            setSuccessMsg('Name updated!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error: any) {
            setErrors({ name: error.message || 'Failed to update name' });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveUsername = async () => {
        const trimmed = editUsername.trim();
        if (!trimmed || trimmed.length < 3) {
            setErrors({ username: 'Username must be at least 3 characters' });
            return;
        }
        if (!/^[a-z0-9._]+$/.test(trimmed)) {
            setErrors({ username: 'Only lowercase letters, numbers, dots, underscores' });
            return;
        }
        if (trimmed === profile?.username) {
            setEditingUsername(false);
            return;
        }

        setSaving(true);
        setErrors({});
        try {
            // Check uniqueness
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', trimmed)
                .neq('id', profile!.id)
                .single();

            if (existing) {
                setErrors({ username: 'Username already taken' });
                setSaving(false);
                return;
            }

            const updateData: Record<string, any> = {
                username: trimmed,
                username_changed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', profile!.id);

            if (error) {
                // Fallback without username_changed_at if column doesn't exist
                if (error.code === '42703' || error.message?.includes('does not exist')) {
                    const { error: retryError } = await supabase
                        .from('profiles')
                        .update({ username: trimmed, updated_at: new Date().toISOString() })
                        .eq('id', profile!.id);
                    if (retryError) throw retryError;
                } else {
                    throw error;
                }
            }

            setProfile(prev => prev ? { ...prev, username: trimmed, username_changed_at: new Date().toISOString() } : null);
            setEditingUsername(false);
            setSuccessMsg('Username updated!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error: any) {
            setErrors({ username: error.message || 'Failed to update username' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!profile) return null;

    const initials = (profile.full_name || profile.username).substring(0, 2).toUpperCase();
    const daysLeft = daysUntilUsernameChange();
    const canEditUsername = canChangeUsername();

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Back button */}
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            {/* Success message */}
            {successMsg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm animate-in fade-in duration-200">
                    <CheckCircle2 size={16} />
                    {successMsg}
                </div>
            )}

            {/* Profile Card */}
            <div className="rounded-2xl border border-border bg-card p-8">
                <div className="flex flex-col items-center text-center">
                    {/* Initials Avatar */}
                    <div className="mb-6 h-24 w-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                        {initials}
                    </div>

                    {/* Full Name */}
                    <div className="w-full max-w-sm mb-4">
                        {editingName ? (
                            <div className="space-y-3">
                                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Display Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full text-center text-xl font-bold bg-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Your name"
                                    autoFocus
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setEditingName(false); setEditName(profile.full_name); setErrors({}); }}
                                        className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors text-sm flex items-center justify-center gap-2"
                                        disabled={saving}
                                    >
                                        <X size={16} /> Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveName}
                                        disabled={saving}
                                        className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="group">
                                <h2 className="text-2xl font-bold text-foreground">{profile.full_name}</h2>
                                <button
                                    onClick={() => setEditingName(true)}
                                    className="mt-1 text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                                >
                                    <Edit2 size={12} /> Edit name
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Username */}
                    <div className="w-full max-w-sm mb-4">
                        {editingUsername ? (
                            <div className="space-y-3">
                                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Username</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                    <input
                                        type="text"
                                        value={editUsername}
                                        onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                                        className="w-full text-center text-lg font-medium bg-secondary rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="username"
                                        autoFocus
                                    />
                                </div>
                                {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setEditingUsername(false); setEditUsername(profile.username); setErrors({}); }}
                                        className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors text-sm flex items-center justify-center gap-2"
                                        disabled={saving}
                                    >
                                        <X size={16} /> Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveUsername}
                                        disabled={saving}
                                        className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-muted-foreground text-lg">@{profile.username}</p>
                                {canEditUsername ? (
                                    <button
                                        onClick={() => setEditingUsername(true)}
                                        className="mt-1 text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                                    >
                                        <Edit2 size={12} /> Change username
                                    </button>
                                ) : (
                                    <p className="mt-1 text-xs text-muted-foreground inline-flex items-center gap-1">
                                        <Clock size={12} /> Can change in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground">{profile.email}</p>

                    <div className="mt-3">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            KEAM Aspirant
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <BookOpen size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.totalAttempts || '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Questions</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                            <Target size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.accuracy ? `${stats.accuracy}%` : '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Accuracy</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.correctAnswers || '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Solved</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Trophy size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold">{stats.rank ? `#${stats.rank}` : '-'}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Rank</div>
                </div>
            </div>

            {/* Info */}
            {stats.totalAttempts === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
                    <p className="text-muted-foreground text-sm">
                        Start solving questions to see your stats here!
                    </p>
                </div>
            )}
        </div>
    );
}
