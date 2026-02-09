'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, CheckCircle2, XCircle, Circle, ArrowLeft } from 'lucide-react';

interface Question {
    id: string;
    title: string;
    chapter: string;
    question_text: string;
    difficulty: string;
    userStatus: 'solved' | 'attempted' | 'unattempted';
}

export default function ChemistryChaptersPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch('/api/questions?subject=Chemistry&exam=KEAM');
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

    // Get unique chapters from questions dynamically
    const availableChapters = [...new Set(questions.map(q => q.chapter))];

    const filteredQuestions = selectedChapter
        ? questions.filter(q => q.chapter === selectedChapter)
        : questions;

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
            {/* Back Button */}
            <Link
                href="/keam/chapterwise"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={18} />
                <span>Back to Subjects</span>
            </Link>

            <div>
                <h1 className="text-3xl font-bold text-foreground">Chemistry</h1>
                <p className="text-muted-foreground mt-1">
                    {questions.length > 0
                        ? `${questions.length} questions • ${availableChapters.length} chapters`
                        : 'No questions available yet. Check back soon!'
                    }
                </p>
            </div>

            {questions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                    <div className="text-muted-foreground">
                        <Circle size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No questions yet</p>
                        <p className="text-sm mt-1">Questions for Chemistry will be added soon.</p>
                    </div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Chapters Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-border bg-card p-4 sticky top-20">
                            <h3 className="font-semibold mb-3">Chapters</h3>
                            <div className="space-y-1">
                                <button
                                    onClick={() => setSelectedChapter(null)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedChapter ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                                        }`}
                                >
                                    All Questions ({questions.length})
                                </button>
                                {availableChapters.map((chapter) => {
                                    const stats = getChapterStats(chapter);
                                    return (
                                        <button
                                            key={chapter}
                                            onClick={() => setSelectedChapter(chapter)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedChapter === chapter ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="truncate flex-1" title={chapter}>{chapter}</span>
                                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                                    {stats.solved}/{stats.total}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Questions List */}
                    <div className="lg:col-span-3 space-y-3">
                        {filteredQuestions.map((question, index) => (
                            <Link
                                key={question.id}
                                href={`/keam/chapterwise/chemistry/${question.id}`}
                                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
                            >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${question.userStatus === 'solved'
                                    ? 'bg-green-500/10 text-green-500'
                                    : question.userStatus === 'attempted'
                                        ? 'bg-red-500/10 text-red-500'
                                        : 'bg-secondary text-muted-foreground'
                                    }`}>
                                    {question.userStatus === 'solved' ? (
                                        <CheckCircle2 size={18} />
                                    ) : question.userStatus === 'attempted' ? (
                                        <XCircle size={18} />
                                    ) : (
                                        <span className="text-sm font-medium">{index + 1}</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground">
                                        {question.title || question.question_text.substring(0, 50) + '...'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-muted-foreground">{question.chapter}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${question.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' :
                                            question.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' :
                                                'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {question.difficulty}
                                        </span>
                                    </div>
                                </div>

                                <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
