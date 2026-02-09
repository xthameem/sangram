'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, CheckCircle2, XCircle, Circle } from 'lucide-react';

interface Question {
    id: string;
    chapter: string;
    title: string;
    question_text: string;
    difficulty: string;
    userStatus: 'solved' | 'attempted' | 'unattempted';
}

export default function MathsChaptersPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch('/api/questions?subject=Mathematics&exam=KEAM');
                if (res.ok) {
                    const data = await res.json();
                    setQuestions(data.questions || []);
                }
            } catch (error) {
                console.error('Error fetching questions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    const availableChapters = [...new Set(questions.map(q => q.chapter))];
    const filteredQuestions = selectedChapter ? questions.filter(q => q.chapter === selectedChapter) : questions;

    const getChapterStats = (chapter: string) => {
        const chapterQuestions = questions.filter(q => q.chapter === chapter);
        const solved = chapterQuestions.filter(q => q.userStatus === 'solved').length;
        return { total: chapterQuestions.length, solved };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Mathematics</h1>
                <p className="text-muted-foreground mt-1">
                    {questions.length > 0 ? `${questions.length} questions available` : 'No questions available yet'}
                </p>
            </div>

            {questions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                    <Circle size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No questions yet</p>
                </div>
            ) : (
                <div className="grid lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-border bg-card p-4 sticky top-20">
                            <h3 className="font-semibold mb-3">Chapters</h3>
                            <div className="space-y-1">
                                <button onClick={() => setSelectedChapter(null)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedChapter ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'}`}>
                                    All Questions ({questions.length})
                                </button>
                                {availableChapters.map((chapter) => {
                                    const { total, solved } = getChapterStats(chapter);
                                    return (
                                        <button key={chapter} onClick={() => setSelectedChapter(chapter)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between ${selectedChapter === chapter ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'}`}>
                                            <span className="truncate">{chapter}</span>
                                            <span className="text-xs text-muted-foreground">{solved}/{total}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-3">
                        {filteredQuestions.map((question, idx) => (
                            <Link key={question.id} href={`/keam/chapterwise/maths/${question.id}`}
                                className="block rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{question.title || question.question_text.substring(0, 50)}...</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground">{question.chapter}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs ${question.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' : question.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                {question.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-muted-foreground" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
