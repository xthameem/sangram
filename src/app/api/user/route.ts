import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Get user progress stats
    const { data: progress } = await supabase
        .from('user_progress')
        .select('is_correct, question_id')
        .eq('user_id', user.id);

    const totalAttempts = progress?.length || 0;
    const correctAnswers = progress?.filter(p => p.is_correct).length || 0;
    const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

    // Get rank from leaderboard
    const { data: leaderboard } = await supabase
        .from('leaderboard')
        .select('user_id, score');

    const sortedLeaderboard = leaderboard?.sort((a, b) => b.score - a.score) || [];
    const rank = sortedLeaderboard.findIndex(l => l.user_id === user.id) + 1;

    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email,
            username: profile?.username || user.email?.split('@')[0],
            fullName: profile?.full_name,
            avatarUrl: profile?.avatar_url,
            targetExam: profile?.target_exam || 'KEAM',
        },
        stats: {
            totalAttempts,
            correctAnswers,
            accuracy,
            rank: rank || 'Unranked',
            score: sortedLeaderboard.find(l => l.user_id === user.id)?.score || 0,
        }
    });
}

export async function PUT(request: Request) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, fullName, targetExam } = body;

    const { error } = await supabase
        .from('profiles')
        .update({
            username,
            full_name: fullName,
            target_exam: targetExam,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
}
