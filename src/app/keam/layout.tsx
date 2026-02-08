import Header from '@/components/layout/Header';

export default function KEAMLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <main className="min-h-[calc(100vh-4rem)] bg-background">
                <div className="container mx-auto px-4 py-8 lg:px-8">
                    {children}
                </div>
            </main>
        </>
    );
}
