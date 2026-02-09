'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BookOpen, Target, CheckCircle2, Trophy, Edit2, Save, X } from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<{ email: string; username: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (!authUser) {
                    router.push('/');
                    return;
                }

                const username = authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'User';
                setUser({
                    email: authUser.email || '',
                    username: username,
                });
                setEditUsername(username);

                // Auto-open edit if username looks like email prefix
                if (username === authUser.email?.split('@')[0] || username.includes('@')) {
                    setIsEditing(true);
                }
            } catch (error) {
                console.error('Auth error:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleSaveUsername = async () => {
        if (!editUsername.trim()) return;

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { username: editUsername.trim() }
            });

            if (!error) {
                setUser(prev => prev ? { ...prev, username: editUsername.trim() } : null);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error updating username:', error);
        } finally {
            setSaving(false);
        }
    };

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
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Profile Card */}
            <div className="rounded-2xl border border-border bg-card p-8">
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-primary/20">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600" />
                        <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                            {userInitials}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="w-full max-w-xs space-y-4">
                            <div>
                                <label className="text-sm text-muted-foreground block mb-2">Choose your username</label>
                                <input
                                    type="text"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    className="w-full text-center text-xl font-bold bg-secondary rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Enter username"
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground mt-2">This will be shown on the leaderboard</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors text-sm flex items-center justify-center gap-2"
                                    disabled={saving}
                                >
                                    <X size={16} /> Cancel
                                </button>
                                <button
                                    onClick={handleSaveUsername}
                                    disabled={saving || !editUsername.trim()}
                                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-foreground">{user.username}</h2>
                            <p className="text-muted-foreground">{user.email}</p>
                            <div className="mt-4">
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                    KEAM Aspirant
                                </span>
                            </div>

                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/50 px-6 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
                            >
                                <Edit2 size={16} />
                                Edit Username
                            </button>
                        </>
                    )}
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
                    <div className="text-2xl font-bold text-muted-foreground">-</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Questions</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                            <Target size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-muted-foreground">-</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Accuracy</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                            <CheckCircle2 size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-muted-foreground">-</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Correct</div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Trophy size={18} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-muted-foreground">-</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Rank</div>
                </div>
            </div>

            {/* Info */}
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
                <p className="text-muted-foreground text-sm">
                    Start solving questions to see your stats here!
                </p>
            </div>
        </div>
    );
}
