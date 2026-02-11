'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, GraduationCap, ChevronRight, Atom, FlaskConical, Calculator } from 'lucide-react';

export default function ChapterwisePage() {
    const classes = [
        {
            level: 11,
            label: 'Class 11',
            description: 'Foundation concepts in Physics, Chemistry & Mathematics',
            icon: BookOpen,
            gradient: 'from-blue-500 to-cyan-500',
            bgGlow: 'bg-blue-500/5',
            subjects: ['Physics', 'Chemistry', 'Mathematics'],
        },
        {
            level: 12,
            label: 'Class 12',
            description: 'Advanced topics for KEAM preparation',
            icon: GraduationCap,
            gradient: 'from-purple-500 to-pink-500',
            bgGlow: 'bg-purple-500/5',
            subjects: ['Physics', 'Chemistry', 'Mathematics'],
        },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/keam" className="hover:text-foreground transition-colors">KEAM</Link>
                <ChevronRight size={14} />
                <span className="text-foreground font-medium">Chapterwise Practice</span>
            </div>

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/keam"
                    className="p-2 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Chapterwise Practice</h1>
                    <p className="text-muted-foreground mt-1">Select your class to start practicing</p>
                </div>
            </div>

            {/* Class Selection Cards */}
            <div className="grid md:grid-cols-2 gap-6">
                {classes.map((cls) => (
                    <Link
                        key={cls.level}
                        href={`/keam/chapterwise/${cls.level}`}
                        className={`group relative rounded-2xl border border-border bg-card p-8 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden`}
                    >
                        {/* Background glow */}
                        <div className={`absolute inset-0 ${cls.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                        <div className="relative">
                            {/* Icon */}
                            <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${cls.gradient} text-white mb-5 shadow-lg`}>
                                <cls.icon size={28} />
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl font-bold text-foreground mb-2">{cls.label}</h2>
                            <p className="text-muted-foreground text-sm mb-6">{cls.description}</p>

                            {/* Subject pills */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {cls.subjects.map(subject => {
                                    const SubjectIcon = subject === 'Physics' ? Atom : subject === 'Chemistry' ? FlaskConical : Calculator;
                                    return (
                                        <span
                                            key={subject}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm text-foreground font-medium"
                                        >
                                            <SubjectIcon size={14} className="text-muted-foreground" />
                                            {subject}
                                        </span>
                                    );
                                })}
                            </div>

                            {/* CTA */}
                            <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                                Start Practicing
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
