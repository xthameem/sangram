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
    const { questionId, isCorrect, timeTaken, isMockTest } = body;

    // Resolve questionId (slug) to UUID if necessary
    let validQuestionId = questionId;

    // Check if questionId is a UUID (simple regex check)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId);

    if (!isUuid) {
        // It's a slug! Find the corresponding UUID from DB

        // 1. Try finding by 'slug' column (if it exists)
        const { data: qData, error: qError } = await supabase
            .from('questions')
            .select('id')
            .eq('slug', questionId)
            .single();

        if (qData) {
            validQuestionId = qData.id;
        } else {
            // 2. Fallback: Slug column might be missing or empty.
            // Look up the Question Text from local data using the slug
            const localQuestion = allQuestions.find(q => q.slug === questionId);

            if (localQuestion) {
                // Try finding by 'question_text' in DB
                const { data: textData } = await supabase
                    .from('questions')
                    .select('id')
                    .eq('question_text', localQuestion.question_text)
                    .single();

                if (textData) {
                    validQuestionId = textData.id;
                } else {
                    return NextResponse.json({ error: 'Question not found in DB even by text match. Please run seed.' }, { status: 404 });
                }
            } else {
                return NextResponse.json({ error: 'Invalid question slug provided' }, { status: 400 });
            }
        }
    }

    // Check existing progress (First Attempt Logic)
    const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('id, is_correct')
        .eq('user_id', user.id)
        .eq('question_id', validQuestionId)
        .single();

    const isFirstAttempt = !existingProgress;
    const wasAlreadyCorrect = existingProgress?.is_correct === true;

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

    // LEADERBOARD SCORING (First correct answer = +1 point)
    let pointsEarned = 0;

    if (isCorrect && isFirstAttempt && !wasAlreadyCorrect) {
        if (isMockTest) {
            pointsEarned = 0; // Mock test handles its own scoring
        } else {
            pointsEarned = 1;
        }
    }

    if (pointsEarned > 0) {
        // Update Leaderboard
        const { data: currentScore } = await supabase
            .from('leaderboard')
            .select('score, total_attempts, correct_answers')
            .eq('user_id', user.id)
            .single();

        if (currentScore) {
            await supabase
                .from('leaderboard')
                .update({
                    score: currentScore.score + pointsEarned,
                    total_attempts: currentScore.total_attempts + 1,
                    correct_answers: isCorrect ? currentScore.correct_answers + 1 : currentScore.correct_answers,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);
        } else {
            const { data: userProfile } = await supabase
                .from('users')
                .select('username')
                .eq('id', user.id)
                .single();

            await supabase
                .from('leaderboard')
                .insert({
                    user_id: user.id,
                    username: userProfile?.username || 'Anonymous',
                    score: pointsEarned,
                    total_attempts: 1,
                    correct_answers: isCorrect ? 1 : 0,
                });
        }
    } else if (isFirstAttempt) {
        // Track first attempt even if wrong
        const { data: currentScore } = await supabase
            .from('leaderboard')
            .select('score, total_attempts, correct_answers')
            .eq('user_id', user.id)
            .single();

        if (currentScore) {
            await supabase
                .from('leaderboard')
                .update({
                    total_attempts: currentScore.total_attempts + 1,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);
        } else {
            const { data: userProfile } = await supabase
                .from('users')
                .select('username')
                .eq('id', user.id)
                .single();

            await supabase
                .from('leaderboard')
                .insert({
                    user_id: user.id,
                    username: userProfile?.username || 'Anonymous',
                    score: 0,
                    total_attempts: 1,
                    correct_answers: 0,
                });
        }
    }

    return NextResponse.json({
        success: true,
        isFirstAttempt,
        pointsEarned,
        message: isCorrect && isFirstAttempt
            ? `+${pointsEarned} point added!`
            : 'Progress saved'
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
