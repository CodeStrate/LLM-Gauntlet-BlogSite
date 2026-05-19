/**
 * SessionView — full-screen OpenCode-style chat log viewer.
 *
 * Layout: two-panel (chat area | right sidebar).
 *
 * Left panel   — scrollable message list + fake "waiting" input + status bar.
 * Right sidebar — session metadata: task title, context tokens, MCP status,
 *                 modified files list, message/tool-call counts.
 *
 * The CommandPalette is rendered here as well, since it's accessible from
 * inside the session view via Ctrl+P or slash commands on the input textbox.
 *
 * Future: when the SLM is deployed, the fake input becomes a real prompt
 * box and the session becomes interactive.
 */

import type { AgenticChatLog, AgenticModel } from "../../lib/agenticChats";
import type { AgenticTheme } from "../../lib/agenticThemes";
import type { Command } from "./types";
import { ContentRenderer, ToolOutputViewer } from "./renderers";
import { CommandPalette } from "./CommandPalette";

type Props = {
  chatLog: AgenticChatLog;
  currentModel: AgenticModel;
  themeVars: AgenticTheme;
  modifiedFiles: { name: string; added: number; removed: number }[];
  approxTokens: number;
  compactionIdx: number;
  onClose: () => void;
  // Command palette — driven by parent keyboard handler
  isPaletteOpen: boolean;
  onPaletteOpen: (open: boolean) => void;
  paletteSearch: string;
  onPaletteSearchChange: (v: string) => void;
  groupedCommands: Record<string, Command[]>;
  filteredCommands: Command[];
  paletteActiveIndex: number;
  onPaletteActiveIndexChange: (i: number) => void;
  onCommandSelect: (cmd: Command) => void;
};

export function SessionView({
  chatLog,
  currentModel,
  themeVars,
  modifiedFiles,
  approxTokens,
  compactionIdx,
  onClose,
  isPaletteOpen,
  onPaletteOpen,
  paletteSearch,
  onPaletteSearchChange,
  groupedCommands,
  filteredCommands,
  paletteActiveIndex,
  onPaletteActiveIndexChange,
  onCommandSelect,
}: Props) {
  return (
    <div
      style={themeVars as React.CSSProperties}
      className="fixed inset-0 z-[100] bg-[var(--a-bg)] text-[var(--a-ink)] flex flex-row font-mono overflow-hidden"
    >
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => onPaletteOpen(false)}
        search={paletteSearch}
        onSearchChange={onPaletteSearchChange}
        groupedCommands={groupedCommands}
        filteredCommands={filteredCommands}
        activeIndex={paletteActiveIndex}
        onActiveIndexChange={onPaletteActiveIndexChange}
        onSelect={onCommandSelect}
      />

      {/* ── Left: chat area ── */}
      <div className="flex-1 flex flex-col bg-[var(--a-bg)] overflow-hidden">
        {/* Message list */}
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
              }

              return (
                <div
                  key={i}
                  className="flex flex-col gap-4 text-[13px] text-[var(--a-ink)]"
                >
                  {msg.thinking && (
                    <div className="text-[var(--a-ink-soft)] whitespace-pre-wrap leading-relaxed">
                      <span className="text-[var(--a-accent-orange)] italic">
                        Thinking:
                      </span>{" "}
                      <span className="italic">{msg.thinking}</span>
                    </div>
                  )}

                  {msg.toolCalls.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {msg.toolCalls.map((tc, j) => (
                        <ToolOutputViewer key={j} tc={tc} />
                      ))}
                    </div>
                  )}

                  {msg.content && <ContentRenderer content={msg.content} />}

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
            })}
          </div>
        </div>

        {/* Fake "waiting" input — becomes real when the SLM is deployed */}
        <div className="shrink-0 border-t border-[var(--a-rule)] bg-[var(--a-bg)] px-6 py-3">
          <div className="max-w-[800px] mx-auto pl-4 border-l-2 border-[var(--a-accent-blue)]">
            <div className="w-2.5 h-[1.2em] bg-[var(--a-ink)] animate-pulse" />
            <div className="flex items-center gap-2 mt-2 text-[12px] text-[var(--a-ink-faint)]">
              <span>Build</span>
              <span>·</span>
              <span className="text-[var(--a-ink)]">{currentModel.name}</span>
              <span>·</span>
              <span className="text-[var(--a-accent-orange)]">
                {currentModel.thinkingLevel || "high"}
              </span>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="shrink-0 h-8 border-t border-[var(--a-rule)] bg-[var(--a-bg)] flex items-center justify-between px-4 text-[11px] text-[var(--a-ink-faint)] w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
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

      {/* ── Right: metadata sidebar ── */}
      <div className="w-[300px] pb-8 shrink-0 border-l border-[var(--a-rule)] bg-[var(--a-bg)] p-5 flex flex-col gap-5 overflow-y-auto hidden lg:flex text-[12px]">
        <div>
          <h3 className="font-bold text-[var(--a-ink)] text-[13px] leading-snug">
            {chatLog.title}
          </h3>
        </div>

        <SidebarSection label="Context">
          {compactionIdx >= 0 ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--a-accent-orange)]">◆</span>
                <span>Compacted</span>
                <span className="text-[var(--a-ink-faint)] mx-0.5">·</span>
                <span className="text-[var(--a-ink-faint)] text-[11px]">
                  {compactionIdx} msgs before
                </span>
              </div>
              <div>
                {approxTokens.toLocaleString()} tokens (post-compaction)
              </div>
            </>
          ) : (
            <div>
              {approxTokens.toLocaleString()} tokens
              <span className="text-[var(--a-ink-faint)] mx-1">·</span>~
              {Math.min(100, Math.round((approxTokens / 32000) * 100))}% used
            </div>
          )}
          <div className="text-[var(--a-ink-faint)]">
            $0.00 (local inference)
          </div>
        </SidebarSection>

        <SidebarSection label="MCP">
          {chatLog.messages.some((m) =>
            m.toolCalls.some((tc) => tc.tool.includes("obsidian")),
          ) ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--a-accent-green)] text-[10px]">
                ●
              </span>
              <span className="text-[var(--a-ink-faint)]">
                obsidian Connected
              </span>
            </div>
          ) : (
            <div className="text-[var(--a-ink-faint)]">No MCP tools used</div>
          )}
        </SidebarSection>

        <SidebarSection label="LSP">
          <div className="text-[var(--a-ink-faint)]">
            LSPs will activate as files are read
          </div>
        </SidebarSection>

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
                  <span className="truncate text-[var(--a-ink-faint)] group-hover:text-[var(--a-ink)] transition-colors">
                    {f.name}
                  </span>
                  <span className="shrink-0 flex items-center gap-1 text-[11px]">
                    {f.added > 0 && (
                      <span className="text-[#86e296]">+{f.added}</span>
                    )}
                    {f.removed > 0 && (
                      <span className="text-[#ff8b8b]">-{f.removed}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-[var(--a-rule)] text-[var(--a-ink-faint)] flex flex-col gap-0.5">
          <div>{chatLog.messages.length} messages</div>
          <div>
            {chatLog.messages.reduce((acc, m) => acc + m.toolCalls.length, 0)}{" "}
            tool calls
          </div>
          {chatLog.created && (
            <div>Started: {chatLog.created.split(",")[0]}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-bold text-[var(--a-ink)] mb-1.5">{label}</div>
      <div className="text-[var(--a-ink-faint)] flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  );
}
