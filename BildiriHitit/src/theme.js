export const DEFAULT_THEME = 'hitit-green'

export const APP_THEMES = [
    {
        id: 'hitit-green',
        name: 'HititGreen',
        description: 'Mevcut koyu zeminli klasik Hitit yeşili tema.',
        previewClassName: 'from-[#0f1f16] via-[#143321] to-[#1aa353]'
    },
    {
        id: 'hitit-glass',
        name: 'HititGlass',
        description: 'Cam yüzeyli koyu mod, neon yeşil ışıltılı yeni tema.',
        previewClassName: 'from-[#06110d] via-[#0a1e18] to-[#39ff88]'
    }
]

export const applyTheme = (themeName) => {
    if (typeof document === 'undefined') return

    const nextTheme = APP_THEMES.some(theme => theme.id === themeName) ? themeName : DEFAULT_THEME
    document.documentElement.dataset.theme = nextTheme
}
