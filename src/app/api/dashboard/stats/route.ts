import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';
import { allQuestionsWithClass, getClassLevel, chapterToSlug } from '@/data/questions';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all user progress
        const { data: progress, error: progressError } = await supabase
            .from('user_progress')
            .select('question_id, is_correct, created_at')
            .eq('user_id', user.id);

        if (progressError) {
            console.error('Progress fetch error:', progressError);
        }

        const userProgress = progress || [];

        // Fetch question details from DB to map question_id to chapter/subject
        const { data: dbQuestions } = await supabase
            .from('questions')
            .select('id, slug, subject, chapter');

        // Build mapping from question_id to question details
        const questionMap = new Map<string, { subject: string; chapter: string; class_level: 11 | 12 }>();
        if (dbQuestions) {
            for (const dbQ of dbQuestions) {
                // Find matching local question for class_level
                const localQ = allQuestionsWithClass.find(q => q.slug === dbQ.slug);
                questionMap.set(dbQ.id, {
                    subject: dbQ.subject || localQ?.subject || 'Unknown',
                    chapter: dbQ.chapter || localQ?.chapter || 'Unknown',
                    class_level: localQ?.class_level || getClassLevel(dbQ.chapter || ''),
                });
            }
        }

        // Calculate stats
        const totalAttempts = userProgress.length;
        const correctAnswers = userProgress.filter(p => p.is_correct).length;
        const accuracy = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 1000) / 10 : 0;

        // Chapter-wise progress
        const chapterProgress: Record<string, { total: number; solved: number; attempted: number; subject: string; class_level: 11 | 12 }> = {};

        for (const p of userProgress) {
            const qInfo = questionMap.get(p.question_id);
            if (!qInfo) continue;

            const chapter = qInfo.chapter;
            if (!chapterProgress[chapter]) {
                // Count total questions for this chapter from local data
                const totalInChapter = allQuestionsWithClass.filter(q => q.chapter === chapter).length;
                chapterProgress[chapter] = {
                    total: totalInChapter,
                    solved: 0,
                    attempted: 0,
                    subject: qInfo.subject,
                    class_level: qInfo.class_level,
                };
            }

            chapterProgress[chapter].attempted++;
            if (p.is_correct) {
                chapterProgress[chapter].solved++;
            }
        }

        // Subject-wise progress
        const subjectProgress: Record<string, { total: number; solved: number; attempted: number }> = {};
        for (const [, info] of Object.entries(chapterProgress)) {
            if (!subjectProgress[info.subject]) {
                const totalInSubject = allQuestionsWithClass.filter(q => q.subject === info.subject).length;
                subjectProgress[info.subject] = { total: totalInSubject, solved: 0, attempted: 0 };
            }
            subjectProgress[info.subject].solved += info.solved;
            subjectProgress[info.subject].attempted += info.attempted;
        }

        // Calculate score (same formula as leaderboard view)
        const score = correctAnswers * 10 + (totalAttempts >= 10 ? Math.round((correctAnswers / totalAttempts) * 50) : 0);

        // Get rank from leaderboard
        const { data: leaderboard } = await supabase
            .from('leaderboard')
            .select('user_id, score')
            .order('score', { ascending: false });

        let rank = 0;
        if (leaderboard) {
            const idx = leaderboard.findIndex(l => l.user_id === user.id);
            rank = idx >= 0 ? idx + 1 : 0;
        }

        return NextResponse.json({
            totalAttempts,
            correctAnswers,
            accuracy,
            score,
            rank,
            mockTests: 0,
            chapters: Object.keys(chapterProgress).length,
            chapterProgress: Object.entries(chapterProgress).map(([chapter, data]) => ({
                chapter,
                slug: chapterToSlug(chapter),
                ...data,
            })),
            subjectProgress: Object.entries(subjectProgress).map(([subject, data]) => ({
                subject,
                ...data,
                percentage: data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0,
            })),
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
