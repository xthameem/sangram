import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    const { data: leaderboard, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(100);

    if (error) {
        // If view doesn't exist, return empty
        return NextResponse.json({ leaderboard: [], currentUserRank: null });
    }

    // Sort by score descending
    const sorted = (leaderboard || []).sort((a, b) => b.score - a.score);

    // Add rank to each entry
    const rankedLeaderboard = sorted.map((entry, index) => ({
        rank: index + 1,
        ...entry,
    }));

    // Get current user's rank
    const { data: { user } } = await supabase.auth.getUser();
    let currentUserRank = null;

    if (user) {
        const userEntry = rankedLeaderboard.find(e => e.user_id === user.id);
        currentUserRank = userEntry || null;
    }

    return NextResponse.json({
        leaderboard: rankedLeaderboard.slice(0, 50),
        currentUserRank,
    });
}
