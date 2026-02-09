'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KERALA_DISTRICTS } from '@/data/kerala-districts';
import { supabase } from '@/lib/supabase';
import { User } from 'lucide-react';
import Image from 'next/image';

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [district, setDistrict] = useState('');
    const [mobile, setMobile] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

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
                // Already onboarded
                router.push('/dashboard');
            } else if (profile) {
                // Pre-fill if partial data
                setFullName(profile.full_name || '');
                setUsername(profile.username || '');
                setDistrict(profile.district || '');
                setMobile(profile.mobile || '');
                setAvatarUrl(profile.avatar_url || '');
            }
        };
        getUser();
    }, [router]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!fullName.trim()) newErrors.fullName = 'Name is required';

        if (!username.trim()) {
            newErrors.username = 'Username is required';
        } else if (!/^[a-z0-9._]+$/.test(username)) {
            newErrors.username = 'Only lowercase letters, numbers, dots, and underscores allowed';
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
                .neq('id', user.id) // Exclude self
                .single();

            if (existing) {
                setErrors({ ...errors, username: 'Username already taken' });
                setLoading(false);
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: fullName,
                    username,
                    district: district || null,
                    mobile: mobile || null,
                    avatar_url: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            router.push('/dashboard');
        } catch (error: any) {
            console.error('Error updating profile:', error);

            // Graceful fallback: If 'district' or 'mobile' columns missing (Schema Mismatch)
            // Postgres Error 42703: undefined_column
            if (error.code === '42703' || error.message?.includes('does not exist')) {
                try {
                    const { error: retryError } = await supabase.from('profiles').upsert({
                        id: user.id,
                        full_name: fullName,
                        username,
                        avatar_url: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
                        updated_at: new Date().toISOString()
                    });

                    if (!retryError) {
                        router.push('/dashboard');
                        return;
                    }
                } catch (retryErr) {
                    console.error('Retry failed', retryErr);
                }
            }

            setErrors({ ...errors, form: error.message || 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">

                {/* Left Side - Visual */}
                <div className="bg-slate-900 p-8 hidden md:flex flex-col justify-between w-1/3">
                    <div>
                        <div className="flex items-center gap-2 mb-8">
                            <Image src="/logo.svg" width={32} height={32} alt="Logo" />
                            <span className="text-white font-bold text-xl">sangram</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Complete your profile</h2>
                        <p className="text-slate-400 text-sm">To give you the best experience, we need to know a little bit about you.</p>
                    </div>

                    <div className="space-y-2">
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-1/2"></div>
                        </div>
                        <p className="text-xs text-slate-500">Step 1 of 2</p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="p-8 w-full md:w-2/3">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 md:hidden">Complete Profile</h1>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {errors.form && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{errors.form}</div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. Adarsh Kumar"
                                />
                                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value.toLowerCase())}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g. adarsh.kumar"
                                />
                                <p className="text-xs text-slate-500 mt-1">Only lowercase letters, numbers, dots, and underscores.</p>
                                {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        District (Optional)
                                    </label>
                                    <select
                                        value={district}
                                        onChange={e => setDistrict(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="">Select District</option>
                                        {KERALA_DISTRICTS.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Mobile (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={mobile}
                                        onChange={e => setMobile(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Mobile number"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Profile Picture URL (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={avatarUrl}
                                    onChange={e => setAvatarUrl(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="https://example.com/avatar.jpg"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving Profile...' : 'Complete Setup'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
