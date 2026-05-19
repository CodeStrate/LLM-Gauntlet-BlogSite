/**
 * ThemePicker — searchable theme selector modal for the Agentic V2 UI.
 *
 * Receives the filtered theme list from the parent (so the parent's keydown
 * handler can drive ArrowUp/Down/Enter without duplicating logic here).
 */

import { useEffect, useRef } from "react";
import type { AgenticThemeKey } from "../../lib/agenticThemes";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  themes: AgenticThemeKey[];
  activeIndex: number;
  onActiveIndexChange: (i: number) => void;
  currentTheme: AgenticThemeKey;
  onSelect: (name: AgenticThemeKey) => void;
};

export function ThemePicker({
  isOpen, onClose,
  search, onSearchChange,
  themes, activeIndex, onActiveIndexChange,
  currentTheme, onSelect,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 10);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[420px] bg-[var(--a-surface)] border border-[var(--a-rule)] shadow-xl font-mono text-[13px] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--a-rule)]">
          <span className="text-[var(--a-ink)] font-medium">Themes</span>
          <span className="text-[var(--a-ink-faint)]">esc</span>
        </div>
        <div className="px-3 pt-2">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent outline-none text-[var(--a-ink)] text-[13px] caret-[var(--a-ink)]"
          />
        </div>
        <div className="px-3 pb-3 pt-2 max-h-[340px] overflow-y-auto">
          {themes.length === 0 && (
            <div className="text-[var(--a-ink-faint)] text-[13px] py-2">No themes found.</div>
          )}
          {themes.map((name, i) => {
            const isActive = i === activeIndex;
            return (
              <div
                key={name}
                className={`flex items-center gap-2 px-2 py-1 cursor-pointer ${isActive ? "bg-[var(--a-accent-blue)] text-[var(--a-surface)]" : "text-[var(--a-ink)] hover:bg-[var(--a-rule)]"}`}
                onMouseEnter={() => onActiveIndexChange(i)}
                onClick={() => { onSelect(name); onClose(); }}
              >
                <span className="text-[12px]">{name === currentTheme ? "●" : ""}</span>
                <span>{name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
