'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
    Trophy, Medal, Target, CheckCircle2, Users,
    ChevronRight, Loader2, Crown, Info
} from 'lucide-react';

interface LeaderboardEntry {
    user_id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    correct_answers: number;
    total_attempts: number;
    accuracy: number;
    score: number;
    rank: number;
}

interface UserRank extends LeaderboardEntry {
    message?: string;
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<UserRank | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('/api/leaderboard');
            const data = await res.json();
            setLeaderboard(data.leaderboard || []);
            setUserRank(data.userRank || null);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();

        // Real-time updates
        const channel = supabase
            .channel('leaderboard-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'user_progress' },
                () => {
                    fetchLeaderboard();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-500/20';
            case 2:
                return 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-lg shadow-gray-400/20';
            case 3:
                return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/20';
            default:
                return 'bg-secondary text-muted-foreground';
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown size={18} />;
            case 2:
                return <Medal size={18} />;
            case 3:
                return <Medal size={18} />;
            default:
                return <span className="text-sm font-bold">{rank}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Trophy className="text-yellow-500" size={32} />
                        Leaderboard
                    </h1>
                    <p className="text-muted-foreground mt-1">Top achievers in KEAM preparation</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg">
                    <Users size={14} />
                    {leaderboard.length} active
                </div>
            </div>

            {/* User's Own Rank */}
            {userRank && (
                <div className={`rounded-2xl p-5 border ${userRank.rank
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-yellow-500/30 bg-yellow-500/5'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${userRank.rank ? getRankStyle(userRank.rank) : 'bg-secondary text-muted-foreground'
                                }`}>
                                {userRank.rank ? getRankIcon(userRank.rank) : '—'}
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Your Position</p>
                                {userRank.rank ? (
                                    <p className="text-sm text-muted-foreground">
                                        Rank #{userRank.rank} • {userRank.correct_answers} solved • {userRank.accuracy}% accuracy
                                    </p>
                                ) : (
                                    <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                        <Info size={14} />
                                        {userRank.message || 'Solve at least 5 questions to appear on the leaderboard'}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{userRank.score}</div>
                            <div className="text-xs text-muted-foreground">points</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Minimum requirement note */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/50 text-sm text-muted-foreground">
                <Info size={16} />
                <span>Users must solve at least <strong className="text-foreground">5 questions</strong> to appear on the leaderboard.</span>
            </div>

            {/* Leaderboard List */}
            {leaderboard.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
                    <Trophy size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                    <h3 className="font-semibold text-lg mb-2">No entries yet</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                        Be the first to solve 5 questions and claim the top spot!
                    </p>
                    <Link
                        href="/keam/chapterwise"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                        Start Practicing <ChevronRight size={18} />
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {leaderboard.map((entry) => (
                        <button
                            key={entry.user_id}
                            onClick={() => setSelectedUser(selectedUser?.user_id === entry.user_id ? null : entry)}
                            className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${selectedUser?.user_id === entry.user_id
                                    ? 'border-primary/30 bg-primary/5 shadow-md'
                                    : 'border-border bg-card hover:border-primary/20 hover:shadow-sm'
                                } ${entry.rank <= 3 ? 'py-5' : ''}`}
                        >
                            <div className="flex items-center gap-4">
                                {/* Rank Badge */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getRankStyle(entry.rank)}`}>
                                    {getRankIcon(entry.rank)}
                                </div>

                                {/* Avatar */}
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                                    {entry.avatar_url ? (
                                        <Image src={entry.avatar_url} alt={entry.username} width={40} height={40} className="rounded-full" />
                                    ) : (
                                        (entry.full_name || entry.username || 'A').substring(0, 2).toUpperCase()
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground truncate">
                                        {entry.full_name || entry.username}
                                    </p>
                                    <p className="text-sm text-muted-foreground">@{entry.username}</p>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-right">
                                    <div className="hidden sm:block">
                                        <div className="text-sm font-medium text-green-500">{entry.correct_answers} solved</div>
                                        <div className="text-xs text-muted-foreground">{entry.accuracy}% acc</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-primary">{entry.score}</div>
                                        <div className="text-xs text-muted-foreground">pts</div>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {selectedUser?.user_id === entry.user_id && (
                                <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="text-center p-3 rounded-xl bg-secondary">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <CheckCircle2 size={14} className="text-green-500" />
                                        </div>
                                        <div className="text-lg font-bold">{entry.correct_answers}</div>
                                        <div className="text-xs text-muted-foreground">Problems Solved</div>
                                    </div>
                                    <div className="text-center p-3 rounded-xl bg-secondary">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Target size={14} className="text-purple-500" />
                                        </div>
                                        <div className="text-lg font-bold">{entry.accuracy}%</div>
                                        <div className="text-xs text-muted-foreground">Accuracy</div>
                                    </div>
                                    <div className="text-center p-3 rounded-xl bg-secondary">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Trophy size={14} className="text-yellow-500" />
                                        </div>
                                        <div className="text-lg font-bold">{entry.total_attempts}</div>
                                        <div className="text-xs text-muted-foreground">Total Attempts</div>
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
