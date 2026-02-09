'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronLeft, ChevronRight, Lightbulb, Flag,
    CheckCircle2, XCircle, Eye, EyeOff, Timer, ArrowLeft, X,
    AlertTriangle, MessageSquare, ThumbsUp, ThumbsDown
} from 'lucide-react';

interface Question {
    id: string;
    title: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    difficulty: string;
    hints: string[];
    chapter: string;
    subject: string;
}

export default function QuestionPage() {
    const params = useParams();
    const router = useRouter();
    const questionId = params.questionId as string;

    const [question, setQuestion] = useState<Question | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [currentHintIndex, setCurrentHintIndex] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [allQuestions, setAllQuestions] = useState<{ id: string }[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Modal states
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportSubmitted, setReportSubmitted] = useState(false);
    const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                const allRes = await fetch('/api/questions?subject=Physics&exam=KEAM');
                if (allRes.ok) {
                    const allData = await allRes.json();
                    setAllQuestions(allData.questions || []);

                    const current = allData.questions?.find((q: Question) => q.id === questionId);
                    if (current) {
                        const parsedQuestion = {
                            ...current,
                            options: typeof current.options === 'string' ? JSON.parse(current.options) : current.options,
                            hints: typeof current.hints === 'string' ? JSON.parse(current.hints) : (current.hints || []),
                        };
                        setQuestion(parsedQuestion);
                    }
                }
            } catch (error) {
                console.error('Error fetching question:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestion();
    }, [questionId]);

    // Timer
    useEffect(() => {
        if (!isSubmitted) {
            timerRef.current = setInterval(() => {
                setTimeElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isSubmitted]);

    // Exit confirmation
    const handleBack = () => {
        if (!isSubmitted && selectedAnswer) {
            setShowExitConfirm(true);
        } else {
            router.push('/keam/chapterwise/physics');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        if (!selectedAnswer || !question) return;

        setIsSubmitted(true);
        if (timerRef.current) clearInterval(timerRef.current);

        const isCorrect = selectedAnswer === question.correct_answer;

        try {
            await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId: question.id,
                    isCorrect,
                    timeTaken: timeElapsed,
                }),
            });
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    };

    const handleReport = () => {
        setReportSubmitted(true);
        setTimeout(() => {
            setShowReportModal(false);
            setReportReason('');
            setReportSubmitted(false);
        }, 1500);
    };

    const currentIndex = allQuestions.findIndex(q => q.id === questionId);
    const prevQuestion = currentIndex > 0 ? allQuestions[currentIndex - 1] : null;
    const nextQuestion = currentIndex < allQuestions.length - 1 ? allQuestions[currentIndex + 1] : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!question) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Question not found</p>
                <Link href="/keam/chapterwise/physics" className="text-primary hover:underline mt-2 inline-block">
                    Back to Questions
                </Link>
            </div>
        );
    }

    const isCorrect = selectedAnswer === question.correct_answer;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span>Back to Questions</span>
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Report an issue"
                    >
                        <Flag size={14} />
                        <span className="hidden sm:inline">Report</span>
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm">
                        <Timer size={16} className="text-primary" />
                        <span className="font-mono font-medium">{formatTime(timeElapsed)}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${question.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' :
                        question.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' :
                            'bg-yellow-500/10 text-yellow-500'
                        }`}>
                        {question.difficulty}
                    </span>
                </div>
            </div>

            {/* Question Card */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-xs text-muted-foreground mb-2">
                    {question.chapter} • Question {currentIndex + 1} of {allQuestions.length}
                </div>
                <h2 className="text-lg font-medium leading-relaxed">{question.question_text}</h2>
            </div>

            {/* Options */}
            <div className="space-y-3">
                {question.options.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    const isSelected = selectedAnswer === optionLetter;
                    const isCorrectOption = optionLetter === question.correct_answer;

                    let optionStyle = 'border-border hover:border-primary/50 hover:bg-primary/5';
                    if (isSubmitted) {
                        if (isCorrectOption) {
                            optionStyle = 'border-green-500 bg-green-500/10';
                        } else if (isSelected && !isCorrectOption) {
                            optionStyle = 'border-red-500 bg-red-500/10';
                        }
                    } else if (isSelected) {
                        optionStyle = 'border-primary bg-primary/10';
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => !isSubmitted && setSelectedAnswer(optionLetter)}
                            disabled={isSubmitted}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${optionStyle} ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${isSubmitted && isCorrectOption ? 'bg-green-500 text-white' :
                                    isSubmitted && isSelected && !isCorrectOption ? 'bg-red-500 text-white' :
                                        isSelected ? 'bg-primary text-primary-foreground' :
                                            'bg-secondary text-muted-foreground'
                                    }`}>
                                    {isSubmitted && isCorrectOption ? <CheckCircle2 size={16} /> :
                                        isSubmitted && isSelected && !isCorrectOption ? <XCircle size={16} /> :
                                            optionLetter}
                                </div>
                                <span className="flex-1">{option}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                {!isSubmitted ? (
                    <>
                        <button
                            onClick={() => setShowHints(!showHints)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-secondary/50 hover:bg-secondary transition-colors text-sm"
                        >
                            <Lightbulb size={16} />
                            {showHints ? 'Hide Hints' : 'Show Hint'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedAnswer}
                            className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Submit Answer
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setShowExplanation(!showExplanation)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-secondary/50 hover:bg-secondary transition-colors text-sm"
                        >
                            {showExplanation ? <EyeOff size={16} /> : <Eye size={16} />}
                            {showExplanation ? 'Hide' : 'Show'} Explanation
                        </button>
                        {nextQuestion && (
                            <Link
                                href={`/keam/chapterwise/physics/${nextQuestion.id}`}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                            >
                                Next Question <ChevronRight size={18} />
                            </Link>
                        )}
                    </>
                )}
            </div>

            {/* Hints Section */}
            {showHints && question.hints && question.hints.length > 0 && (
                <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium flex items-center gap-2">
                            <Lightbulb size={18} className="text-yellow-500" />
                            Hint {currentHintIndex + 1} of {question.hints.length}
                        </h3>
                        {question.hints.length > 1 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentHintIndex(Math.max(0, currentHintIndex - 1))}
                                    disabled={currentHintIndex === 0}
                                    className="p-1 rounded hover:bg-secondary disabled:opacity-30"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => setCurrentHintIndex(Math.min(question.hints.length - 1, currentHintIndex + 1))}
                                    disabled={currentHintIndex === question.hints.length - 1}
                                    className="p-1 rounded hover:bg-secondary disabled:opacity-30"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">{question.hints[currentHintIndex]}</p>
                </div>
            )}

            {/* Result & Explanation */}
            {isSubmitted && (
                <div className={`rounded-2xl border p-5 ${isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
                    }`}>
                    <div className="flex items-center gap-3 mb-3">
                        {isCorrect ? (
                            <CheckCircle2 className="text-green-500" size={24} />
                        ) : (
                            <XCircle className="text-red-500" size={24} />
                        )}
                        <h3 className={`font-semibold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                            {isCorrect ? 'Correct! +1 point' : 'Incorrect'}
                        </h3>
                    </div>

                    {!isCorrect && (
                        <p className="text-sm mb-3">
                            The correct answer is: <span className="font-medium text-green-500">{question.correct_answer}</span>
                        </p>
                    )}

                    {showExplanation && question.explanation && (
                        <div className="mt-4 pt-4 border-t border-border">
                            <h4 className="font-medium mb-2">Explanation</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{question.explanation}</p>
                        </div>
                    )}

                    {/* Feedback */}
                    <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground mb-2">Was this question helpful?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFeedback('good')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${feedback === 'good' ? 'bg-green-500/20 text-green-500' : 'hover:bg-secondary'
                                    }`}
                            >
                                <ThumbsUp size={14} /> Good
                            </button>
                            <button
                                onClick={() => setFeedback('bad')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${feedback === 'bad' ? 'bg-red-500/20 text-red-500' : 'hover:bg-secondary'
                                    }`}
                            >
                                <ThumbsDown size={14} /> Needs Improvement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-border">
                {prevQuestion ? (
                    <Link
                        href={`/keam/chapterwise/physics/${prevQuestion.id}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft size={18} />
                        Previous
                    </Link>
                ) : <div />}

                {nextQuestion && (
                    <Link
                        href={`/keam/chapterwise/physics/${nextQuestion.id}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Next
                        <ChevronRight size={18} />
                    </Link>
                )}
            </div>

            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowExitConfirm(false)}>
                    <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-full bg-yellow-500/10">
                                <AlertTriangle className="text-yellow-500" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold">Leave Question?</h3>
                        </div>
                        <p className="text-muted-foreground mb-6">
                            You have an unsaved answer. Are you sure you want to leave without submitting?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowExitConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors"
                            >
                                Stay
                            </button>
                            <button
                                onClick={() => router.push('/keam/chapterwise/physics')}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                                Leave Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
                    <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Flag className="text-red-500" size={20} />
                                Report Issue
                            </h3>
                            <button onClick={() => setShowReportModal(false)} className="p-1 rounded hover:bg-secondary">
                                <X size={20} />
                            </button>
                        </div>

                        {reportSubmitted ? (
                            <div className="text-center py-6">
                                <CheckCircle2 className="mx-auto text-green-500 mb-3" size={48} />
                                <p className="font-medium">Report Submitted!</p>
                                <p className="text-sm text-muted-foreground">Thank you for helping us improve.</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Help us improve by reporting any issues with this question.
                                </p>
                                <div className="space-y-2 mb-4">
                                    {['Wrong answer marked as correct', 'Typo in question/options', 'Unclear question', 'Wrong explanation', 'Other'].map((reason) => (
                                        <button
                                            key={reason}
                                            onClick={() => setReportReason(reason)}
                                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${reportReason === reason ? 'bg-primary/10 text-primary border border-primary/30' : 'hover:bg-secondary border border-border'
                                                }`}
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleReport}
                                    disabled={!reportReason}
                                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    Submit Report
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
