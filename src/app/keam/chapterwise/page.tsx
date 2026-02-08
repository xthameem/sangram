'use client';

import Link from 'next/link';
import { Atom, FlaskConical, Calculator, ChevronRight, Lock } from 'lucide-react';

const subjects = [
    {
        id: 'physics',
        name: 'Physics',
        icon: Atom,
        color: 'from-blue-500 to-cyan-500',
        available: true,
        chapters: ['Laws of Motion', 'Work, Energy & Power', 'Rotational Motion', 'Gravitation', 'Oscillations', 'Waves']
    },
    {
        id: 'chemistry',
        name: 'Chemistry',
        icon: FlaskConical,
        color: 'from-green-500 to-emerald-500',
        available: false,
        chapters: []
    },
    {
        id: 'maths',
        name: 'Mathematics',
        icon: Calculator,
        color: 'from-purple-500 to-pink-500',
        available: false,
        chapters: []
    },
];

export default function ChapterwisePage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Chapterwise Practice</h1>
                <p className="text-muted-foreground mt-1">
                    Select a subject to start practicing chapter by chapter
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {subjects.map((subject) => (
                    <div
                        key={subject.id}
                        className={`rounded-2xl border p-6 transition-all ${subject.available
                                ? 'border-border bg-card hover:shadow-lg'
                                : 'border-border bg-card/50 opacity-60'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${subject.color} text-white`}>
                                <subject.icon size={28} />
                            </div>
                            {!subject.available && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                                    <Lock size={12} /> Coming Soon
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl font-semibold mb-2">{subject.name}</h3>

                        {subject.available ? (
                            <>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {subject.chapters.length} chapters available
                                </p>
                                <Link
                                    href={`/keam/chapterwise/${subject.id}`}
                                    className="flex items-center justify-center w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Start Practice <ChevronRight size={18} className="ml-1" />
                                </Link>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Questions will be added soon
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
