/** Shared types for the Agentic V2 UI. */

export type Command = {
  id: string;
  label: string;
  category: string;
  shortcut: string;
  action: () => void;
};

export type HistoryEntry = {
  modelName: string;
  modelSlug: string;
  title: string;
  timestamp: number;
};
