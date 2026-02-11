import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch leaderboard data from the VIEW
        const { data: leaderboard, error } = await supabase
            .from('leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Leaderboard fetch error:', error);
            return NextResponse.json({ leaderboard: [], userRank: null });
        }

        // Filter: only include users who have solved at least 5 questions
        const filteredLeaderboard = (leaderboard || [])
            .filter(entry => entry.correct_answers >= 5);

        // Add rank numbers
        const rankedLeaderboard = filteredLeaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1,
        }));

        // Find current user's rank
        let userRank = null;
        if (user) {
            const userEntry = rankedLeaderboard.find(entry => entry.user_id === user.id);
            if (userEntry) {
                userRank = userEntry;
            } else {
                // User doesn't meet the 5-question threshold yet
                // Still show their stats but without a rank
                const fullLeaderboard = (leaderboard || []).find(e => e.user_id === user.id);
                if (fullLeaderboard) {
                    userRank = {
                        ...fullLeaderboard,
                        rank: null, // No rank since they haven't met the threshold
                        message: `Solve at least 5 questions to appear on the leaderboard (${fullLeaderboard.correct_answers}/5)`,
                    };
                }
            }
        }

        // Also fetch full_name from profiles for display
        const userIds = rankedLeaderboard.map(e => e.user_id);
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', userIds);

        const profileMap = new Map(
            (profiles || []).map(p => [p.id, p])
        );

        const enrichedLeaderboard = rankedLeaderboard.map(entry => ({
            ...entry,
            full_name: profileMap.get(entry.user_id)?.full_name || entry.username || 'Anonymous',
            avatar_url: profileMap.get(entry.user_id)?.avatar_url || entry.avatar_url,
        }));

        return NextResponse.json({
            leaderboard: enrichedLeaderboard,
            userRank,
        });

    } catch (error) {
        console.error('Leaderboard error:', error);
        return NextResponse.json({ leaderboard: [], userRank: null }, { status: 500 });
    }
}
