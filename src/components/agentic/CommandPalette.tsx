/**
 * CommandPalette — Ctrl+P overlay for the Agentic V2 UI.
 *
 * Displays a searchable list of commands grouped by category.
 * Keyboard navigation (ArrowUp/Down/Enter/Escape) is driven by the parent
 * via activeIndex / onActiveIndexChange so the parent's single keydown
 * handler stays in control of focus across all modals.
 */

import { useEffect, useRef } from "react";
import type { Command } from "./types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  groupedCommands: Record<string, Command[]>;
  filteredCommands: Command[];
  activeIndex: number;
  onActiveIndexChange: (i: number) => void;
  onSelect: (cmd: Command) => void;
};

export function CommandPalette({
  isOpen, onClose,
  search, onSearchChange,
  groupedCommands, filteredCommands,
  activeIndex, onActiveIndexChange,
  onSelect,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 10);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[540px] bg-[var(--a-surface)] border border-[var(--a-rule)] shadow-xl font-mono text-[13px] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--a-rule)]">
          <span className="text-[var(--a-ink)] font-medium">Commands</span>
          <span className="text-[var(--a-ink-faint)]">esc</span>
        </div>
        <div className="p-2 pb-3">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent outline-none text-[var(--a-ink)] px-2 py-1 mb-2 caret-[var(--a-ink)]"
          />
          <div className="max-h-[350px] overflow-y-auto">
            {Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-2">
                <div className="text-[var(--a-accent-orange)] text-[12px] font-semibold px-2 py-1">{category}</div>
                <div className="flex flex-col gap-[2px]">
                  {cmds.map((cmd) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const isActive = globalIndex === activeIndex;
                    return (
                      <div
                        key={cmd.id}
                        className={`flex items-center justify-between px-2 py-1 cursor-pointer ${isActive ? "bg-[var(--a-accent-blue)] text-[var(--a-surface)]" : "text-[var(--a-ink)] hover:bg-[var(--a-rule)]"}`}
                        onClick={() => { onSelect(cmd); onClose(); }}
                        onMouseEnter={() => onActiveIndexChange(globalIndex)}
                      >
                        <span>{cmd.label}</span>
                        <span className={`text-[12px] ${isActive ? "text-[var(--a-surface)]" : "text-[var(--a-ink-faint)]"}`}>{cmd.shortcut}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredCommands.length === 0 && (
              <div className="text-[var(--a-ink-faint)] text-[13px] py-4 px-2">No commands found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
