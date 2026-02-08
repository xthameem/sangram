import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const subject = searchParams.get('subject');
    const chapter = searchParams.get('chapter');
    const difficulty = searchParams.get('difficulty');
    const exam = searchParams.get('exam') || 'KEAM';

    let query = supabase
        .from('questions')
        .select('*')
        .eq('exam', exam);

    if (subject) {
        query = query.eq('subject', subject);
    }
    if (chapter) {
        query = query.eq('chapter', chapter);
    }
    if (difficulty) {
        query = query.eq('difficulty', difficulty);
    }

    const { data: questions, error } = await query.order('created_at', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get user progress for these questions
    const { data: { user } } = await supabase.auth.getUser();
    let userProgress: Record<string, boolean> = {};

    if (user) {
        const questionIds = questions?.map(q => q.id) || [];
        const { data: progress } = await supabase
            .from('user_progress')
            .select('question_id, is_correct')
            .eq('user_id', user.id)
            .in('question_id', questionIds);

        progress?.forEach(p => {
            userProgress[p.question_id] = p.is_correct;
        });
    }

    // Add user progress to each question
    const questionsWithProgress = questions?.map(q => ({
        ...q,
        userStatus: userProgress[q.id] !== undefined
            ? (userProgress[q.id] ? 'solved' : 'attempted')
            : 'unattempted'
    }));

    return NextResponse.json({
        questions: questionsWithProgress,
        total: questionsWithProgress?.length || 0
    });
}
