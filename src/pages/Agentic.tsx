/**
 * Agentic V2 — interactive benchmark viewer / future SLM chat interface.
 *
 * Current state (WIP)
 * -------------------
 * The page simulates an OpenCode-style terminal shell. It lets users browse
 * recorded agentic benchmark sessions (LangChain RAG task, Phase 1 + Phase 2).
 * Each session shows the model's thinking, tool calls, and written files.
 *
 * Planned: a lightweight SLM will be deployed on-site so this chat interface
 * becomes interactive — users can ask follow-up questions about the benchmark
 * results, and the model responds in the same terminal UI.
 *
 * Architecture
 * ------------
 * This file is the state coordinator. It owns all modal / UI state and the
 * single global keydown handler that drives keyboard navigation across modals.
 * The actual rendering is delegated to focused sub-components:
 *
 *   SessionView          — full-screen chat log viewer (chat + sidebar)
 *   CommandPalette       — Ctrl+P overlay
 *   ThemePicker          — searchable theme switcher
 *   ModelPicker          — session/agent switcher
 *   SessionHistoryModal  — last-50 viewed sessions
 *
 * Data
 *   AGENTIC_MODELS       — registered benchmark models (agenticChats.ts)
 *   AGENTIC_THEMES       — CSS-variable theme map (agenticThemes.ts)
 *   getAgenticChatLog()  — parses a raw markdown chat dump into ChatMessage[]
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AgenticModeLogo } from "../components/BrandIcon";
import {
  AGENTIC_MODELS,
  getAgenticChatLog,
  hasAgenticChatLog,
  type AgenticChatLog,
} from "../lib/agenticChats";
import {
  AGENTIC_THEMES, THEME_NAMES, DEFAULT_THEME,
  type AgenticThemeKey,
} from "../lib/agenticThemes";
import type { Command, HistoryEntry } from "../components/agentic/types";
import { CommandPalette }       from "../components/agentic/CommandPalette";
import { ThemePicker }          from "../components/agentic/ThemePicker";
import { ModelPicker }          from "../components/agentic/ModelPicker";
import { SessionHistoryModal }  from "../components/agentic/SessionHistoryModal";
import { SessionView }          from "../components/agentic/SessionView";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HISTORY_KEY = "agentic:sessionHistory";

// Maps a model slug to its long-form report slug under /docs/
const MODEL_TO_REPORT: Record<string, string> = {
  "gpt-oss-20b-medium":      "gpt-oss-20b",
  "gemma-4-e4b":             "gemma-4-e4b",
  "gemma-4-19b-reap":        "gemma-4-19b-reap",
  "glm-4-7-flash-23b-reap":  "glm-flash-4.7-reap",
  "cerebras-qwen3-25b-reap": "qwen3-coder",
  "sushi-coder-9b":          "sushi-coder-rl-qwen-3.5-9b-opus-distill",
};

// ---------------------------------------------------------------------------
// History helpers
// ---------------------------------------------------------------------------

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); }
  catch { return []; }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function Agentic() {
  // ── Terminal input state ──────────────────────────────────────────────────
  const [command, setCommand]           = useState("");
  const [cursorPos, setCursorPos]       = useState(0);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [closeSuggestions, setCloseSuggestions] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Model / session state ─────────────────────────────────────────────────
  const [selectedModelIdx, setSelectedModelIdx] = useState(() => {
    const saved = parseInt(localStorage.getItem("agentic:selectedModel") ?? "", 10);
    return !isNaN(saved) && saved >= 0 && saved < AGENTIC_MODELS.length ? saved : 0;
  });
  const [viewingSession, setViewingSession] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<HistoryEntry[]>(loadHistory);

  // ── Modal visibility ──────────────────────────────────────────────────────
  const [isPaletteOpen,   setIsPaletteOpen]   = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [historyOpen,     setHistoryOpen]     = useState(false);

  // ── Palette state ─────────────────────────────────────────────────────────
  const [paletteSearch, setPaletteSearch] = useState("");
  const [activeIndex,   setActiveIndex]   = useState(0); // shared by palette + model picker

  // ── Theme state ───────────────────────────────────────────────────────────
  const [agenticTheme, setAgenticTheme] = useState<AgenticThemeKey>(
    () => (localStorage.getItem("agentic:theme") as AgenticThemeKey) || DEFAULT_THEME,
  );
  const [themeSearch,      setThemeSearch]      = useState("");
  const [themeActiveIndex, setThemeActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // ── Persistence ───────────────────────────────────────────────────────────

  useEffect(() => { localStorage.setItem("agentic:theme", agenticTheme); }, [agenticTheme]);
  useEffect(() => { localStorage.setItem("agentic:selectedModel", String(selectedModelIdx)); }, [selectedModelIdx]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const currentModel = AGENTIC_MODELS[selectedModelIdx];
  const chatLog = hasAgenticChatLog(currentModel.slug)
    ? getAgenticChatLog(currentModel.slug)
    : null;

  const commands: Command[] = useMemo(() => [
    { id: "switch-theme",    label: "switch theme",          category: "System",  shortcut: "ctrl+x t", action: () => setThemePickerOpen(true) },
    { id: "switch-model",    label: "switch model session",  category: "Session", shortcut: "ctrl+x m", action: () => setModelPickerOpen(true) },
    { id: "session-history", label: "session history",       category: "Session", shortcut: "ctrl+x h", action: () => setHistoryOpen(true) },
    { id: "see-report",      label: "see report",            category: "Report",  shortcut: "ctrl+x r", action: () => { const slug = MODEL_TO_REPORT[currentModel.slug]; if (slug) navigate(`/docs/${slug}`); } },
    { id: "leaderboard",     label: "agentic leaderboard",   category: "Report",  shortcut: "ctrl+x b", action: () => navigate("/leaderboard") },
    { id: "light-mode",      label: "switch to light mode",  category: "System",  shortcut: "ctrl+x l", action: () => setAgenticTheme("light") },
  ], [navigate, currentModel]);

  const filteredCommands = useMemo(
    () => commands.filter(cmd => cmd.label.toLowerCase().includes(paletteSearch.toLowerCase())),
    [commands, paletteSearch],
  );

  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const filteredThemes = useMemo(() => {
    const q = themeSearch.trim().toLowerCase();
    return q ? THEME_NAMES.filter(n => n.toLowerCase().includes(q)) : THEME_NAMES;
  }, [themeSearch]);

  const suggestions = useMemo(() => [
    { cmd: "/sessions", desc: "Switch session",         action: () => setModelPickerOpen(true) },
    { cmd: "/new",      desc: "New session",             action: () => setCommand("") },
    { cmd: "/init",     desc: "guided AGENTS.md setup",  action: () => setCommand("/init ") },
    { cmd: "/agents",   desc: "Switch agent",            action: () => setModelPickerOpen(true) },
    { cmd: "/themes",   desc: "Switch theme",            action: () => setThemePickerOpen(true) },
    { cmd: "/models",   desc: "Switch model",            action: () => setModelPickerOpen(true) },
    { cmd: "/variants", desc: "Switch model variant",    action: () => setSelectedModelIdx(i => (i + 1) % AGENTIC_MODELS.length) },
  ], []);

  const filteredSuggestions = useMemo(() => {
    if (closeSuggestions || !command.startsWith("/") || command === "/") return [];
    return suggestions.filter(s => s.cmd.startsWith(command.split(" ")[0]));
  }, [command, suggestions, closeSuggestions]);

  // Derived stats for the session sidebar
  const modifiedFiles = useMemo(() => {
    if (!chatLog) return [];
    const fileMap = new Map<string, { added: number; removed: number }>();
    chatLog.messages.forEach(m => {
      m.toolCalls.forEach(tc => {
        const match = tc.input?.match(/"filePath"\s*:\s*"([^"]+)"/);
        if (!match) return;
        const name = match[1].split("/").pop() || match[1];
        if (!fileMap.has(name)) fileMap.set(name, { added: 0, removed: 0 });
        const entry = fileMap.get(name)!;
        if (tc.tool.includes("edit") && tc.input) {
          try { const p = JSON.parse(tc.input); if (p.oldString && p.newString) { entry.removed += p.oldString.split("\n").length; entry.added += p.newString.split("\n").length; } } catch { /* ignore */ }
        } else if (tc.tool.includes("write") && tc.input) {
          try { const p = JSON.parse(tc.input); if (p.content) entry.added += p.content.split("\n").length; } catch { /* ignore */ }
        }
      });
    });
    return Array.from(fileMap.entries()).map(([name, counts]) => ({ name, ...counts }));
  }, [chatLog]);

  const { approxTokens, compactionIdx } = useMemo(() => {
    if (!chatLog) return { approxTokens: 0, compactionIdx: -1 };
    const msgs = chatLog.messages;
    let startIdx = 0, cIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].modelName?.toLowerCase().includes("compaction")) { cIdx = i; startIdx = i; break; }
    }
    const chars = msgs.slice(startIdx).reduce((acc, m) => {
      acc += m.content.length + (m.thinking?.length ?? 0);
      acc += m.toolCalls.reduce((ta, tc) => ta + (tc.input?.length ?? 0) + (tc.output?.length ?? 0), 0);
      return acc;
    }, 0);
    return { approxTokens: Math.round(chars / 4), compactionIdx: cIdx };
  }, [chatLog]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => { setCloseSuggestions(false); setActiveSuggestion(0); }, [command]);

  useEffect(() => {
    if (activeSuggestion >= filteredSuggestions.length) setActiveSuggestion(0);
  }, [filteredSuggestions, activeSuggestion]);

  useEffect(() => {
    if (themePickerOpen) { setThemeSearch(""); setThemeActiveIndex(0); }
  }, [themePickerOpen]);

  // ── Global keyboard handler ───────────────────────────────────────────────
  // All modal navigation lives here so state updates stay in one place.

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Escape — close modals in priority order
      if (e.key === "Escape") {
        if (themePickerOpen)  { setThemePickerOpen(false); return; }
        if (modelPickerOpen)  { setModelPickerOpen(false); return; }
        if (historyOpen)      { setHistoryOpen(false); return; }
        if (isPaletteOpen)    { setIsPaletteOpen(false); return; }
        if (viewingSession)   { setViewingSession(false); return; }
        if (isFullscreen)     { setIsFullscreen(false); return; }
        if (filteredSuggestions.length > 0) { setCloseSuggestions(true); return; }
      }

      // Ctrl/Cmd+P — open command palette
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setIsPaletteOpen(true); setActiveIndex(0); setPaletteSearch("");
      }

      // Command palette navigation
      if (isPaletteOpen) {
        if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => (i + 1) % filteredCommands.length); return; }
        if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length); return; }
        if (e.key === "Enter")     { e.preventDefault(); filteredCommands[activeIndex]?.action(); setIsPaletteOpen(false); return; }
      }

      // Model picker navigation
      if (modelPickerOpen) {
        if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => (i + 1) % AGENTIC_MODELS.length); return; }
        if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIndex(i => (i - 1 + AGENTIC_MODELS.length) % AGENTIC_MODELS.length); return; }
        if (e.key === "Enter")     { e.preventDefault(); setSelectedModelIdx(activeIndex % AGENTIC_MODELS.length); setModelPickerOpen(false); return; }
      }

      // Theme picker navigation
      if (themePickerOpen) {
        const len = Math.max(filteredThemes.length, 1);
        if (e.key === "ArrowDown") { e.preventDefault(); setThemeActiveIndex(i => (i + 1) % len); return; }
        if (e.key === "ArrowUp")   { e.preventDefault(); setThemeActiveIndex(i => (i - 1 + len) % len); return; }
        if (e.key === "Enter")     { e.preventDefault(); const name = filteredThemes[themeActiveIndex]; if (name) setAgenticTheme(name); setThemePickerOpen(false); return; }
      }

      // Inline suggestion navigation (only when main input is visible)
      if (!viewingSession && !isPaletteOpen && !modelPickerOpen && !historyOpen && filteredSuggestions.length > 0 && !closeSuggestions) {
        if (e.key === "ArrowDown") { e.preventDefault(); setActiveSuggestion(i => (i + 1) % filteredSuggestions.length); return; }
        if (e.key === "ArrowUp")   { e.preventDefault(); setActiveSuggestion(i => (i - 1 + filteredSuggestions.length) % filteredSuggestions.length); return; }
        if (e.key === "Enter")     { e.preventDefault(); filteredSuggestions[activeSuggestion]?.action(); setCommand(""); setCloseSuggestions(true); setTimeout(() => setCloseSuggestions(false), 0); return; }
        if (e.key === "Tab")       { e.preventDefault(); setCommand(filteredSuggestions[activeSuggestion]?.cmd + " "); return; }
      }

      // Typing anywhere focuses the main input
      if (!viewingSession && !isPaletteOpen && !modelPickerOpen && !historyOpen && !e.ctrlKey && !e.metaKey && e.key.length === 1 && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    isFullscreen, isPaletteOpen, filteredCommands, activeIndex,
    filteredSuggestions, activeSuggestion, closeSuggestions,
    viewingSession, modelPickerOpen, historyOpen, themePickerOpen, filteredThemes, themeActiveIndex,
  ]);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const recordSessionView = useCallback((log: AgenticChatLog, slug: string, name: string) => {
    const entry: HistoryEntry = { modelName: name, modelSlug: slug, title: log.title, timestamp: Date.now() };
    const updated = [entry, ...sessionHistory.filter(e => e.modelSlug !== slug)].slice(0, 50);
    setSessionHistory(updated);
    saveHistory(updated);
  }, [sessionHistory]);

  function handleCommandSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.defaultPrevented || e.key !== "Enter") return;
    if (filteredSuggestions.length > 0 && !closeSuggestions) { e.preventDefault(); return; }
    const base = command.trim().toLowerCase().split(" ")[0];
    if (base === "/models")      navigate("/models");
    else if (base === "/blog")   navigate("/blog");
    else if (base === "/rubrics") navigate("/rubrics");
    else if (base === "/leaderboard") navigate("/leaderboard");
    else if (base === "/home")   navigate("/");
    else if (base === "/agents" || base === "/sessions") setModelPickerOpen(true);
    setCommand("");
  }

  // ── Session view ──────────────────────────────────────────────────────────

  if (viewingSession && chatLog) {
    return (
      <SessionView
        chatLog={chatLog}
        currentModel={currentModel}
        themeVars={AGENTIC_THEMES[agenticTheme]}
        modifiedFiles={modifiedFiles}
        approxTokens={approxTokens}
        compactionIdx={compactionIdx}
        onClose={() => setViewingSession(false)}
        isPaletteOpen={isPaletteOpen}
        onPaletteOpen={setIsPaletteOpen}
        paletteSearch={paletteSearch}
        onPaletteSearchChange={setPaletteSearch}
        groupedCommands={groupedCommands}
        filteredCommands={filteredCommands}
        paletteActiveIndex={activeIndex}
        onPaletteActiveIndexChange={setActiveIndex}
        onCommandSelect={cmd => cmd.action()}
      />
    );
  }

  // ── Main terminal view ────────────────────────────────────────────────────

  const inputText = command;
  const beforeCursor = inputText.slice(0, cursorPos);
  const atCursor = inputText[cursorPos] || " ";
  const afterCursor = inputText.slice(cursorPos + 1);

  return (
    <div
      style={AGENTIC_THEMES[agenticTheme] as React.CSSProperties}
      className={
        isFullscreen
          ? "fixed inset-0 z-[100] bg-[var(--a-bg)] text-[var(--a-ink)] flex flex-col font-mono overflow-hidden"
          : "relative bg-[var(--a-bg)] text-[var(--a-ink)] flex flex-col font-mono min-h-[calc(100svh-96px)] overflow-hidden"
      }
    >
      {/* Fullscreen toggle */}
      <button
        className={`absolute p-2 text-[var(--a-ink-faint)] hover:text-[var(--a-ink)] transition-colors z-[110] ${isFullscreen ? "top-4 right-4" : "top-3 right-4"}`}
        onClick={() => setIsFullscreen(!isFullscreen)}
        aria-label="Toggle Fullscreen"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isFullscreen
            ? <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            : <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />}
        </svg>
      </button>

      {/* Modals */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        search={paletteSearch}
        onSearchChange={setPaletteSearch}
        groupedCommands={groupedCommands}
        filteredCommands={filteredCommands}
        activeIndex={activeIndex}
        onActiveIndexChange={setActiveIndex}
        onSelect={cmd => { cmd.action(); setIsPaletteOpen(false); }}
      />
      <ThemePicker
        isOpen={themePickerOpen}
        onClose={() => setThemePickerOpen(false)}
        search={themeSearch}
        onSearchChange={setThemeSearch}
        themes={filteredThemes}
        activeIndex={themeActiveIndex}
        onActiveIndexChange={setThemeActiveIndex}
        currentTheme={agenticTheme}
        onSelect={name => { setAgenticTheme(name); setThemePickerOpen(false); }}
      />
      <ModelPicker
        isOpen={modelPickerOpen}
        onClose={() => setModelPickerOpen(false)}
        models={AGENTIC_MODELS}
        activeIndex={activeIndex}
        selectedModelIdx={selectedModelIdx}
        onActiveIndexChange={setActiveIndex}
        onSelect={idx => { setSelectedModelIdx(idx); setModelPickerOpen(false); }}
      />
      <SessionHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={sessionHistory}
        models={AGENTIC_MODELS}
        onSelectSession={entry => {
          const idx = AGENTIC_MODELS.findIndex(m => m.slug === entry.modelSlug);
          if (idx >= 0) setSelectedModelIdx(idx);
          setViewingSession(true);
        }}
      />

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6">
        <div className="w-full max-w-[640px] flex flex-col font-mono text-[13px]">
          <div className="flex justify-center mb-6">
            <AgenticModeLogo className="w-[420px] h-auto" aria-hidden />
          </div>

          {/* Inline autocomplete */}
          {filteredSuggestions.length > 0 && (
            <div className="flex flex-col border border-[var(--a-rule)] bg-[var(--a-surface)] shadow-xl">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--a-rule)]">
                <span className="text-[11px] text-[var(--a-ink-faint)]">Commands</span>
                <span className="text-[11px] text-[var(--a-ink-faint)]">↵ execute · tab complete</span>
              </div>
              {filteredSuggestions.map((s, i) => {
                const isActive = i === activeSuggestion;
                return (
                  <div
                    key={s.cmd}
                    className={`flex items-center justify-between px-3 py-1.5 cursor-pointer ${isActive ? "bg-[var(--a-accent-blue)] text-[var(--a-surface)]" : "text-[var(--a-ink)] hover:bg-[var(--a-rule)]"}`}
                    onMouseEnter={() => setActiveSuggestion(i)}
                    onClick={() => { s.action(); setCommand(""); setCloseSuggestions(true); setTimeout(() => setCloseSuggestions(false), 0); inputRef.current?.focus(); }}
                  >
                    <span className={`font-mono text-[13px] ${isActive ? "font-medium" : ""}`}>{s.cmd}</span>
                    <span className={`font-mono text-[11px] ${isActive ? "" : "text-[var(--a-ink-faint)]"}`}>{s.desc}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Input box with block caret */}
          <div className="flex flex-col border-l-2 border-[var(--a-accent)] bg-[var(--a-surface)] mt-[1px] py-2.5 px-3 relative">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={e => setCommand(e.target.value)}
                onKeyDown={handleCommandSubmit}
                onSelect={() => setCursorPos(inputRef.current?.selectionStart ?? 0)}
                onClick={() => setCursorPos(inputRef.current?.selectionStart ?? 0)}
                onKeyUp={() => setCursorPos(inputRef.current?.selectionStart ?? 0)}
                className="block-caret-input bg-transparent outline-none text-transparent w-full"
                autoComplete="off"
                spellCheck="false"
                autoFocus
                style={{ caretColor: "transparent" }}
              />
              <div className="absolute inset-0 flex items-center pointer-events-none" aria-hidden>
                {inputText.length === 0 ? (
                  <span className="block-caret-placeholder">Type / for commands — free-text chat coming soon</span>
                ) : (
                  <>
                    <span className="whitespace-pre text-[var(--a-ink)]">{beforeCursor}</span>
                    <span className="block-caret-cursor whitespace-pre">{atCursor}</span>
                    <span className="whitespace-pre text-[var(--a-ink)]">{afterCursor}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2.5 text-[var(--a-ink-soft)] text-[12px]">
              <span className="text-[var(--a-accent)]">Current</span>
              <span>·</span>
              <span className="text-[var(--a-ink)]">{currentModel.name}</span>
              <span>·</span>
              <span className="text-[var(--a-ink-faint)]">{currentModel.vendor}</span>
              {currentModel.thinkingLevel && (
                <><span>·</span><span className="text-[var(--a-accent-orange)]">{currentModel.thinkingLevel} thinking</span></>
              )}
            </div>
          </div>

          {/* Key hints */}
          <div className="flex justify-end gap-4 mt-3 text-[12px] text-[var(--a-ink-faint)]">
            <span><strong className="text-[var(--a-ink)] font-normal">/</strong> commands</span>
            <span><strong className="text-[var(--a-ink)] font-normal">tab</strong> cycle agents</span>
            <button className="hover:text-[var(--a-ink)] transition-colors" onClick={() => setIsPaletteOpen(true)}>
              <strong className="text-[var(--a-ink)] font-normal">ctrl+p</strong> all commands
            </button>
          </div>

          {/* Session viewer entry point */}
          {chatLog && (
            <div className="mt-10 text-[12px] text-[var(--a-ink-faint)] text-center">
              <button
                onClick={() => { recordSessionView(chatLog, currentModel.slug, currentModel.name); setViewingSession(true); }}
                className="hover:text-[var(--a-ink)] transition-colors"
              >
                <span className="text-[var(--a-accent)]">● Session</span> View agentic chat log for{" "}
                <span className="text-[var(--a-ink)]">{currentModel.name}</span>
              </button>
            </div>
          )}

          {/* Usage guide */}
          <div className="mt-10 border-t border-[var(--a-rule)] pt-6 text-[11px] text-[var(--a-ink-faint)] leading-relaxed">
            <div className="mb-3 font-semibold text-[var(--a-ink-soft)] tracking-wide uppercase text-[10px]">How to use</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <div><span className="text-[var(--a-ink)]">/sessions</span> <span className="text-[var(--a-ink-faint)]">or</span> <span className="text-[var(--a-ink)]">/agents</span> — switch model</div>
              <div><span className="text-[var(--a-ink)]">/themes</span> — change colour theme</div>
              <div><span className="text-[var(--a-ink)]">/variants</span> — cycle to next model</div>
              <div><span className="text-[var(--a-ink)]">/models</span> — go to models page</div>
              <div><span className="text-[var(--a-ink)]">/leaderboard</span> — open leaderboard</div>
              <div><span className="text-[var(--a-ink)]">/blog</span> — open blog</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
              <div><span className="text-[var(--a-ink)]">ctrl+p</span> — command palette</div>
              <div><span className="text-[var(--a-ink)]">ctrl+x t</span> — switch theme</div>
              <div><span className="text-[var(--a-ink)]">ctrl+x m</span> — switch model</div>
              <div><span className="text-[var(--a-ink)]">ctrl+x r</span> — open model report</div>
            </div>
            <div className="mt-3 text-[var(--a-ink-faint)] italic">
              Text input is read-only — a local SLM for live Q&amp;A is planned.
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-3 flex items-center justify-between text-[var(--a-ink-faint)] text-[12px] font-mono">
        <div className="flex items-center gap-4">
          <span>~/LLM-Gauntlet-Development:main</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--a-accent-green)] text-[10px]">◉</span>
            <span>1 MCP /status</span>
          </div>
        </div>
        <div>1.14.39</div>
      </div>
    </div>
  );
}
