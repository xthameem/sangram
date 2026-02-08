'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, User } from 'lucide-react';

interface LeaderboardEntry {
    rank: number;
    user_id: string;
    username: string;
    avatar_url: string | null;
    correct_answers: number;
    total_attempts: number;
    accuracy: number;
    score: number;
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch('/api/leaderboard');
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboard(data.leaderboard || []);
                    setCurrentUserRank(data.currentUserRank);
                }
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="text-yellow-500" size={20} />;
        if (rank === 2) return <Medal className="text-gray-400" size={20} />;
        if (rank === 3) return <Medal className="text-amber-600" size={20} />;
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    };

    const getRankStyle = (rank: number) => {
        if (rank === 1) return 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30';
        if (rank === 2) return 'bg-gradient-to-r from-gray-400/10 to-slate-400/10 border-gray-400/30';
        if (rank === 3) return 'bg-gradient-to-r from-amber-600/10 to-orange-600/10 border-amber-600/30';
        return 'border-border';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
                    <Trophy className="text-yellow-500" size={32} />
                    Leaderboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    Top performers in KEAM preparation
                </p>
            </div>

            {/* Current User Rank Card */}
            {currentUserRank && (
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {currentUserRank.username?.substring(0, 2).toUpperCase() || 'YO'}
                            </div>
                            <div>
                                <div className="font-semibold">{currentUserRank.username} (You)</div>
                                <div className="text-sm text-muted-foreground">
                                    Score: {currentUserRank.score} • Accuracy: {currentUserRank.accuracy}%
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-primary">#{currentUserRank.rank}</div>
                            <div className="text-xs text-muted-foreground">Your Rank</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Leaderboard List */}
            {leaderboard.length > 0 ? (
                <div className="space-y-3">
                    {leaderboard.map((entry) => (
                        <div
                            key={entry.user_id}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankStyle(entry.rank)} ${currentUserRank?.user_id === entry.user_id ? 'ring-2 ring-primary' : ''
                                }`}
                        >
                            <div className="w-10 flex items-center justify-center">
                                {getRankIcon(entry.rank)}
                            </div>

                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                {entry.username?.substring(0, 2).toUpperCase() || 'AN'}
                            </div>

                            <div className="flex-1">
                                <div className="font-medium">
                                    {entry.username}
                                    {currentUserRank?.user_id === entry.user_id && (
                                        <span className="ml-2 text-xs text-primary">(You)</span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {entry.correct_answers} correct • {entry.accuracy}% accuracy
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xl font-bold">{entry.score}</div>
                                <div className="text-xs text-muted-foreground">points</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                    <Trophy size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="text-lg font-medium text-muted-foreground">No rankings yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Be the first to solve questions and appear on the leaderboard!
                    </p>
                </div>
            )}

            {/* Scoring Info */}
            <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-semibold mb-3">How Scoring Works</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Each correct answer = <span className="text-foreground font-medium">+10 points</span></li>
                    <li>• Accuracy bonus (10+ questions) = <span className="text-foreground font-medium">Up to +50 points</span></li>
                    <li>• Rankings update in real-time as you solve questions</li>
                </ul>
            </div>
        </div>
    );
}
