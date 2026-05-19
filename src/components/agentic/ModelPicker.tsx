/**
 * ModelPicker — session/agent switcher modal for the Agentic V2 UI.
 *
 * Lists all registered agentic models. The active row is driven externally
 * so the parent keydown handler controls ArrowUp/Down/Enter.
 */

import type { AgenticModel } from "../../lib/agenticChats";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  models: AgenticModel[];
  activeIndex: number;
  selectedModelIdx: number;
  onActiveIndexChange: (i: number) => void;
  onSelect: (idx: number) => void;
};

export function ModelPicker({
  isOpen, onClose,
  models, activeIndex, selectedModelIdx,
  onActiveIndexChange, onSelect,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-[var(--a-surface)] border border-[var(--a-rule)] shadow-xl font-mono text-[13px] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--a-rule)]">
          <span className="text-[var(--a-ink)] font-medium">Switch Model</span>
          <span className="text-[var(--a-ink-faint)]">esc</span>
        </div>
        <div className="p-2 flex flex-col gap-[2px] max-h-[350px] overflow-y-auto">
          {models.map((m, i) => {
            const isActive = i === activeIndex;
            const isSelected = i === selectedModelIdx;
            return (
              <div
                key={m.slug}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer rounded-sm ${isActive ? "bg-[var(--a-accent-blue)] text-[var(--a-surface)]" : "text-[var(--a-ink)] hover:bg-[var(--a-rule)]"}`}
                onMouseEnter={() => onActiveIndexChange(i)}
                onClick={() => { onSelect(i); onClose(); }}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${isActive ? "text-[var(--a-surface)]" : ""}`}>{m.name}</span>
                  <span className={`text-[12px] ${isActive ? "text-[var(--a-surface)]/70" : "text-[var(--a-ink-faint)]"}`}>{m.vendor}</span>
                </div>
                {isSelected && <span className={isActive ? "text-[var(--a-surface)]" : "text-[var(--a-accent)]"}>●</span>}
                {!isSelected && m.thinkingLevel && (
                  <span className="text-[11px] text-[var(--a-ink-faint)]">{m.thinkingLevel}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
