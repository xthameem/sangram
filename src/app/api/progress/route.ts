import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, isCorrect, timeTaken, isMockTest } = body;

    // Check if this is a FIRST attempt (never attempted before)
    const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('id, is_correct')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .single();

    const isFirstAttempt = !existingProgress;
    const wasAlreadyCorrect = existingProgress?.is_correct === true;

    // Upsert progress (always update to track latest attempt)
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

    // LEADERBOARD SCORING LOGIC:
    // - Only FIRST correct answer gives points (no exploiting by re-attempting)
    // - No negative marking for wrong answers in leaderboard (fair for all)
    // - Chapterwise: +1 point for first correct
    // - Mock Test: Score is calculated separately with 2x multipliers

    let pointsEarned = 0;

    // Only award points if:
    // 1. It's a correct answer
    // 2. It's either a first attempt OR the question wasn't solved before
    if (isCorrect && isFirstAttempt && !wasAlreadyCorrect) {
        if (isMockTest) {
            // Mock tests handle their own scoring
            pointsEarned = 0;
        } else {
            // Chapterwise practice: +1 point for first correct answer only
            pointsEarned = 1;
        }
    }

    // Update leaderboard if points were earned
    if (pointsEarned > 0) {
        // Get current score
        const { data: currentScore } = await supabase
            .from('leaderboard')
            .select('score, total_attempts, correct_answers')
            .eq('user_id', user.id)
            .single();

        if (currentScore) {
            // Update existing entry
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
            // Create new leaderboard entry
            // Get username
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
        // Track attempt even if wrong (but no points)
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
            ? `+${pointsEarned} point added to leaderboard!`
            : isCorrect && !isFirstAttempt
                ? 'Already attempted - no additional points'
                : 'Wrong answer - no negative marking'
    });
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
