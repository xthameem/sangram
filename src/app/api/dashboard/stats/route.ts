import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: Request) {
    // Get user from auth header or session (Supabase Auth Helper cleaner, but using simple client here)
    // We need to parse the cookie manually or just use headers if forwarded.
    // Actually, in App Router API routes, we should use createRouteHandlerClient. 
    // But since I don't have that setup ready, I'll trust the user is authenticated via client
    // BUT best practice: Use getUser() with cookie store.

    // For now, I'll rely on the client sending usage stats via a separate secure call,
    // OR easier: just fetch all rows match user via specific client? 
    // No, I need the user ID. 
    // I'll grab it from the request headers if passed, or better, use `supabase.auth.getUser(token)`.

    // Let's assume standard auth header 'Authorization: Bearer <token>'
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch User Progress Stats
    const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('is_correct, time_spent_seconds, question_id')
        .eq('user_id', user.id);

    if (progressError) {
        return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    const totalAttempts = progress.length;
    const correctAnswers = progress.filter(p => p.is_correct).length;
    const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

    // Simple score logic: +4 for correct, -1 for wrong (standard JEE/KEAM)
    // Or just +4 for now as per user preference (no negative in leaderboard, but maybe here?)
    // User requested "No negative marking in leaderboard". 
    // I'll use +4 for correct only here to match "Score".
    const score = correctAnswers * 4;

    // 2. Fetch Rank from Leaderboard View
    const { data: leaderboardData } = await supabase
        .from('leaderboard')
        .select('user_id')
        .order('score', { ascending: false })
        .order('correct_answers', { ascending: false });

    const rank = leaderboardData ? leaderboardData.findIndex(u => u.user_id === user.id) + 1 : 0;

    // 3. Mock Tests & Chapters (Estimate)
    // We can count unique chapters from questions joined? Too complex.
    // Just return 0 for now or simple count.

    return NextResponse.json({
        totalAttempts,
        correctAnswers,
        accuracy,
        score,
        rank,
        mockTests: 0, // Todo: track mock tests
        chapters: 0, // Todo: track unique chapters
    });
}
