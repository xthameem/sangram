'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            storageKey="sangram-theme"
            themes={['light', 'dark']}
            disableTransitionOnChange
        >
            {children}
        </NextThemesProvider>
    );
}
