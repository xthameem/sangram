import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, isCorrect, timeTaken } = body;

    // Upsert progress (update if exists, insert if not)
    const { error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            question_id: questionId,
            is_correct: isCorrect,
            time_taken: timeTaken,
            attempted_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,question_id'
        });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    let query = supabase
        .from('user_progress')
        .select(`
      *,
      questions (subject, chapter, difficulty)
    `)
        .eq('user_id', user.id);

    const { data: progress, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats by subject
    const statsBySubject: Record<string, { total: number; correct: number; chapters: Set<string> }> = {};

    progress?.forEach(p => {
        const subj = p.questions?.subject;
        if (subj) {
            if (!statsBySubject[subj]) {
                statsBySubject[subj] = { total: 0, correct: 0, chapters: new Set() };
            }
            statsBySubject[subj].total++;
            if (p.is_correct) statsBySubject[subj].correct++;
            if (p.questions?.chapter) statsBySubject[subj].chapters.add(p.questions.chapter);
        }
    });

    const subjectStats = Object.entries(statsBySubject).map(([subject, stats]) => ({
        subject,
        totalAttempts: stats.total,
        correctAnswers: stats.correct,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        chaptersAttempted: stats.chapters.size,
    }));

    return NextResponse.json({
        progress,
        subjectStats,
        totalAttempts: progress?.length || 0,
        totalCorrect: progress?.filter(p => p.is_correct).length || 0,
    });
}
