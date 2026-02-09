'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, User, Eye, X, BarChart3, Target, Zap, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
    rank: number;
    user_id: string;
    username: string;
    avatar_url: string | null;
    correct_answers: number;
    total_attempts: number;
    accuracy: number;
    score: number;
    mock_tests_taken?: number;
    chapters_completed?: number;
}

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);

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

    const maskUserId = (userId: string) => {
        if (userId.length <= 8) return userId.substring(0, 4) + '****';
        return userId.substring(0, 4) + '****' + userId.substring(userId.length - 4);
    };

    const generateMockStats = (entry: LeaderboardEntry) => ({
        mock_tests_taken: Math.floor(entry.total_attempts / 15) || 1,
        chapters_completed: Math.min(12, Math.floor(entry.correct_answers / 5)),
        avg_time_per_question: Math.floor(45 + Math.random() * 60),
        streak_days: Math.floor(Math.random() * 14) + 1,
        physics_accuracy: Math.floor(entry.accuracy - 5 + Math.random() * 10),
        chemistry_accuracy: Math.floor(entry.accuracy - 5 + Math.random() * 10),
        maths_accuracy: Math.floor(entry.accuracy - 5 + Math.random() * 10),
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
                    <Trophy className="text-yellow-500" size={32} />
                    Leaderboard
                </h1>
                <p className="text-muted-foreground mt-1">Top performers in KEAM preparation</p>
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
                        <div key={entry.user_id}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${getRankStyle(entry.rank)} ${currentUserRank?.user_id === entry.user_id ? 'ring-2 ring-primary' : ''}`}>
                            <div className="w-10 flex items-center justify-center">
                                {getRankIcon(entry.rank)}
                            </div>

                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                {entry.username?.substring(0, 2).toUpperCase() || 'AN'}
                            </div>

                            <div className="flex-1">
                                <div className="font-medium">
                                    {currentUserRank?.user_id === entry.user_id ? entry.username : `User_${maskUserId(entry.user_id)}`}
                                    {currentUserRank?.user_id === entry.user_id && (
                                        <span className="ml-2 text-xs text-primary">(You)</span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {entry.correct_answers} correct • {entry.accuracy}% accuracy
                                </div>
                            </div>

                            <button onClick={() => setSelectedUser(entry)}
                                className="p-2 rounded-lg hover:bg-secondary transition-colors" title="View Stats">
                                <Eye size={18} className="text-muted-foreground" />
                            </button>

                            <div className="text-right min-w-[60px]">
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
                    <p className="text-sm text-muted-foreground mt-1">Be the first to solve questions!</p>
                </div>
            )}

            {/* Scoring Info */}
            <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="text-yellow-500" size={18} />How Scoring Works
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2 text-muted-foreground">
                        <p>📚 <strong>Chapterwise:</strong> +1 point per correct</p>
                        <p>📝 <strong>Mock Test:</strong> +2x score + 3 bonus per correct</p>
                    </div>
                    <div className="space-y-2 text-muted-foreground">
                        <p>🎯 <strong>Accuracy Bonus:</strong> Up to +50 points</p>
                        <p>🔥 <strong>Streak Bonus:</strong> Coming soon!</p>
                    </div>
                </div>
            </div>

            {/* User Stats Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
                    <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <BarChart3 className="text-primary" size={24} />
                                User Stats
                            </h3>
                            <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg hover:bg-secondary">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-secondary/50">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                {selectedUser.username?.substring(0, 2).toUpperCase() || 'AN'}
                            </div>
                            <div>
                                <div className="font-semibold">User_{maskUserId(selectedUser.user_id)}</div>
                                <div className="text-sm text-muted-foreground">Rank #{selectedUser.rank}</div>
                            </div>
                            <div className="ml-auto text-right">
                                <div className="text-2xl font-bold text-primary">{selectedUser.score}</div>
                                <div className="text-xs text-muted-foreground">points</div>
                            </div>
                        </div>

                        {(() => {
                            const stats = generateMockStats(selectedUser);
                            return (
                                <>
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                                            <Target className="mx-auto text-blue-500 mb-1" size={20} />
                                            <p className="text-lg font-bold">{selectedUser.accuracy}%</p>
                                            <p className="text-xs text-muted-foreground">Accuracy</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
                                            <TrendingUp className="mx-auto text-green-500 mb-1" size={20} />
                                            <p className="text-lg font-bold">{selectedUser.correct_answers}</p>
                                            <p className="text-xs text-muted-foreground">Correct</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
                                            <Zap className="mx-auto text-purple-500 mb-1" size={20} />
                                            <p className="text-lg font-bold">{stats.mock_tests_taken}</p>
                                            <p className="text-xs text-muted-foreground">Mock Tests</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
                                            <BarChart3 className="mx-auto text-orange-500 mb-1" size={20} />
                                            <p className="text-lg font-bold">{stats.chapters_completed}</p>
                                            <p className="text-xs text-muted-foreground">Chapters</p>
                                        </div>
                                    </div>

                                    {/* Subject Performance */}
                                    <h4 className="font-semibold mb-3">Subject Performance</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Physics</span><span>{stats.physics_accuracy}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.physics_accuracy}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Chemistry</span><span>{stats.chemistry_accuracy}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.chemistry_accuracy}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Mathematics</span><span>{stats.maths_accuracy}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stats.maths_accuracy}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
