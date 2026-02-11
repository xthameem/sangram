import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';
import { allQuestions } from '@/data/questions';

export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, isCorrect, timeTaken } = body;

    // Resolve questionId (slug) to UUID if necessary
    let validQuestionId = questionId;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId);

    if (!isUuid) {
        // It's a slug — find corresponding UUID from DB
        const { data: qData } = await supabase
            .from('questions')
            .select('id')
            .eq('slug', questionId)
            .single();

        if (qData) {
            validQuestionId = qData.id;
        } else {
            // Fallback: find by question_text from local data
            const localQuestion = allQuestions.find(q => q.slug === questionId);

            if (localQuestion) {
                const { data: textData } = await supabase
                    .from('questions')
                    .select('id')
                    .eq('question_text', localQuestion.question_text)
                    .single();

                if (textData) {
                    validQuestionId = textData.id;
                } else {
                    return NextResponse.json({ error: 'Question not found in DB. Please run seed.' }, { status: 404 });
                }
            } else {
                return NextResponse.json({ error: 'Invalid question slug provided' }, { status: 400 });
            }
        }
    }

    // Check existing progress
    const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('id, is_correct')
        .eq('user_id', user.id)
        .eq('question_id', validQuestionId)
        .single();

    const isFirstAttempt = !existingProgress;

    // Upsert progress
    const { error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            question_id: validQuestionId,
            is_correct: isCorrect,
            time_taken: timeTaken,
            attempted_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,question_id'
        });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Leaderboard is auto-computed via SQL VIEW from user_progress
    // No need to manually update a leaderboard table

    return NextResponse.json({
        success: true,
        isFirstAttempt,
        isCorrect,
        message: isCorrect
            ? (isFirstAttempt ? 'Correct! Progress saved.' : 'Correct!')
            : 'Incorrect. Try reviewing the explanation.'
    });
}

// GET Handler
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: progress, error } = await supabase
        .from('user_progress')
        .select(`
            *,
            questions (subject, chapter, difficulty)
        `)
        .eq('user_id', user.id);

    if (error) {
        console.error("Error fetching progress:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate stats
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
