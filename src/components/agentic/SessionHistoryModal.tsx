/**
 * SessionHistoryModal — shows up to 50 recently viewed agentic sessions.
 *
 * Clicking an entry switches to that model and opens the session viewer.
 * Entries are stored in localStorage by the parent via saveHistory().
 */

import type { AgenticModel } from "../../lib/agenticChats";
import type { HistoryEntry } from "./types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  models: AgenticModel[];
  onSelectSession: (entry: HistoryEntry) => void;
};

export function SessionHistoryModal({
  isOpen,
  onClose,
  history,
  onSelectSession,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[480px] bg-[var(--a-surface)] border border-[var(--a-rule)] shadow-xl font-mono text-[13px] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--a-rule)]">
          <span className="text-[var(--a-ink)] font-medium">
            Session History
          </span>
          <span className="text-[var(--a-ink-faint)]">esc</span>
        </div>
        <div className="p-2 flex flex-col gap-[2px] max-h-[350px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-[var(--a-ink-faint)] text-[13px] py-4 px-2">
              No sessions viewed yet.
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={`${entry.modelSlug}-${entry.timestamp}`}
                className="flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm text-[var(--a-ink)] hover:bg-[var(--a-rule)]"
                onClick={() => {
                  onSelectSession(entry);
                  onClose();
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{entry.modelName}</span>
                  <span className="text-[12px] text-[var(--a-ink-faint)] truncate max-w-[200px]">
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
  );
}
