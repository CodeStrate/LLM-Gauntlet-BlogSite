import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AgenticModeLogo } from "../components/BrandIcon";
import {
  AGENTIC_MODELS,
  getAgenticChatLog,
  hasAgenticChatLog,
  type AgenticChatLog,
  type ToolCall,
} from "../lib/agenticChats";
import { Highlight, themes } from "prism-react-renderer";

function langFromPath(filePath?: string): string {
  const ext = filePath?.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "py": return "python";
    case "sh": case "bash": return "bash";
    case "json": return "json";
    case "ts": case "tsx": return "tsx";
    case "js": case "jsx": return "jsx";
    case "yaml": case "yml": return "yaml";
    case "md": return "markdown";
    case "css": return "css";
    case "toml": case "ini": case "cfg": return "markup";
    default: return "bash";
  }
}

// Naive diff for short strings
function computeDiff(oldStr: string, newStr: string) {
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");
  let prefix = 0;
  while (
    prefix < oldLines.length &&
    prefix < newLines.length &&
    oldLines[prefix] === newLines[prefix]
  ) {
    prefix++;
  }
  let suffix = 0;
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - 1 - suffix] ===
      newLines[newLines.length - 1 - suffix]
  ) {
    suffix++;
  }
  return { prefix, suffix, oldLines, newLines };
}

