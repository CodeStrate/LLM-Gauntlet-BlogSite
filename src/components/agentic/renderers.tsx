/**
 * Chat rendering primitives for the Agentic V2 session viewer.
 *
 * ContentRenderer  — renders assistant prose that may contain fenced code blocks.
 * ToolOutputViewer — renders a single tool call (bash, write, edit, or generic).
 *
 * All components are styled purely through the --a-* CSS variables set by the
 * active AgenticTheme on the root element, so they work in any theme without
 * per-component changes.
 */

import { Highlight, themes } from "prism-react-renderer";
import type { ToolCall } from "../../lib/agenticChats";

// ---------------------------------------------------------------------------
// Language helpers
// ---------------------------------------------------------------------------

/** Maps a file extension to a Prism language identifier. */
export function langFromPath(filePath?: string): string {
  const ext = filePath?.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "py":                    return "python";
    case "sh": case "bash":       return "bash";
    case "json":                  return "json";
    case "ts": case "tsx":        return "tsx";
    case "js": case "jsx":        return "jsx";
    case "yaml": case "yml":      return "yaml";
    case "md":                    return "markdown";
    case "css":                   return "css";
    case "toml": case "ini": case "cfg": return "markup";
    default:                      return "bash";
  }
}

/** Maps a fenced-code-block language tag to a Prism language identifier. */
function fenceToLang(raw: string): string {
  switch (raw.toLowerCase()) {
    case "py":    return "python";
    case "sh":    return "bash";
    case "toml": case "ini": case "cfg":
    case "text": case "txt": case "": return "markup";
    default: return raw || "markup";
  }
}

// ---------------------------------------------------------------------------
// Tool title formatter
// ---------------------------------------------------------------------------

export function getToolTitle(tc: ToolCall): string {
  if (tc.tool.includes("bash")) {
    const m = tc.input?.match(/"command"\s*:\s*"([^"]+)"/);
    return m ? m[1] : "bash";
  }
  const fileMatch = tc.input?.match(/"filePath"\s*:\s*"([^"]+)"/);
  if (fileMatch) {
    const f = fileMatch[1].split("/").pop();
    if (tc.tool.includes("edit"))  return `← Patched ${f}`;
    if (tc.tool.includes("write")) return `← Wrote ${f}`;
    if (tc.tool.includes("read"))  return `← Read ${f}`;
  }
  return `← ${tc.tool}`;
}

// ---------------------------------------------------------------------------
// ContentRenderer
// Renders assistant message content that may contain fenced code blocks.
// Plain prose segments are whitespace-pre-wrap; code blocks get syntax
// highlighting via prism-react-renderer.
// ---------------------------------------------------------------------------

export function ContentRenderer({ content }: { content: string }) {
  const segments = content.split(/(```[\w]*\n[\s\S]*?```)/g);
  return (
    <div className="leading-relaxed text-[var(--a-ink)]">
      {segments.map((seg, i) => {
        const m = seg.match(/^```([\w]*)\n([\s\S]*?)```$/);
        if (!m) return <span key={i} className="whitespace-pre-wrap">{seg}</span>;
        const lang = fenceToLang(m[1]);
        const code = m[2].replace(/\n$/, "");
        return (
          <Highlight key={i} theme={themes.oneDark} code={code} language={lang}>
            {({ tokens, getTokenProps }) => (
              <pre className="p-3 bg-[var(--a-surface)] border border-[var(--a-rule)] rounded-[2px] overflow-x-auto font-mono text-[11px] leading-relaxed my-2">
                {tokens.map((line, li) => (
                  <div key={li}>
                    {line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditDiffViewer
// Side-by-side before/after view for edit tool calls.
// Changed lines are highlighted; unchanged lines dimmed.
// ---------------------------------------------------------------------------

function computeDiff(oldStr: string, newStr: string) {
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");
  let prefix = 0;
  while (prefix < oldLines.length && prefix < newLines.length && oldLines[prefix] === newLines[prefix]) prefix++;
  let suffix = 0;
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) suffix++;
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

// ---------------------------------------------------------------------------
// ToolOutputViewer
// Renders a single tool call. Three display modes:
//   edit  → side-by-side diff (EditDiffViewer)
//   write → full file with green addition gutter
//   *     → plain text output/input box
// ---------------------------------------------------------------------------

export function ToolOutputViewer({ tc }: { tc: ToolCall }) {
  let parsedInput: any = null;
  if (tc.input) {
    try { parsedInput = JSON.parse(tc.input); } catch { /* ignore */ }
  }

  if (tc.tool.includes("edit") && parsedInput?.oldString && parsedInput?.newString) {
    return (
      <div className="flex flex-col gap-0 text-[12px]">
        <div className="text-[var(--a-ink-faint)] mb-1">{getToolTitle(tc)}</div>
        <EditDiffViewer oldStr={parsedInput.oldString} newStr={parsedInput.newString} filePath={parsedInput.filePath} />
        {tc.output && <OutputBox>{tc.output}</OutputBox>}
      </div>
    );
  }

  if (tc.tool.includes("write") && typeof parsedInput?.content === "string") {
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
        {tc.output && <OutputBox>{tc.output}</OutputBox>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 text-[12px]">
      <div className="text-[var(--a-ink-faint)] mb-1">{getToolTitle(tc)}</div>
      <div className="p-3 bg-[var(--a-surface)] border border-[var(--a-rule)] rounded-[2px] text-[var(--a-ink-soft)] whitespace-pre-wrap overflow-x-auto max-h-[300px] overflow-y-auto font-mono text-[11px] leading-relaxed">
        {tc.output || tc.input || "(no output)"}
      </div>
    </div>
  );
}

function OutputBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 p-2 bg-[var(--a-surface)] border border-[var(--a-rule)] rounded-[2px] text-[var(--a-ink-soft)] whitespace-pre-wrap overflow-x-auto max-h-[150px] overflow-y-auto font-mono text-[11px] leading-relaxed">
      {children}
    </div>
  );
}
