import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';
import { allQuestions } from '@/data/questions';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const subject = searchParams.get('subject');
    const chapter = searchParams.get('chapter');
    const difficulty = searchParams.get('difficulty');
    const exam = searchParams.get('exam') || 'KEAM';

    // Try Supabase first
    try {
        const supabase = await createClient();

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

        if (!error && questions && questions.length > 0) {
            // Get user progress for these questions
            const { data: { user } } = await supabase.auth.getUser();
            let userProgress: Record<string, boolean> = {};

            if (user) {
                // Use slug for progress tracking (consistent with local data)
                const slugs = questions?.map(q => q.slug) || [];
                const { data: progress } = await supabase
                    .from('user_progress')
                    .select('question_id, is_correct')
                    .eq('user_id', user.id)
                    .in('question_id', slugs);

                progress?.forEach(p => {
                    userProgress[p.question_id] = p.is_correct;
                });
            }

            // Add user progress to each question - USE SLUG AS ID for consistency!
            const questionsWithProgress = questions?.map(q => ({
                ...q,
                id: q.slug, // Use slug as the ID for URL routing
                userStatus: userProgress[q.slug] !== undefined
                    ? (userProgress[q.slug] ? 'solved' : 'attempted')
                    : 'unattempted'
            }));

            return NextResponse.json({
                questions: questionsWithProgress,
                total: questionsWithProgress?.length || 0
            });
        }
    } catch (error) {
        console.log('Supabase fetch failed, using local data:', error);
    }

    // Fallback to local data
    let filteredQuestions = allQuestions.filter(q => q.exam === exam);

    if (subject) {
        filteredQuestions = filteredQuestions.filter(q => q.subject === subject);
    }
    if (chapter) {
        filteredQuestions = filteredQuestions.filter(q => q.chapter === chapter);
    }
    if (difficulty) {
        filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }

    const questionsWithProgress = filteredQuestions.map(q => ({
        id: q.slug,
        slug: q.slug,
        title: q.title,
        exam: q.exam,
        subject: q.subject,
        chapter: q.chapter,
        topic: q.topic,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        hints: q.hints,
        source: q.source,
        userStatus: 'unattempted'
    }));

    return NextResponse.json({
        questions: questionsWithProgress,
        total: questionsWithProgress.length
    });
}
