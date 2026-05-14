import { useEffect, useState } from "react";

type Theme = 'light' | 'dark' | 'system';
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

function resolveTheme(theme: Theme): 'light' | 'dark' {
    if (theme !== 'system') return theme;
    return mediaQuery.matches ? 'dark' : 'light'
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem('theme') as Theme) || 'system'
    )

    useEffect(() => {
        const resolvedTheme = resolveTheme(theme)
        document.documentElement.dataset.theme = resolvedTheme;
        localStorage.setItem('theme', theme)
    }, [theme])

    useEffect(() => {
        if (theme !== 'system') return
        const handler = () => {
            document.documentElement.dataset.theme = resolveTheme('system')
        }
        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }, [theme])

    return {theme, setTheme}
}
