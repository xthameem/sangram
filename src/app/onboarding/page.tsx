'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [user, setUser] = useState<any>(null);

    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }
            setUser(user);

            // Check if already has profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile?.username && profile?.full_name) {
                router.push('/dashboard');
            } else if (profile) {
                setFullName(profile.full_name || '');
                setUsername(profile.username || '');
            }
            setChecking(false);
        };
        getUser();
    }, [router]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!fullName.trim()) newErrors.fullName = 'Name is required';
        if (fullName.trim().length < 2) newErrors.fullName = 'Name must be at least 2 characters';

        if (!username.trim()) {
            newErrors.username = 'Username is required';
        } else if (!/^[a-z0-9._]+$/.test(username)) {
            newErrors.username = 'Only lowercase letters, numbers, dots, and underscores';
        } else if (username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        } else if (username.length > 20) {
            newErrors.username = 'Username must be 20 characters or less';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            // Check username uniqueness
            const { data: existing } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .neq('id', user.id)
                .single();

            if (existing) {
                setErrors({ username: 'Username already taken' });
                setLoading(false);
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: fullName.trim(),
                    username: username.trim(),
                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.trim())}&background=random`,
                    username_changed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Error updating profile:', error);

            // Fallback for missing columns
            if (
                error.code === '42703' ||
                error.message?.includes('does not exist') ||
                error.message?.includes('Could not find')
            ) {
                try {
                    const { error: retryError } = await supabase.from('profiles').upsert({
                        id: user.id,
                        full_name: fullName.trim(),
                        username: username.trim(),
                        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.trim())}&background=random`,
                        updated_at: new Date().toISOString(),
                    });
                    if (!retryError) {
                        router.push('/dashboard');
                        return;
                    }
                } catch (retryErr) {
                    console.error('Retry failed', retryErr);
                }
            }

            setErrors({ form: error.message || 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Image src="/logo.svg" width={36} height={36} alt="Logo" />
                        <span className="text-white font-bold text-2xl">sangram</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">Welcome! Let&apos;s set you up</h2>
                    <p className="text-indigo-200 text-sm">Just two quick things and you&apos;re good to go.</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errors.form && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800">
                                {errors.form}
                            </div>
                        )}

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Your Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg"
                                placeholder="What should we call you?"
                                autoFocus
                            />
                            {errors.fullName && <p className="text-xs text-red-500 mt-1.5">{errors.fullName}</p>}
                            <p className="text-xs text-slate-500 mt-1.5">This is your display name on the leaderboard.</p>
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Username <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">@</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-lg"
                                    placeholder="pick_a_username"
                                />
                            </div>
                            {errors.username && <p className="text-xs text-red-500 mt-1.5">{errors.username}</p>}
                            <p className="text-xs text-slate-500 mt-1.5">Lowercase letters, numbers, dots, underscores. You can change this once every 14 days.</p>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} /> Setting up...
                                </>
                            ) : (
                                "Let's Go! 🚀"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