function EditDiffViewer({ oldStr, newStr, filePath }: { oldStr: string; newStr: string; filePath?: string }) {
  const { prefix, suffix, oldLines, newLines } = computeDiff(oldStr, newStr);
  const lang = langFromPath(filePath);

  return (
    <div className="flex gap-[1px] bg-[var(--a-rule)] text-[11px] font-mono w-full overflow-hidden rounded-[2px] mt-1">
      <Highlight theme={themes.oneDark} code={oldStr} language={lang}>
        {({ tokens, getTokenProps }) => (
          <div className="flex-1 bg-[var(--a-surface)] overflow-x-auto">
            <div className="p-3 whitespace-pre">
              {tokens.map((line, i) => {
                const isChanged = i >= prefix && i < oldLines.length - suffix;
                return (
                  <div key={`old-${i}`} className={`flex gap-3 ${isChanged ? "bg-[#3f2c2c]" : "hover:bg-[var(--a-rule)]"}`}>
                    <span className={`select-none w-4 text-right shrink-0 ${isChanged ? "text-[#ff8b8b] opacity-80" : "opacity-30"}`}>{isChanged ? "-" : " "}</span>
                    <span>{line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Highlight>
      <Highlight theme={themes.oneDark} code={newStr} language={lang}>
        {({ tokens, getTokenProps }) => (
          <div className="flex-1 bg-[var(--a-surface)] overflow-x-auto">
            <div className="p-3 whitespace-pre">
              {tokens.map((line, i) => {
                const isChanged = i >= prefix && i < newLines.length - suffix;
                return (
                  <div key={`new-${i}`} className={`flex gap-3 ${isChanged ? "bg-[#213524]" : "hover:bg-[var(--a-rule)]"}`}>
                    <span className={`select-none w-4 text-right shrink-0 ${isChanged ? "text-[#86e296] opacity-80" : "opacity-30"}`}>{isChanged ? "+" : " "}</span>
                    <span>{line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Highlight>
    </div>
  );
}

function ToolOutputViewer({ tc }: { tc: ToolCall }) {
  let parsedInput: any = null;
  if (tc.input) {
    try {
      parsedInput = JSON.parse(tc.input);
    } catch (e) {
      // Ignore
    }
  }

  // Edit tool with oldString and newString
  if (
    tc.tool.includes("edit") &&
    parsedInput &&
    typeof parsedInput.oldString === "string" &&
    typeof parsedInput.newString === "string"
  ) {
    return (
      <div className="flex flex-col gap-0 text-[12px]">
        <div className="text-[var(--a-ink-faint)] mb-1">{getToolTitle(tc)}</div>
        <EditDiffViewer
          oldStr={parsedInput.oldString}
          newStr={parsedInput.newString}
          filePath={parsedInput.filePath}
        />
        {tc.output && (
          <div className="mt-1 p-2 bg-[var(--a-surface)] border border-[var(--a-rule)] rounded-[2px] text-[var(--a-ink-soft)] whitespace-pre-wrap overflow-x-auto max-h-[150px] overflow-y-auto font-mono text-[11px] leading-relaxed">
            {tc.output}
          </div>
        )}
      </div>
    );
  }

  // Write tool with content
  if (
    tc.tool.includes("write") &&
    parsedInput &&
    typeof parsedInput.content === "string"
  ) {
    const lang = langFromPath(parsedInput.filePath);
    return (
      <div className="flex flex-col gap-0 text-[12px]">
        <div className="text-[var(--a-ink-faint)] mb-1">{getToolTitle(tc)}</div>
        <div className="bg-[var(--a-surface)] border border-[var(--a-rule)] rounded-[2px] overflow-x-auto max-h-[300px] overflow-y-auto font-mono text-[11px]">
          <Highlight theme={themes.oneDark} code={parsedInput.content} language={lang}>
            {({ tokens, getTokenProps }) => (
              <div className="p-3 whitespace-pre">
                {tokens.map((line, i) => (
                  <div key={i} className="flex gap-3 hover:bg-[var(--a-rule)]">
                    <span className="select-none opacity-30 w-4 text-right shrink-0 text-[#86e296]">+</span>
                    <span>{line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}</span>
                  </div>
                ))}
              </div>
            )}
          </Highlight>
        </div>
        {tc.output && (
          <div className="mt-1 p-2 bg-[var(--a-surface)] border border-[var(--a-rule)] rounded-[2px] text-[var(--a-ink-soft)] whitespace-pre-wrap overflow-x-auto max-h-[150px] overflow-y-auto font-mono text-[11px] leading-relaxed">
            {tc.output}
          </div>
        )}
      </div>
    );
  }

  // Default rendering for bash, read, or unparsed inputs
  return (
    <div className="flex flex-col gap-0 text-[12px]">
      <div className="text-[var(--a-ink-faint)] mb-1">{getToolTitle(tc)}</div>
      <div className="p-3 bg-[var(--a-surface)] border border-[var(--a-rule)] rounded-[2px] text-[var(--a-ink-soft)] whitespace-pre-wrap overflow-x-auto max-h-[300px] overflow-y-auto font-mono text-[11px] leading-relaxed">
        {tc.output || tc.input || "(no output)"}
      </div>
    </div>
  );
}

const AGENTIC_THEMES: Record<string, Record<string, string>> = {
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
};

const THEME_NAMES = Object.keys(
  AGENTIC_THEMES,
) as (keyof typeof AGENTIC_THEMES)[];

type Command = {
  id: string;
  label: string;
  category: string;
  shortcut: string;
  action: () => void;
};

type HistoryEntry = {
  modelName: string;
  modelSlug: string;
  title: string;
  timestamp: number;
};

const HISTORY_KEY = "agentic:sessionHistory";
const MODEL_TO_REPORT: Record<string, string> = {
  "gpt-oss-20b-medium": "gpt-oss-20b",
  "gemma-4-e4b": "gemma-4-e4b",
  "gemma-4-19b-reap": "gemma-4-19b-reap",
  "glm-4-7-flash-23b-reap": "glm-flash-4.7-reap",
  "cerebras-qwen3-25b-reap": "qwen3-coder",
  "sushi-coder-9b": "sushi-coder-rl-qwen-3.5-9b-opus-distill",
};

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function getToolTitle(tc: ToolCall) {
  if (tc.tool.includes("bash")) {
    const m = tc.input?.match(/"command"\s*:\s*"([^"]+)"/);
    if (m) return m[1];
    return `bash`;
  }
  const fileMatch = tc.input?.match(/"filePath"\s*:\s*"([^"]+)"/);
  if (fileMatch) {
    const f = fileMatch[1].split("/").pop();
    if (tc.tool.includes("edit")) return `← Patched ${f}`;
    if (tc.tool.includes("write")) return `← Wrote ${f}`;
    if (tc.tool.includes("read")) return `← Read ${f}`;
  }
  return `← ${tc.tool}`;
}

export function Agentic() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [command, setCommand] = useState("");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [selectedModelIdx, setSelectedModelIdx] = useState(() => {
    const saved = parseInt(localStorage.getItem("agentic:selectedModel") ?? "", 10);
    return !isNaN(saved) && saved >= 0 && saved < AGENTIC_MODELS.length ? saved : 0;
  });
  const [cursorPos, setCursorPos] = useState(0);
  const [closeSuggestions, setCloseSuggestions] = useState(false);
  const [viewingSession, setViewingSession] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [themeSearch, setThemeSearch] = useState("");
  const [themeActiveIndex, setThemeActiveIndex] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessionHistory, setSessionHistory] =
    useState<HistoryEntry[]>(loadHistory);

  const inputRef = useRef<HTMLInputElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);
  const themeInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [agenticTheme, setAgenticTheme] = useState<keyof typeof AGENTIC_THEMES>(
    () =>
      (localStorage.getItem("agentic:theme") as keyof typeof AGENTIC_THEMES) ||
      "dark",
  );

  useEffect(() => {
    localStorage.setItem("agentic:theme", agenticTheme as string);
  }, [agenticTheme]);

  useEffect(() => {
    localStorage.setItem("agentic:selectedModel", String(selectedModelIdx));
  }, [selectedModelIdx]);

  const recordSessionView = useCallback(
    (log: AgenticChatLog, slug: string, name: string) => {
      const entry: HistoryEntry = {
        modelName: name,
        modelSlug: slug,
        title: log.title,
        timestamp: Date.now(),
      };
      const updated = [
        entry,
        ...sessionHistory.filter((e) => e.modelSlug !== slug),
      ].slice(0, 50);
      setSessionHistory(updated);
      saveHistory(updated);
    },
    [sessionHistory],
  );

  const currentModel = AGENTIC_MODELS[selectedModelIdx];
  const chatLog = hasAgenticChatLog(currentModel.slug)
    ? getAgenticChatLog(currentModel.slug)
    : null;
  const commands: Command[] = useMemo(
    () => [
      {
        id: "switch-theme",
        label: "switch theme",
        category: "System",
        shortcut: "ctrl+x t",
        action: () => setThemePickerOpen(true),
      },
      {
        id: "switch-model",
        label: "switch model session",
        category: "Session",
        shortcut: "ctrl+x m",
        action: () => setModelPickerOpen(true),
      },
      {
        id: "session-history",
        label: "session history",
        category: "Session",
        shortcut: "ctrl+x h",
        action: () => setHistoryOpen(true),
      },
      {
        id: "see-report",
        label: "see report",
        category: "Report",
        shortcut: "ctrl+x r",
        action: () => {
          const slug = MODEL_TO_REPORT[currentModel.slug];
          if (slug) navigate(`/docs/${slug}`);
        },
      },
      {
        id: "leaderboard",
        label: "agentic leaderboard",
        category: "Report",
        shortcut: "ctrl+x b",
        action: () => navigate("/leaderboard"),
      },
      {
        id: "light-mode",
        label: "switch to light mode",
        category: "System",
        shortcut: "ctrl+x l",
        action: () => setAgenticTheme("light"),
      },
    ],
    [navigate, currentModel],
  );

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(paletteSearch.toLowerCase()),
  );

  const filteredThemes = useMemo(() => {
    const q = themeSearch.trim().toLowerCase();
    if (!q) return THEME_NAMES;
    return THEME_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [themeSearch]);

  const suggestions = useMemo(
    () => [
      {
        cmd: "/sessions",
        desc: "Switch session",
        action: () => setModelPickerOpen(true),
      },
      { cmd: "/new", desc: "New session", action: () => setCommand("") },
      {
        cmd: "/init",
        desc: "guided AGENTS.md setup",
        action: () => setCommand("/init "),
      },
      {
        cmd: "/agents",
        desc: "Switch agent",
        action: () => setModelPickerOpen(true),
      },
      {
        cmd: "/themes",
        desc: "Switch theme",
        action: () => setThemePickerOpen(true),
      },
      {
        cmd: "/models",
        desc: "Switch model",
        action: () => setModelPickerOpen(true),
      },
      {
        cmd: "/variants",
        desc: "Switch model variant",
        action: () =>
          setSelectedModelIdx((i) => (i + 1) % AGENTIC_MODELS.length),
      },
      {
        cmd: "/review",
        desc: "review changes",
        action: () => navigate("/leaderboard"),
      },
    ],
    [navigate],
  );

  const filteredSuggestions = useMemo(() => {
    if (closeSuggestions) return [];
    if (!command.startsWith("/") || command === "/") return [];
    return suggestions.filter((s) => s.cmd.startsWith(command.split(" ")[0]));
  }, [command, suggestions, closeSuggestions]);

  useEffect(() => {
    setCloseSuggestions(false);
    setActiveSuggestion(0);
  }, [command]);

  useEffect(() => {
    if (activeSuggestion >= filteredSuggestions.length) {
      setActiveSuggestion(0);
    }
  }, [filteredSuggestions, activeSuggestion]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (themePickerOpen) {
          setThemePickerOpen(false);
          return;
        }
        if (modelPickerOpen) {
          setModelPickerOpen(false);
          return;
        }
        if (historyOpen) {
          setHistoryOpen(false);
          return;
        }
        if (isPaletteOpen) {
          setIsPaletteOpen(false);
          return;
        }
        if (viewingSession) {
          setViewingSession(false);
          return;
        }
        if (isFullscreen) {
          setIsFullscreen(false);
          return;
        }
        if (filteredSuggestions.length > 0) {
          setCloseSuggestions(true);
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setIsPaletteOpen(true);
        setActiveIndex(0);
        setPaletteSearch("");
      }

      if (isPaletteOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % filteredCommands.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex(
            (i) => (i - 1 + filteredCommands.length) % filteredCommands.length,
          );
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          filteredCommands[activeIndex]?.action();
          setIsPaletteOpen(false);
          return;
        }
      }

      if (modelPickerOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % AGENTIC_MODELS.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex(
            (i) => (i - 1 + AGENTIC_MODELS.length) % AGENTIC_MODELS.length,
          );
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          setSelectedModelIdx(activeIndex % AGENTIC_MODELS.length);
          setModelPickerOpen(false);
          return;
        }
      }

      if (themePickerOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setThemeActiveIndex(
            (i) => (i + 1) % Math.max(filteredThemes.length, 1),
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setThemeActiveIndex(
            (i) =>
              (i - 1 + Math.max(filteredThemes.length, 1)) %
              Math.max(filteredThemes.length, 1),
          );
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const name = filteredThemes[themeActiveIndex];
          if (name) setAgenticTheme(name);
          setThemePickerOpen(false);
          return;
        }
      }

      if (
        !viewingSession &&
        !isPaletteOpen &&
        !modelPickerOpen &&
        !historyOpen &&
        filteredSuggestions.length > 0 &&
        !closeSuggestions
      ) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveSuggestion((i) => (i + 1) % filteredSuggestions.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveSuggestion(
            (i) =>
              (i - 1 + filteredSuggestions.length) % filteredSuggestions.length,
          );
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          filteredSuggestions[activeSuggestion]?.action();
          setCommand("");
          setCloseSuggestions(true);
          setTimeout(() => setCloseSuggestions(false), 0);
          return;
        }
        if (e.key === "Tab") {
          e.preventDefault();
          setCommand(filteredSuggestions[activeSuggestion]?.cmd + " ");
          return;
        }
      }

      if (
        !viewingSession &&
        !isPaletteOpen &&
        !modelPickerOpen &&
        !historyOpen &&
        !e.ctrlKey &&
        !e.metaKey &&
        e.key.length === 1 &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    isFullscreen,
    isPaletteOpen,
    filteredCommands,
    activeIndex,
    filteredSuggestions,
    activeSuggestion,
    closeSuggestions,
    viewingSession,
    modelPickerOpen,
    historyOpen,
    themePickerOpen,
  ]);

  useEffect(() => {
    if (isPaletteOpen) {
      setTimeout(() => paletteInputRef.current?.focus(), 10);
    }
  }, [isPaletteOpen]);

  useEffect(() => {
    if (themePickerOpen) {
      setThemeSearch("");
      setThemeActiveIndex(0);
      setTimeout(() => themeInputRef.current?.focus(), 10);
    }
  }, [themePickerOpen]);

  function handleCommandSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.defaultPrevented) return;
    if (e.key === "Enter") {
      if (filteredSuggestions.length > 0 && !closeSuggestions) {
        e.preventDefault();
        return;
      }
      const cmd = command.trim().toLowerCase();
      if (cmd.startsWith("/")) {
        const parts = cmd.split(" ");
        const base = parts[0];
        if (base === "/models") navigate("/models");
        else if (base === "/blog") navigate("/blog");
        else if (base === "/rubrics") navigate("/rubrics");
        else if (base === "/leaderboard") navigate("/leaderboard");
        else if (base === "/home") navigate("/");
        else if (base === "/agents") setModelPickerOpen(true);
        else if (base === "/sessions") setModelPickerOpen(true);
      }
      setCommand("");
    }
  }

  function updateCursor() {
    setCursorPos(inputRef.current?.selectionStart ?? 0);
  }

  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const modifiedFiles = useMemo(() => {
    if (!chatLog) return [];
    const fileMap = new Map<string, { added: number; removed: number }>();
    chatLog.messages.forEach((m) => {
      m.toolCalls.forEach((tc) => {
        const match = tc.input?.match(/"filePath"\s*:\s*"([^"]+)"/);
        if (!match) return;
        const name = match[1].split("/").pop() || match[1];
        if (!fileMap.has(name)) fileMap.set(name, { added: 0, removed: 0 });
        const entry = fileMap.get(name)!;
        if (tc.tool.includes("edit") && tc.input) {
          try {
            const p = JSON.parse(tc.input);
            if (p.oldString && p.newString) {
              entry.removed += p.oldString.split("\n").length;
              entry.added += p.newString.split("\n").length;
            }
          } catch { /* ignore */ }
        } else if (tc.tool.includes("write") && tc.input) {
          try {
            const p = JSON.parse(tc.input);
            if (p.content) entry.added += p.content.split("\n").length;
          } catch { /* ignore */ }
        }
      });
    });
    return Array.from(fileMap.entries()).map(([name, counts]) => ({ name, ...counts }));
  }, [chatLog]);

  const { approxTokens, compactionIdx } = useMemo(() => {
    if (!chatLog) return { approxTokens: 0, compactionIdx: -1 };
    const msgs = chatLog.messages;
    let startIdx = 0;
    let cIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].modelName?.toLowerCase().includes('compaction')) {
        cIdx = i;
        startIdx = i;
        break;
      }
    }
    const chars = msgs.slice(startIdx).reduce((acc, m) => {
      acc += m.content.length + (m.thinking?.length ?? 0);
      acc += m.toolCalls.reduce((ta, tc) => ta + (tc.input?.length ?? 0) + (tc.output?.length ?? 0), 0);
      return acc;
    }, 0);
    return { approxTokens: Math.round(chars / 4), compactionIdx: cIdx };
  }, [chatLog]);

  // Session view (Opencode-style)
  if (viewingSession && chatLog) {
    return (
      <div
        style={AGENTIC_THEMES[agenticTheme] as React.CSSProperties}
        className="fixed inset-0 z-[100] bg-[var(--a-bg)] text-[var(--a-ink)] flex flex-row font-mono overflow-hidden"
      >
        {/* Command Palette — available in session view */}
        {isPaletteOpen && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsPaletteOpen(false)} />
            <div className="relative w-full max-w-[540px] bg-[var(--a-surface)] border border-[var(--a-rule)] shadow-xl font-mono text-[13px] flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--a-rule)]">
                <span className="text-[var(--a-ink)] font-medium">Commands</span>
                <span className="text-[var(--a-ink-faint)]">esc</span>
              </div>
              <div className="p-2 pb-3">
                <input ref={paletteInputRef} type="text" value={paletteSearch} onChange={(e) => setPaletteSearch(e.target.value)} placeholder="Search" className="w-full bg-transparent outline-none text-[var(--a-ink)] px-2 py-1 mb-2 caret-[var(--a-ink)]" />
                <div className="max-h-[350px] overflow-y-auto">
                  {Object.entries(groupedCommands).map(([category, cmds]) => (
                    <div key={category} className="mb-2">
                      <div className="text-[var(--a-accent-orange)] text-[12px] font-semibold px-2 py-1">{category}</div>
                      <div className="flex flex-col gap-[2px]">
                        {cmds.map((cmd) => {
                          const globalIndex = filteredCommands.indexOf(cmd);
                          const isActive = globalIndex === activeIndex;
                          return (
                            <div key={cmd.id} className={`flex items-center justify-between px-2 py-1 cursor-pointer ${isActive ? "bg-[var(--a-accent-blue)] text-[var(--a-surface)]" : "text-[var(--a-ink)] hover:bg-[var(--a-rule)]"}`} onClick={() => { cmd.action(); setIsPaletteOpen(false); }} onMouseEnter={() => setActiveIndex(globalIndex)}>
                              <span>{cmd.label}</span>
                              <span className={`text-[12px] ${isActive ? "text-[var(--a-surface)]" : "text-[var(--a-ink-faint)]"}`}>{cmd.shortcut}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {filteredCommands.length === 0 && <div className="text-[var(--a-ink-faint)] text-[13px] py-4 px-2">No commands found.</div>}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-[var(--a-bg)] overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-[800px] mx-auto flex flex-col gap-8">
              {chatLog.messages.map((msg, i) => {
                if (msg.role === "user") {
                  return (
                    <div
                      key={i}
                      className="pl-4 border-l-2 border-[var(--a-accent-blue)] text-[13px] text-[var(--a-ink)] whitespace-pre-wrap mt-2"
                    >
                      {msg.content}
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={i}
                      className="flex flex-col gap-4 text-[13px] text-[var(--a-ink)]"
                    >
                      {/* Thinking */}
                      {msg.thinking && (
                        <div className="text-[var(--a-ink-soft)] whitespace-pre-wrap leading-relaxed">
                          <span className="text-[var(--a-accent-orange)] italic">
                            Thinking:
                          </span>{" "}
                          <span className="italic">{msg.thinking}</span>
                        </div>
                      )}

                      {/* Tool Calls */}
                      {msg.toolCalls.length > 0 && (
                        <div className="flex flex-col gap-3">
                          {msg.toolCalls.map((tc, j) => (
                            <ToolOutputViewer key={j} tc={tc} />
                          ))}
                        </div>
                      )}

                      {/* Content */}
                      {msg.content && (
                        <div className="leading-relaxed whitespace-pre-wrap text-[var(--a-ink)]">
                          {msg.content}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-2 mt-2 text-[12px] text-[var(--a-ink-faint)]">
                        <span className="text-[var(--a-accent-blue)]">▣</span>
                        <span className="hover:text-[var(--a-ink)] cursor-pointer transition-colors">
                          Build
                        </span>
                        <span>·</span>
                        <span>{msg.modelName || currentModel.name}</span>
                        {msg.duration && (
                          <>
                            <span>·</span>
                            <span>{msg.duration}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }
              })}

            </div>
          </div>

          {/* Sticky chat input */}
          <div className="shrink-0 border-t border-[var(--a-rule)] bg-[var(--a-bg)] px-6 py-3">
            <div className="max-w-[800px] mx-auto pl-4 border-l-2 border-[var(--a-accent-blue)]">
              <div className="w-2.5 h-[1.2em] bg-[var(--a-ink)] animate-pulse"></div>
              <div className="flex items-center gap-2 mt-2 text-[12px] text-[var(--a-ink-faint)]">
                <span>Build</span>
                <span>·</span>
                <span className="text-[var(--a-ink)]">{currentModel.name}</span>
                <span>·</span>
                <span className="text-[var(--a-accent-orange)]">{currentModel.thinkingLevel || "high"}</span>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="shrink-0 h-8 border-t border-[var(--a-rule)] bg-[var(--a-bg)] flex items-center justify-between px-4 text-[11px] text-[var(--a-ink-faint)] w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewingSession(false)}
                className="hover:text-[var(--a-ink)] transition-colors text-[var(--a-accent-blue)] font-semibold uppercase tracking-wide text-[10px]"
              >
                ← Return
              </button>
              <span className="hidden sm:inline">
                ~/LLM-Gauntlet-Development:main
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden lg:inline">
                <strong className="font-normal text-[var(--a-ink)]">
                  ctrl+p
                </strong>{" "}
                commands
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[var(--a-accent-green)]">●</span> Version 2
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar — OpenCode style */}
        <div className="w-[300px] pb-8 shrink-0 border-l border-[var(--a-rule)] bg-[var(--a-bg)] p-5 flex flex-col gap-5 overflow-y-auto hidden lg:flex text-[12px]">
          {/* Task title */}
          <div>
            <h3 className="font-bold text-[var(--a-ink)] text-[13px] leading-snug">
              {chatLog.title}
            </h3>
          </div>

          {/* Context */}
          <div>
            <div className="font-bold text-[var(--a-ink)] mb-1.5">Context</div>
            <div className="text-[var(--a-ink-faint)] flex flex-col gap-0.5">
              {compactionIdx >= 0 ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--a-accent-orange)]">◆</span>
                    <span>Compacted</span>
                    <span className="text-[var(--a-ink-faint)] mx-0.5">·</span>
                    <span className="text-[var(--a-ink-faint)] text-[11px]">{compactionIdx} msgs before</span>
                  </div>
                  <div>{approxTokens.toLocaleString()} tokens (post-compaction)</div>
                </>
              ) : (
                <div>
                  {approxTokens.toLocaleString()} tokens
                  <span className="text-[var(--a-ink-faint)] mx-1">·</span>
                  ~{Math.min(100, Math.round((approxTokens / 32000) * 100))}% used
                </div>
              )}
              <div className="text-[var(--a-ink-faint)]">$0.00 (local inference)</div>
            </div>
          </div>

          {/* MCP */}
          <div>
            <div className="font-bold text-[var(--a-ink)] mb-1.5">MCP</div>
            {chatLog.messages.some(m => m.toolCalls.some(tc => tc.tool.includes("obsidian")))
              ? <div className="flex items-center gap-1.5">
                  <span className="text-[var(--a-accent-green)] text-[10px]">●</span>
                  <span className="text-[var(--a-ink-faint)]">obsidian Connected</span>
                </div>
              : <div className="text-[var(--a-ink-faint)]">No MCP tools used</div>
            }
          </div>

          {/* LSP */}
          <div>
            <div className="font-bold text-[var(--a-ink)] mb-1.5">LSP</div>
            <div className="text-[var(--a-ink-faint)]">LSPs will activate as files are read</div>
          </div>

          {/* Modified Files */}
          {modifiedFiles.length > 0 && (
            <div>
              <div className="font-bold text-[var(--a-ink)] mb-2">
                ▼ Modified Files
              </div>
              <div className="flex flex-col gap-1">
                {modifiedFiles.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center justify-between gap-2 hover:text-[var(--a-ink)] cursor-pointer group"
                  >
                    <span className="truncate text-[var(--a-ink-faint)] group-hover:text-[var(--a-ink)] transition-colors">{f.name}</span>
                    <span className="shrink-0 flex items-center gap-1 text-[11px]">
                      {f.added > 0 && <span className="text-[#86e296]">+{f.added}</span>}
                      {f.removed > 0 && <span className="text-[#ff8b8b]">-{f.removed}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session stats */}
          <div className="mt-auto pt-4 border-t border-[var(--a-rule)]">
            <div className="text-[var(--a-ink-faint)] flex flex-col gap-0.5">
              <div>{chatLog.messages.length} messages</div>
              <div>
                {chatLog.messages.reduce((acc, m) => acc + m.toolCalls.length, 0)} tool calls
              </div>
              {chatLog.created && (
                <div>Started: {chatLog.created.split(",")[0]}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main view (non-scrollable)
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
      {/* Full screen toggle icon */}
      <button
        className={`absolute p-2 text-[var(--a-ink-faint)] hover:text-[var(--a-ink)] transition-colors z-[110] ${isFullscreen ? "top-4 right-4" : "top-3 right-4"}`}
        onClick={() => setIsFullscreen(!isFullscreen)}
        aria-label="Toggle Fullscreen"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {isFullscreen ? (
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          ) : (
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          )}
        </svg>
      </button>

      {/* Command Palette Modal */}
      {isPaletteOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsPaletteOpen(false)}
          />
          <div className="relative w-full max-w-[540px] bg-[var(--a-surface)] border border-[var(--a-rule)] shadow-xl font-mono text-[13px] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--a-rule)]">
              <span className="text-[var(--a-ink)] font-medium">Commands</span>
              <span className="text-[var(--a-ink-faint)]">esc</span>
            </div>
            <div className="p-2 pb-3">
              <input
                ref={paletteInputRef}
                type="text"
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent outline-none text-[var(--a-ink)] px-2 py-1 mb-2 caret-[var(--a-ink)]"
              />
              <div className="max-h-[350px] overflow-y-auto">
                {Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category} className="mb-2">
                    <div className="text-[var(--a-accent-orange)] text-[12px] font-semibold px-2 py-1">
                      {category}
                    </div>
                    <div className="flex flex-col gap-[2px]">
                      {cmds.map((cmd) => {
                        const globalIndex = filteredCommands.indexOf(cmd);
                        const isActive = globalIndex === activeIndex;
                        return (
                          <div
                            key={cmd.id}
                            className={`flex items-center justify-between px-2 py-1 cursor-pointer ${isActive ? "bg-[var(--a-accent-blue)] text-[var(--a-surface)]" : "text-[var(--a-ink)] hover:bg-[var(--a-rule)]"}`}
                            onClick={() => {
                              cmd.action();
                              setIsPaletteOpen(false);
                            }}
                            onMouseEnter={() => setActiveIndex(globalIndex)}
                          >
                            <span>{cmd.label}</span>
                            <span
                              className={`text-[12px] ${isActive ? "text-[var(--a-surface)]" : "text-[var(--a-ink-faint)]"}`}
                            >
                              {cmd.shortcut}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {filteredCommands.length === 0 && (
                  <div className="text-[var(--a-ink-faint)] text-[13px] py-4 px-2">
                    No commands found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Picker Modal */}
      {themePickerOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setThemePickerOpen(false)}
          />
          <div className="relative w-full max-w-[420px] bg-[var(--a-surface)] border border-[var(--a-rule)] shadow-xl font-mono text-[13px] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--a-rule)]">
              <span className="text-[var(--a-ink)] font-medium">Themes</span>
              <span className="text-[var(--a-ink-faint)]">esc</span>
            </div>
            <div className="px-3 pt-2">
              <input
                ref={themeInputRef}
                type="text"
                value={themeSearch}
                onChange={(e) => setThemeSearch(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent outline-none text-[var(--a-ink)] text-[13px] caret-[var(--a-ink)]"
              />
            </div>
            <div className="px-3 pb-3 pt-2 max-h-[340px] overflow-y-auto">
              {filteredThemes.length === 0 && (
                <div className="text-[var(--a-ink-faint)] text-[13px] py-2">No themes found.</div>
              )}
              {filteredThemes.map((name, i) => {
                const isActive = i === themeActiveIndex
                const isCurrent = name === agenticTheme
                return (
                  <div
                    key={name}
                    className={`flex items-center gap-2 px-2 py-1 cursor-pointer ${
                      isActive
                        ? "bg-[var(--a-accent-blue)] text-[var(--a-surface)]"
                        : "text-[var(--a-ink)] hover:bg-[var(--a-rule)]"
                    }`}
                    onMouseEnter={() => setThemeActiveIndex(i)}
                    onClick={() => {
                      setAgenticTheme(name)
                      setThemePickerOpen(false)
                    }}
                  >
                    <span className="text-[12px]">{isCurrent ? "●" : ""}</span>
                    <span className="text-[13px]">{name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Model Picker Modal */}
      {modelPickerOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModelPickerOpen(false)}
          />
          <div className="relative w-full max-w-[480px] bg-[var(--a-surface)] border border-[var(--a-rule)] shadow-xl font-mono text-[13px] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--a-rule)]">
              <span className="text-[var(--a-ink)] font-medium">
                Switch Model
              </span>
              <span className="text-[var(--a-ink-faint)]">esc</span>
            </div>
            <div className="p-2 flex flex-col gap-[2px] max-h-[350px] overflow-y-auto">
              {AGENTIC_MODELS.map((m, i) => {
                const isActive = i === selectedModelIdx;
                return (
                  <div
                    key={m.slug}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm ${
                      isActive
                        ? "bg-[var(--a-accent-blue)] text-[var(--a-surface)]"
                        : "text-[var(--a-ink)] hover:bg-[var(--a-rule)]"
                    }`}
                    onClick={() => {
                      setSelectedModelIdx(i);
                      setModelPickerOpen(false);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-medium ${isActive ? "text-[var(--a-surface)]" : ""}`}
                      >
                        {m.name}
                      </span>
                      <span
                        className={`text-[12px] ${isActive ? "text-[var(--a-surface)]/70" : "text-[var(--a-ink-faint)]"}`}
                      >
                        {m.vendor}
                      </span>
                    </div>
                    {isActive && (
                      <span className="text-[var(--a-surface)]">●</span>
                    )}
                    {!isActive && m.thinkingLevel && (
                      <span className="text-[11px] text-[var(--a-ink-faint)]">
                        {m.thinkingLevel}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Session History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setHistoryOpen(false)}
          />
          <div className="relative w-full max-w-[480px] bg-[var(--a-surface)] border border-[var(--a-rule)] shadow-xl font-mono text-[13px] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--a-rule)]">
              <span className="text-[var(--a-ink)] font-medium">
                Session History
              </span>
              <span className="text-[var(--a-ink-faint)]">esc</span>
            </div>
            <div className="p-2 flex flex-col gap-[2px] max-h-[350px] overflow-y-auto">
              {sessionHistory.length === 0 ? (
                <div className="text-[var(--a-ink-faint)] text-[13px] py-4 px-2">
                  No sessions viewed yet.
                </div>
              ) : (
                sessionHistory.map((entry) => (
                  <div
                    key={`${entry.modelSlug}-${entry.timestamp}`}
                    className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm text-[var(--a-ink)] hover:bg-[var(--a-rule)]"
                    onClick={() => {
                      const idx = AGENTIC_MODELS.findIndex(
                        (m) => m.slug === entry.modelSlug,
                      );
                      if (idx >= 0) setSelectedModelIdx(idx);
                      setHistoryOpen(false);
                      setViewingSession(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{entry.modelName}</span>
                      <span className="text-[12px] text-[var(--a-ink-faint)]">
                        {entry.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--a-ink-faint)] shrink-0">
                      {new Date(entry.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Center Content - non-scrollable */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6">
        <div className="w-full max-w-[640px] flex flex-col font-mono text-[13px]">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <AgenticModeLogo className="w-[420px] h-auto" aria-hidden />
          </div>

          {/* Autocomplete List */}
          {filteredSuggestions.length > 0 && (
            <div className="flex flex-col border border-[var(--a-rule)] bg-[var(--a-surface)] shadow-xl">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--a-rule)]">
                <span className="text-[11px] text-[var(--a-ink-faint)] font-mono">
                  Commands
                </span>
                <span className="text-[11px] text-[var(--a-ink-faint)] font-mono">
                  ↵ execute · tab complete
                </span>
              </div>
              {filteredSuggestions.map((s, i) => {
                const isActive = i === activeSuggestion;
                return (
                  <div
                    key={s.cmd}
                    className={`flex items-center justify-between px-3 py-1.5 cursor-pointer ${
                      isActive
                        ? "bg-[var(--a-accent-blue)] text-[var(--a-surface)]"
                        : "text-[var(--a-ink)] hover:bg-[var(--a-rule)]"
                    }`}
                    onMouseEnter={() => setActiveSuggestion(i)}
                    onClick={() => {
                      s.action();
                      setCommand("");
                      setCloseSuggestions(true);
                      setTimeout(() => setCloseSuggestions(false), 0);
                      inputRef.current?.focus();
                    }}
                  >
                    <span
                      className={`font-mono text-[13px] ${isActive ? "font-medium" : ""}`}
                    >
                      {s.cmd}
                    </span>
                    <span
                      className={`font-mono text-[11px] ${isActive ? "" : "text-[var(--a-ink-faint)]"}`}
                    >
                      {s.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Input Box with Block Caret */}
          <div className="flex flex-col border-l-2 border-[var(--a-accent)] bg-[var(--a-surface)] mt-[1px] py-2.5 px-3 relative">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleCommandSubmit}
                onSelect={updateCursor}
                onClick={updateCursor}
                onKeyUp={updateCursor}
                className="block-caret-input bg-transparent outline-none text-transparent w-full"
                autoComplete="off"
                spellCheck="false"
                autoFocus
                style={{ caretColor: "transparent" }}
              />
              <div
                className="absolute inset-0 flex items-center pointer-events-none"
                aria-hidden
              >
                {inputText.length === 0 ? (
                  <span className="block-caret-placeholder">
                    Type a message or "/" for commands...
                  </span>
                ) : (
                  <>
                    <span className="whitespace-pre text-[var(--a-ink)]">
                      {beforeCursor}
                    </span>
                    <span className="block-caret-cursor whitespace-pre">
                      {atCursor}
                    </span>
                    <span className="whitespace-pre text-[var(--a-ink)]">
                      {afterCursor}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2.5 text-[var(--a-ink-soft)] text-[12px]">
              <span className="text-[var(--a-accent)]">Current</span>
              <span>·</span>
              <span className="text-[var(--a-ink)]">{currentModel.name}</span>
              <span>·</span>
              <span className="text-[var(--a-ink-faint)]">
                {currentModel.vendor}
              </span>
              {currentModel.thinkingLevel && (
                <>
                  <span>·</span>
                  <span className="text-[var(--a-accent-orange)]">
                    {currentModel.thinkingLevel} thinking
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Key hints */}
          <div className="flex justify-end gap-4 mt-3 text-[12px] text-[var(--a-ink-faint)]">
            <span>
              <strong className="text-[var(--a-ink)] font-normal">tab</strong>{" "}
              agents
            </span>
            <button
              className="hover:text-[var(--a-ink)] transition-colors"
              onClick={() => setIsPaletteOpen(true)}
            >
              <strong className="text-[var(--a-ink)] font-normal">
                ctrl+p
              </strong>{" "}
              commands
            </button>
          </div>

          {/* Tip / View session */}
          <div className="mt-10 text-[12px] text-[var(--a-ink-faint)] text-center">
            {chatLog ? (
              <button
                onClick={() => {
                  if (chatLog)
                    recordSessionView(
                      chatLog,
                      currentModel.slug,
                      currentModel.name,
                    );
                  setViewingSession(true);
                }}
                className="hover:text-[var(--a-ink)] transition-colors"
              >
                <span className="text-[var(--a-accent)]">● Session</span> View
                agentic chat log for{" "}
                <span className="text-[var(--a-ink)]">{currentModel.name}</span>
              </button>
            ) : (
              <span>
                <span className="text-[var(--a-accent-orange)]">● Tip</span> Set{" "}
                <span className="text-[var(--a-ink)]">"mcp_*"</span>:{" "}
                <strong className="text-[var(--a-ink)] font-normal">
                  false
                </strong>{" "}
                to disable all tools from an MCP server
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
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
