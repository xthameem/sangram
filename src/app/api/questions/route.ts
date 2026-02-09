import { createClient } from '@/lib/server-supabase';
import { NextResponse } from 'next/server';
import { allQuestions } from '@/data/questions';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const subject = searchParams.get('subject');
    const chapter = searchParams.get('chapter');
    const difficulty = searchParams.get('difficulty');
    const exam = searchParams.get('exam') || 'KEAM';

    // 1. Start with Local Questions as Source of Truth
    // This ensures titles, chapters, text are always correct from your code
    let questions = allQuestions.filter(q => q.exam === exam);

    if (subject) {
        questions = questions.filter(q => q.subject === subject);
    }
    if (chapter) {
        questions = questions.filter(q => q.chapter === chapter);
    }
    if (difficulty) {
        questions = questions.filter(q => q.difficulty === difficulty);
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // 2. Fetch User Progress from DB
            // We need to map local questions to DB questions to find progress
            // Strategy: Map by 'slug' if available, otherwise fallback to 'question_text'

            // First, get ALL questions from DB to build a map
            const { data: dbQuestions } = await supabase
                .from('questions')
                .select('id, slug, question_text')
                .eq('exam', exam);

            // Create a lookup map: Local Question (Slug/Text) -> DB ID
            const dbIdMap = new Map<string, string>();
            if (dbQuestions) {
                dbQuestions.forEach(q => {
                    if (q.slug) dbIdMap.set(q.slug, q.id);
                    // Also map by text for robustness if slug is missing in DB
                    dbIdMap.set(q.question_text, q.id);
                });
            }

            // Fetch actual progress records
            const { data: userProgress } = await supabase
                .from('user_progress')
                .select('question_id, is_correct')
                .eq('user_id', user.id);

            // Create a progress map: DB ID -> Status
            const progressMap = new Map<string, boolean>();
            if (userProgress) {
                userProgress.forEach(p => {
                    progressMap.set(p.question_id, p.is_correct);
                });
            }

            // 3. Merge Progress into Local Questions
            const questionsWithProgress = questions.map(localQ => {
                // Find matching DB ID
                const dbId = dbIdMap.get(localQ.slug) || dbIdMap.get(localQ.question_text);

                // Determine user status
                let userStatus: 'solved' | 'attempted' | 'unattempted' = 'unattempted';
                if (dbId && progressMap.has(dbId)) {
                    userStatus = progressMap.get(dbId) ? 'solved' : 'attempted';
                }

                return {
                    ...localQ,
                    id: localQ.slug,   // Use Slug as ID for frontend routing/URLs
                    dbId: dbId,        // Keep DB ID if needed for debugging/future use
                    userStatus: userStatus
                };
            });

            return NextResponse.json({
                questions: questionsWithProgress,
                total: questionsWithProgress.length
            });
        }
    } catch (error) {
        console.error('Supabase error, using local data only:', error);
    }

    // 4. Fallback (No DB/Auth or Error)
    const questionsWithProgress = questions.map(q => ({
        ...q,
        id: q.slug, // Consistent ID
        userStatus: 'unattempted'
    }));

    return NextResponse.json({
        questions: questionsWithProgress,
        total: questionsWithProgress.length
    });
}
