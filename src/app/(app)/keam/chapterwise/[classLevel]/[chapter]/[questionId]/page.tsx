'use client';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2, XCircle, Lightbulb,
    BookOpen, Loader2, AlertTriangle, ChevronDown, Circle, ListChecks
} from 'lucide-react';
import { allQuestionsWithClass, slugToChapter, chapterToSlug } from '@/data/questions';

interface QuestionData {
    slug: string;
    title: string;
    chapter: string;
    subject: string;
    class_level: number;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    hints: string[];
    userStatus?: 'solved' | 'attempted' | 'unattempted';
}

export default function QuestionPage({ params }: { params: Promise<{ classLevel: string; chapter: string; questionId: string }> }) {
    const resolvedParams = use(params);
    const classLevel = parseInt(resolvedParams.classLevel) as 11 | 12;
    const chapterSlug = resolvedParams.chapter;
    const questionSlug = resolvedParams.questionId;
    const chapterName = slugToChapter(chapterSlug) || chapterSlug;

    const router = useRouter();
    const sidebarRef = useRef<HTMLDivElement>(null);

    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [allChapterQuestions, setAllChapterQuestions] = useState<QuestionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Timer
    useEffect(() => {
        if (isSubmitted) return;
        const interval = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isSubmitted]);

    // Fetch all questions in this chapter
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch(`/api/questions?chapter=${encodeURIComponent(chapterName)}&classLevel=${classLevel}`);
                const data = await res.json();
                const questions = data.questions || [];
                setAllChapterQuestions(questions);

                const q = questions.find((q: QuestionData) => q.slug === questionSlug);
                if (q) {
                    setQuestion(q);
                    if (q.userStatus === 'solved' || q.userStatus === 'attempted') {
                        setIsSubmitted(true);
                        setIsCorrect(q.userStatus === 'solved');
                    }
                } else {
                    const localQ = allQuestionsWithClass.find(q => q.slug === questionSlug);
                    if (localQ) {
                        setQuestion({ ...localQ, class_level: localQ.class_level || classLevel, userStatus: 'unattempted' });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch questions:', error);
                const localQuestions = allQuestionsWithClass
                    .filter(q => q.chapter === chapterName && q.class_level === classLevel)
                    .map(q => ({ ...q, userStatus: 'unattempted' as const }));
                setAllChapterQuestions(localQuestions);
                const localQ = localQuestions.find(q => q.slug === questionSlug);
                if (localQ) setQuestion(localQ);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [chapterName, classLevel, questionSlug]);

    // Auto-scroll sidebar to current question
    useEffect(() => {
        if (sidebarRef.current) {
            const activeEl = sidebarRef.current.querySelector('[data-active="true"]');
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }
    }, [question, allChapterQuestions]);

    const optionLabels = ['A', 'B', 'C', 'D', 'E'];

    // Navigation
    const currentIndex = allChapterQuestions.findIndex(q => q.slug === questionSlug);
    const prevQuestion = currentIndex > 0 ? allChapterQuestions[currentIndex - 1] : null;
    const nextQuestion = currentIndex < allChapterQuestions.length - 1 ? allChapterQuestions[currentIndex + 1] : null;

    const handleOptionSelect = (label: string) => {
        if (isSubmitted) return;
        setSelectedOption(label);
    };

    const handleSubmitClick = () => {
        if (!selectedOption || isSubmitted) return;
        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = async () => {
        setShowConfirmModal(false);
        if (!question || !selectedOption) return;

        setSubmitting(true);
        const correct = selectedOption === question.correct_answer;
        setIsCorrect(correct);
        setIsSubmitted(true);

        // Update the local state for the sidebar
        setAllChapterQuestions(prev =>
            prev.map(q =>
                q.slug === questionSlug
                    ? { ...q, userStatus: correct ? 'solved' : 'attempted' }
                    : q
            )
        );

        try {
            await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: question.slug,
                    isCorrect: correct,
                    timeTaken: timeElapsed,
                }),
            });
        } catch (error) {
            console.error('Failed to save progress:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const navigateTo = (slug: string) => {
        router.push(`/keam/chapterwise/${classLevel}/${chapterSlug}/${slug}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!question) {
        return (
            <div className="max-w-3xl mx-auto text-center py-20">
                <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-500" />
                <h2 className="text-xl font-bold mb-2">Question not found</h2>
                <p className="text-muted-foreground mb-4">This question doesn&apos;t seem to exist.</p>
                <Link
                    href={`/keam/chapterwise/${classLevel}/${chapterSlug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90"
                >
                    <ArrowLeft size={18} /> Back to Chapter
                </Link>
            </div>
        );
    }

    const difficultyColors: Record<string, string> = {
        easy: 'text-green-500 bg-green-500/10 border-green-500/20',
        medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        hard: 'text-red-500 bg-red-500/10 border-red-500/20',
    };

    const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string; dotColor: string }> = {
        solved: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', dotColor: 'bg-green-500' },
        attempted: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', dotColor: 'bg-red-500' },
        unattempted: { icon: Circle, color: 'text-muted-foreground', bg: 'bg-secondary', dotColor: 'bg-muted-foreground/40' },
    };

    const solvedCount = allChapterQuestions.filter(q => q.userStatus === 'solved').length;
    const attemptedCount = allChapterQuestions.filter(q => q.userStatus === 'attempted').length;

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap mb-4">
                <Link href="/keam" className="hover:text-foreground transition-colors">KEAM</Link>
                <ChevronRight size={14} />
                <Link href="/keam/chapterwise" className="hover:text-foreground transition-colors">Chapterwise</Link>
                <ChevronRight size={14} />
                <Link href={`/keam/chapterwise/${classLevel}`} className="hover:text-foreground transition-colors">
                    Class {classLevel}
                </Link>
                <ChevronRight size={14} />
                <Link href={`/keam/chapterwise/${classLevel}/${chapterSlug}`} className="hover:text-foreground transition-colors">
                    {chapterName}
                </Link>
                <ChevronRight size={14} />
                <span className="text-foreground font-medium truncate max-w-[150px]">{question.title}</span>
            </div>

            <div className="flex gap-6">
                {/* ═══════════════════════════════════════════════ */}
                {/* LEFT: Main Question Area */}
                {/* ═══════════════════════════════════════════════ */}
                <div className="flex-1 min-w-0 space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/keam/chapterwise/${classLevel}/${chapterSlug}`}
                                className="p-2 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h2 className="font-bold text-foreground">{question.title}</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${difficultyColors[question.difficulty]}`}>
                                        {question.difficulty}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        Q{currentIndex + 1} of {allChapterQuestions.length}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        • {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Toggle sidebar on mobile */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
                        >
                            <ListChecks size={20} />
                        </button>
                    </div>

                    {/* Question Card */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <p className="text-foreground text-lg leading-relaxed font-medium">{question.question_text}</p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {question.options.map((option, index) => {
                            const label = optionLabels[index];
                            const isSelected = selectedOption === label;
                            const isCorrectOption = label === question.correct_answer;

                            let optionStyle = 'border-border bg-card hover:border-primary/30 hover:bg-primary/5';
                            if (isSubmitted) {
                                if (isCorrectOption) {
                                    optionStyle = 'border-green-500/50 bg-green-500/10';
                                } else if (isSelected && !isCorrect) {
                                    optionStyle = 'border-red-500/50 bg-red-500/10';
                                } else {
                                    optionStyle = 'border-border bg-card opacity-50';
                                }
                            } else if (isSelected) {
                                optionStyle = 'border-primary bg-primary/10 ring-2 ring-primary/20';
                            }

                            return (
                                <button
                                    key={label}
                                    onClick={() => handleOptionSelect(label)}
                                    disabled={isSubmitted}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${optionStyle}`}
                                >
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSubmitted && isCorrectOption
                                            ? 'bg-green-500 text-white'
                                            : isSubmitted && isSelected && !isCorrect
                                                ? 'bg-red-500 text-white'
                                                : isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-secondary text-muted-foreground'
                                        }`}>
                                        {isSubmitted && isCorrectOption ? (
                                            <CheckCircle2 size={18} />
                                        ) : isSubmitted && isSelected && !isCorrect ? (
                                            <XCircle size={18} />
                                        ) : (
                                            label
                                        )}
                                    </div>
                                    <span className="text-foreground text-sm flex-1">{option}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Submit Button */}
                    {!isSubmitted && (
                        <button
                            onClick={handleSubmitClick}
                            disabled={!selectedOption || submitting}
                            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${selectedOption
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                                    : 'bg-secondary text-muted-foreground cursor-not-allowed'
                                }`}
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin" size={20} /> Submitting...
                                </span>
                            ) : (
                                'Submit Answer'
                            )}
                        </button>
                    )}

                    {/* Result + Explanation */}
                    {isSubmitted && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className={`rounded-2xl p-5 ${isCorrect
                                    ? 'bg-green-500/10 border border-green-500/20'
                                    : 'bg-red-500/10 border border-red-500/20'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {isCorrect ? (
                                        <CheckCircle2 className="text-green-500" size={24} />
                                    ) : (
                                        <XCircle className="text-red-500" size={24} />
                                    )}
                                    <div>
                                        <p className={`font-bold text-lg ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                            {isCorrect ? 'Correct!' : 'Incorrect'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {isCorrect
                                                ? 'Great job! You got this one right.'
                                                : `The correct answer is ${question.correct_answer}.`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Explanation */}
                            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                                <button
                                    onClick={() => setShowExplanation(!showExplanation)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="text-primary" size={18} />
                                        <span className="font-medium">Explanation</span>
                                    </div>
                                    <ChevronDown
                                        size={18}
                                        className={`text-muted-foreground transition-transform ${showExplanation ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {showExplanation && (
                                    <div className="px-4 pb-4 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border">
                                        <p className="pt-3">{question.explanation}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Hint */}
                    {!isSubmitted && question.hints && question.hints.length > 0 && (
                        <div className="rounded-2xl border border-border bg-card overflow-hidden">
                            <button
                                onClick={() => setShowHint(!showHint)}
                                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="text-yellow-500" size={18} />
                                    <span className="font-medium text-sm">Need a hint?</span>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`text-muted-foreground transition-transform ${showHint ? 'rotate-180' : ''}`}
                                />
                            </button>
                            {showHint && (
                                <div className="px-4 pb-4 pt-0 text-sm text-muted-foreground border-t border-border">
                                    {question.hints.map((hint, i) => (
                                        <p key={i} className="pt-3">💡 {hint}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Next / Previous Navigation */}
                    <div className="flex items-center justify-between pt-2">
                        {prevQuestion ? (
                            <Link
                                href={`/keam/chapterwise/${classLevel}/${chapterSlug}/${prevQuestion.slug}`}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-sm font-medium"
                            >
                                <ChevronLeft size={18} />
                                Previous
                            </Link>
                        ) : (
                            <div />
                        )}

                        <Link
                            href={`/keam/chapterwise/${classLevel}/${chapterSlug}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            All Questions
                        </Link>

                        {nextQuestion ? (
                            <Link
                                href={`/keam/chapterwise/${classLevel}/${chapterSlug}/${nextQuestion.slug}`}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors text-sm font-medium"
                            >
                                Next
                                <ChevronRight size={18} />
                            </Link>
                        ) : (
                            <div />
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════ */}
                {/* RIGHT: Question Navigator Sidebar */}
                {/* ═══════════════════════════════════════════════ */}
                <div className={`${sidebarOpen ? 'block' : 'hidden'
                    } lg:block w-72 flex-shrink-0`}>
                    <div className="sticky top-20 rounded-2xl border border-border bg-card overflow-hidden">
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                                <ListChecks size={16} className="text-primary" />
                                Questions
                            </h3>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    {solvedCount} solved
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    {attemptedCount} tried
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                                    {allChapterQuestions.length - solvedCount - attemptedCount} fresh
                                </span>
                            </div>
                        </div>

                        {/* Scrollable Question List */}
                        <div ref={sidebarRef} className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                            {allChapterQuestions.map((q, idx) => {
                                const isActive = q.slug === questionSlug;
                                const status = statusConfig[q.userStatus || 'unattempted'];
                                const diffColor = difficultyColors[q.difficulty];

                                return (
                                    <Link
                                        key={q.slug}
                                        href={`/keam/chapterwise/${classLevel}/${chapterSlug}/${q.slug}`}
                                        data-active={isActive}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${isActive
                                                ? 'bg-primary/10 border border-primary/30 shadow-sm'
                                                : 'hover:bg-secondary/70 border border-transparent'
                                            }`}
                                    >
                                        {/* Status dot */}
                                        <div className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${status.dotColor}`} />

                                        {/* Question number + title */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`truncate text-xs font-medium ${isActive ? 'text-primary' : 'text-foreground'
                                                }`}>
                                                <span className="text-muted-foreground font-mono mr-1">Q{idx + 1}</span>
                                                {q.title}
                                            </p>
                                        </div>

                                        {/* Difficulty badge */}
                                        <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${diffColor}`}>
                                            {q.difficulty.charAt(0).toUpperCase()}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Progress bar */}
                        <div className="p-3 border-t border-border">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                                <span>Progress</span>
                                <span>{allChapterQuestions.length > 0 ? Math.round((solvedCount / allChapterQuestions.length) * 100) : 0}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${allChapterQuestions.length > 0 ? (solvedCount / allChapterQuestions.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-2xl p-6 max-w-sm mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-primary/10">
                                <AlertTriangle className="text-primary" size={22} />
                            </div>
                            <h3 className="font-bold text-lg text-foreground">Confirm Submission</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-6">
                            Are you sure you want to submit this answer? You selected option <strong className="text-foreground">{selectedOption}</strong>. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-2.5 rounded-xl border border-border bg-secondary text-foreground font-medium hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSubmit}
                                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
