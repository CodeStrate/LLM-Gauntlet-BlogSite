/**
 * Agentic V2 theme registry.
 *
 * Each theme is a flat map of CSS custom-property names → colour values.
 * These are spread onto the root element via `style={AGENTIC_THEMES[key]}`,
 * so every child can reference var(--a-*) without any extra context.
 *
 * Adding a new theme
 * ------------------
 * 1. Add a key to AGENTIC_THEMES below with all 10 required variables.
 * 2. That's it — the theme picker, localStorage persistence, and type safety
 *    all pick it up automatically through THEME_NAMES and AgenticThemeKey.
 */

export type AgenticTheme = {
  "--a-bg": string; // page background
  "--a-surface": string; // card / panel background
  "--a-ink": string; // primary text
  "--a-ink-soft": string; // secondary text
  "--a-ink-faint": string; // placeholder / muted text
  "--a-rule": string; // borders and dividers
  "--a-accent": string; // purple/primary accent (links, active cursor)
  "--a-accent-blue": string; // blue accent (user message stripe, active rows)
  "--a-accent-orange": string; // orange accent (thinking label, warnings)
  "--a-accent-green": string; // green accent (status dot, additions)
};

export const AGENTIC_THEMES: Record<string, AgenticTheme> = {
  dark: {
    "--a-bg": "#0e1014",
    "--a-surface": "#1a1d27",
    "--a-ink": "#f0f2f8",
    "--a-ink-soft": "#b1b6c2",
    "--a-ink-faint": "#6f7585",
    "--a-rule": "#2a2e3a",
    "--a-accent": "#b6a8ff",
    "--a-accent-blue": "#7aa0ff",
    "--a-accent-orange": "#ff7e33",
    "--a-accent-green": "#1f9d55",
  },
  light: {
    "--a-bg": "#f5f7fa",
    "--a-surface": "#ffffff",
    "--a-ink": "#1a1d2e",
    "--a-ink-soft": "#4a4d5e",
    "--a-ink-faint": "#8a8d9e",
    "--a-rule": "#dce0ea",
    "--a-accent": "#6e8dea",
    "--a-accent-blue": "#2c5cff",
    "--a-accent-orange": "#d6452b",
    "--a-accent-green": "#1f9d55",
  },
  aura: {
    "--a-bg": "#15131a",
    "--a-surface": "#1d1b26",
    "--a-ink": "#e8e6f0",
    "--a-ink-soft": "#b0aec0",
    "--a-ink-faint": "#706e80",
    "--a-rule": "#2e2b3a",
    "--a-accent": "#c084fc",
    "--a-accent-blue": "#a78bfa",
    "--a-accent-orange": "#f472b6",
    "--a-accent-green": "#34d399",
  },
  "tokyo-night": {
    "--a-bg": "#0f1420",
    "--a-surface": "#1a1f30",
    "--a-ink": "#e2e6f0",
    "--a-ink-soft": "#a8b2d4",
    "--a-ink-faint": "#6a74a0",
    "--a-rule": "#28304a",
    "--a-accent": "#bb9af7",
    "--a-accent-blue": "#6c8cff",
    "--a-accent-orange": "#ff9e64",
    "--a-accent-green": "#9ece6a",
  },
  // Everforest — sainnhe/everforest
  // bg0=main bg · bg1=surface · bg2=rule · fg=ink · grey1=faint · grey2=soft
  // Foreground palette is identical across hard/medium/soft variants.
  "everforest-hard-dark": {
    "--a-bg":             "#272E33", // bg0
    "--a-surface":        "#2E383C", // bg1
    "--a-ink":            "#D3C6AA", // fg
    "--a-ink-soft":       "#9DA9A0", // grey2
    "--a-ink-faint":      "#859289", // grey1
    "--a-rule":           "#374145", // bg2
    "--a-accent":         "#D699B6", // purple
    "--a-accent-blue":    "#7FBBB3", // blue
    "--a-accent-orange":  "#E69875", // orange
    "--a-accent-green":   "#A7C080", // green
  },
  "everforest-hard-light": {
    "--a-bg":             "#FFFBEF", // bg0
    "--a-surface":        "#F8F5E4", // bg1
    "--a-ink":            "#5C6A72", // fg
    "--a-ink-soft":       "#829181", // grey2
    "--a-ink-faint":      "#939F91", // grey1
    "--a-rule":           "#E8E5D5", // bg4
    "--a-accent":         "#DF69BA", // purple
    "--a-accent-blue":    "#3A94C5", // blue
    "--a-accent-orange":  "#F57D26", // orange
    "--a-accent-green":   "#8DA101", // green
  },
  "everforest-medium-dark": {
    "--a-bg":             "#2D353B", // bg0
    "--a-surface":        "#343F44", // bg1
    "--a-ink":            "#D3C6AA", // fg
    "--a-ink-soft":       "#9DA9A0", // grey2
    "--a-ink-faint":      "#859289", // grey1
    "--a-rule":           "#3D484D", // bg2
    "--a-accent":         "#D699B6", // purple
    "--a-accent-blue":    "#7FBBB3", // blue
    "--a-accent-orange":  "#E69875", // orange
    "--a-accent-green":   "#A7C080", // green
  },
  "everforest-medium-light": {
    "--a-bg":             "#FDF6E3", // bg0
    "--a-surface":        "#F4F0D9", // bg1
    "--a-ink":            "#5C6A72", // fg
    "--a-ink-soft":       "#829181", // grey2
    "--a-ink-faint":      "#939F91", // grey1
    "--a-rule":           "#E0DCC7", // bg4
    "--a-accent":         "#DF69BA", // purple
    "--a-accent-blue":    "#3A94C5", // blue
    "--a-accent-orange":  "#F57D26", // orange
    "--a-accent-green":   "#8DA101", // green
  },
  // Catppuccin — catppuccin/catppuccin
  // Base=bg · Surface0=surface · Surface1=rule · Text=ink · Overlay1=faint · Subtext1=soft
  "catppuccin-macchiato": {
    "--a-bg":             "#24273a", // Base
    "--a-surface":        "#363a4f", // Surface0
    "--a-ink":            "#cad3f5", // Text
    "--a-ink-soft":       "#b8c0e0", // Subtext1
    "--a-ink-faint":      "#8087a2", // Overlay1
    "--a-rule":           "#494d64", // Surface1
    "--a-accent":         "#c6a0f6", // Mauve
    "--a-accent-blue":    "#8aadf4", // Blue
    "--a-accent-orange":  "#f5a97f", // Peach
    "--a-accent-green":   "#a6da95", // Green
  },
  "catppuccin-mocha": {
    "--a-bg":             "#1e1e2e", // Base
    "--a-surface":        "#313244", // Surface0
    "--a-ink":            "#cdd6f4", // Text
    "--a-ink-soft":       "#bac2de", // Subtext1
    "--a-ink-faint":      "#7f849c", // Overlay1
    "--a-rule":           "#45475a", // Surface1
    "--a-accent":         "#cba6f7", // Mauve
    "--a-accent-blue":    "#89b4fa", // Blue
    "--a-accent-orange":  "#fab387", // Peach
    "--a-accent-green":   "#a6e3a1", // Green
  },
  // Gruvbox — morhetz/gruvbox
  // Dark: bg0=bg · bg1=surface · bg2=rule · fg1=ink · fg2=soft · fg4=faint
  // Light: bg0=bg · bg1=surface · bg2=rule · fg1=ink · fg2=soft · fg4=faint
  "gruvbox-dark": {
    "--a-bg":             "#282828", // bg0
    "--a-surface":        "#3c3836", // bg1
    "--a-ink":            "#ebdbb2", // fg1
    "--a-ink-soft":       "#d5c4a1", // fg2
    "--a-ink-faint":      "#a89984", // fg4
    "--a-rule":           "#504945", // bg2
    "--a-accent":         "#d3869b", // purple
    "--a-accent-blue":    "#83a598", // blue
    "--a-accent-orange":  "#fe8019", // orange
    "--a-accent-green":   "#b8bb26", // green
  },
  "gruvbox-light": {
    "--a-bg":             "#fbf1c7", // bg0
    "--a-surface":        "#ebdbb2", // bg1
    "--a-ink":            "#3c3836", // fg1
    "--a-ink-soft":       "#504945", // fg2
    "--a-ink-faint":      "#7c6f64", // fg4
    "--a-rule":           "#d5c4a1", // bg2
    "--a-accent":         "#8f3f71", // purple
    "--a-accent-blue":    "#076678", // blue
    "--a-accent-orange":  "#af3a03", // orange
    "--a-accent-green":   "#79740e", // green
  },
};

export type AgenticThemeKey = keyof typeof AGENTIC_THEMES;
export const THEME_NAMES = Object.keys(AGENTIC_THEMES) as AgenticThemeKey[];
export const DEFAULT_THEME: AgenticThemeKey = "dark";
