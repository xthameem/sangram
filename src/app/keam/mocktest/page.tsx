'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
    Clock, ChevronLeft, ChevronRight, AlertCircle,
    CheckCircle2, XCircle, Flag, Eye, EyeOff
} from 'lucide-react';

interface Question {
    id: string;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    difficulty: string;
    chapter: string;
    subject: string;
}

interface Answer {
    questionId: string;
    selectedAnswer: string | null;
    isMarkedForReview: boolean;
}

export default function MockTestPage() {
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [timeRemaining, setTimeRemaining] = useState(150 * 60); // 2.5 hours in seconds
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [testStarted, setTestStarted] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch questions for mock test
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await fetch('/api/mocktest');
                if (res.ok) {
                    const data = await res.json();
                    if (data.questions && data.questions.length > 0) {
                        const parsedQuestions = data.questions.map((q: Question) => ({
                            ...q,
                            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                        }));
                        setQuestions(parsedQuestions);
                        setAnswers(parsedQuestions.map((q: Question) => ({
                            questionId: q.id,
                            selectedAnswer: null,
                            isMarkedForReview: false
                        })));
                    }
                }
            } catch (error) {
                console.error('Error fetching mock test:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, []);

    // Timer
    useEffect(() => {
        if (testStarted && !isSubmitted && timeRemaining > 0) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [testStarted, isSubmitted]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (answer: string) => {
        if (isSubmitted) return;
        const newAnswers = [...answers];
        newAnswers[currentIndex].selectedAnswer = answer;
        setAnswers(newAnswers);
    };

    const handleMarkForReview = () => {
        const newAnswers = [...answers];
        newAnswers[currentIndex].isMarkedForReview = !newAnswers[currentIndex].isMarkedForReview;
        setAnswers(newAnswers);
    };

    const handleSubmit = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsSubmitted(true);
        setShowResults(true);
    }, []);

    const calculateScore = () => {
        let correct = 0;
        let wrong = 0;
        let unattempted = 0;

        questions.forEach((q, idx) => {
            const ans = answers[idx];
            if (!ans.selectedAnswer) {
                unattempted++;
            } else if (q.options[ans.selectedAnswer.charCodeAt(0) - 65] === q.options[q.correct_answer.charCodeAt(0) - 65]) {
                correct++;
            } else {
                wrong++;
            }
        });

        // KEAM marking: +4 for correct, -1 for wrong
        const score = correct * 4 - wrong * 1;

        return { correct, wrong, unattempted, score, total: questions.length * 4 };
    };

    const getQuestionStatus = (idx: number) => {
        const ans = answers[idx];
        if (ans?.isMarkedForReview && ans?.selectedAnswer) return 'review-answered';
        if (ans?.isMarkedForReview) return 'review';
        if (ans?.selectedAnswer) return 'answered';
        return 'not-visited';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="text-center py-12">
                <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Mock Test Available</h2>
                <p className="text-muted-foreground mb-4">Questions are being prepared. Please check back later.</p>
                <Link href="/keam" className="text-primary hover:underline">
                    Back to KEAM Dashboard
                </Link>
            </div>
        );
    }

    if (!testStarted) {
        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                    <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        KEAM Mock Test
                    </h1>
                    <p className="text-muted-foreground mb-6">
                        Simulate the real KEAM examination experience
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="rounded-xl bg-secondary/50 p-4">
                            <p className="text-2xl font-bold text-primary">{questions.length}</p>
                            <p className="text-sm text-muted-foreground">Questions</p>
                        </div>
                        <div className="rounded-xl bg-secondary/50 p-4">
                            <p className="text-2xl font-bold text-primary">2:30:00</p>
                            <p className="text-sm text-muted-foreground">Duration</p>
                        </div>
                    </div>

                    <div className="text-left bg-secondary/30 rounded-xl p-4 mb-6">
                        <h3 className="font-semibold mb-2">Instructions:</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Each correct answer carries <span className="text-green-500 font-medium">+4 marks</span></li>
                            <li>• Each wrong answer carries <span className="text-red-500 font-medium">-1 mark</span> (negative marking)</li>
                            <li>• Unanswered questions carry <span className="text-yellow-500 font-medium">0 marks</span></li>
                            <li>• You can mark questions for review and revisit them</li>
                            <li>• Test auto-submits when time expires</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => setTestStarted(true)}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-semibold text-lg hover:opacity-90 transition-opacity"
                    >
                        Start Mock Test
                    </button>
                </div>
            </div>
        );
    }

    if (showResults) {
        const { correct, wrong, unattempted, score, total } = calculateScore();
        const percentage = Math.round((score / total) * 100);

        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="rounded-2xl border border-border bg-card p-8">
                    <h1 className="text-3xl font-bold text-center mb-6">Test Results</h1>

                    <div className="flex justify-center mb-8">
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="80" cy="80" r="70"
                                    fill="none" stroke="currentColor"
                                    className="text-secondary" strokeWidth="12"
                                />
                                <circle
                                    cx="80" cy="80" r="70"
                                    fill="none" stroke="currentColor"
                                    className="text-primary" strokeWidth="12"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * Math.max(0, percentage)) / 100}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold">{score}</span>
                                <span className="text-sm text-muted-foreground">/ {total}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center">
                            <CheckCircle2 className="mx-auto text-green-500 mb-2" size={24} />
                            <p className="text-2xl font-bold text-green-500">{correct}</p>
                            <p className="text-sm text-muted-foreground">Correct (+{correct * 4})</p>
                        </div>
                        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-center">
                            <XCircle className="mx-auto text-red-500 mb-2" size={24} />
                            <p className="text-2xl font-bold text-red-500">{wrong}</p>
                            <p className="text-sm text-muted-foreground">Wrong (-{wrong})</p>
                        </div>
                        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 text-center">
                            <AlertCircle className="mx-auto text-yellow-500 mb-2" size={24} />
                            <p className="text-2xl font-bold text-yellow-500">{unattempted}</p>
                            <p className="text-sm text-muted-foreground">Unattempted</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowResults(false)}
                            className="flex-1 py-3 rounded-xl border border-border hover:bg-secondary transition-colors"
                        >
                            Review Answers
                        </button>
                        <Link
                            href="/keam"
                            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-center font-medium hover:bg-primary/90 transition-colors"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers[currentIndex];

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
            {/* Header with Timer */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-3 mb-4 border-b border-border">
                <div className="flex items-center justify-between">
                    <h1 className="font-semibold">KEAM Mock Test</h1>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining < 300 ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                        }`}>
                        <Clock size={18} />
                        <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Question Panel */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-muted-foreground">
                                Question {currentIndex + 1} of {questions.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${currentQuestion.difficulty === 'easy' ? 'bg-green-500/10 text-green-500' :
                                    currentQuestion.difficulty === 'hard' ? 'bg-red-500/10 text-red-500' :
                                        'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                    {currentQuestion.difficulty}
                                </span>
                                <span className="text-xs text-muted-foreground">{currentQuestion.chapter}</span>
                            </div>
                        </div>

                        <h2 className="text-lg font-medium leading-relaxed mb-6">{currentQuestion.question_text}</h2>

                        <div className="space-y-3">
                            {currentQuestion.options.map((option, idx) => {
                                const optionLetter = String.fromCharCode(65 + idx);
                                const isSelected = currentAnswer?.selectedAnswer === optionLetter;
                                const isCorrect = isSubmitted && currentQuestion.correct_answer === optionLetter;
                                const isWrong = isSubmitted && isSelected && currentQuestion.correct_answer !== optionLetter;

                                let optionClass = 'border-border hover:border-primary/50';
                                if (isSubmitted) {
                                    if (isCorrect) optionClass = 'border-green-500 bg-green-500/10';
                                    else if (isWrong) optionClass = 'border-red-500 bg-red-500/10';
                                } else if (isSelected) {
                                    optionClass = 'border-primary bg-primary/10';
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswerSelect(optionLetter)}
                                        disabled={isSubmitted}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${optionClass}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${isSubmitted && isCorrect ? 'bg-green-500 text-white' :
                                                isSubmitted && isWrong ? 'bg-red-500 text-white' :
                                                    isSelected ? 'bg-primary text-primary-foreground' :
                                                        'bg-secondary text-muted-foreground'
                                                }`}>
                                                {optionLetter}
                                            </div>
                                            <span className="flex-1">{option}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {isSubmitted && currentQuestion.explanation && (
                            <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border">
                                <h4 className="font-medium mb-2">Explanation</h4>
                                <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleMarkForReview}
                            disabled={isSubmitted}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${currentAnswer?.isMarkedForReview
                                ? 'bg-purple-500/10 border-purple-500 text-purple-500'
                                : 'border-border hover:bg-secondary'
                                }`}
                        >
                            <Flag size={16} />
                            {currentAnswer?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
                        </button>

                        <div className="flex-1"></div>

                        <button
                            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                            disabled={currentIndex === 0}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border hover:bg-secondary disabled:opacity-50 transition-colors"
                        >
                            <ChevronLeft size={18} /> Previous
                        </button>

                        {currentIndex < questions.length - 1 ? (
                            <button
                                onClick={() => setCurrentIndex(currentIndex + 1)}
                                className="flex items-center gap-1 px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                Next <ChevronRight size={18} />
                            </button>
                        ) : !isSubmitted ? (
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
                            >
                                Submit Test
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowResults(true)}
                                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                View Results
                            </button>
                        )}
                    </div>
                </div>

                {/* Question Navigator */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl border border-border bg-card p-4 sticky top-20">
                        <h3 className="font-semibold mb-3">Question Navigator</h3>

                        <div className="grid grid-cols-5 gap-2 mb-4">
                            {questions.map((_, idx) => {
                                const status = getQuestionStatus(idx);
                                let btnClass = 'bg-secondary text-muted-foreground';

                                if (idx === currentIndex) {
                                    btnClass = 'ring-2 ring-primary bg-primary/20 text-primary';
                                } else if (status === 'answered') {
                                    btnClass = 'bg-green-500 text-white';
                                } else if (status === 'review') {
                                    btnClass = 'bg-purple-500 text-white';
                                } else if (status === 'review-answered') {
                                    btnClass = 'bg-purple-500 text-white ring-2 ring-green-500';
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentIndex(idx)}
                                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${btnClass}`}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-secondary"></div>
                                <span>Not Attempted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-green-500"></div>
                                <span>Answered</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-purple-500"></div>
                                <span>Marked for Review</span>
                            </div>
                        </div>

                        {!isSubmitted && (
                            <button
                                onClick={handleSubmit}
                                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition-opacity"
                            >
                                Submit Test
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
