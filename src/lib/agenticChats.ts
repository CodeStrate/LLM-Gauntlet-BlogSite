export type ChatMessage = {
  role: "user" | "assistant";
  modelName?: string;
  duration?: string;
  content: string;
  toolCalls: ToolCall[];
  thinking?: string;
};

export type ToolCall = {
  tool: string;
  input?: string;
  output?: string;
};

export type AgenticChatLog = {
  title: string;
  sessionId: string;
  created: string;
  updated: string;
  messages: ChatMessage[];
  modelSlug: string;
};

function parseDuration(raw: string): string {
  const m = raw.match(/[\d.]+s/);
  return m ? m[0] : raw;
}

function cleanOutput(raw: string): string {
  // Strip shell metadata blocks
  let s = raw.replace(/<shell_metadata>[\s\S]*?<\/shell_metadata>/g, "").trim();

  // Collapse repeated line-groups (e.g. spammy EOF loops)
  const lines = s.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    // Try pattern lengths 1–6
    let collapsed = false;
    for (let len = 1; len <= 6 && i + len * 2 <= lines.length; len++) {
      const pat = lines.slice(i, i + len);
      let reps = 1;
      while (
        i + len * (reps + 1) <= lines.length &&
        lines.slice(i + len * reps, i + len * (reps + 1)).join("\n") ===
          pat.join("\n")
      )
        reps++;
      if (reps >= 3) {
        out.push(...pat);
        out.push(`... ×${reps} (truncated)`);
        i += len * reps;
        collapsed = true;
        break;
      }
    }
    if (!collapsed) out.push(lines[i++]);
  }
  return out.join("\n").trim();
}

function parseChatMarkdown(text: string, modelSlug: string): AgenticChatLog {
  const title = text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
  const sessionId = text.match(/\*\*Session ID:\*\*\s*(.+)/)?.[1]?.trim() ?? "";
  const created = text.match(/\*\*Created:\*\*\s*(.+)/)?.[1]?.trim() ?? "";
  const updated = text.match(/\*\*Updated:\*\*\s*(.+)/)?.[1]?.trim() ?? "";

  const blocks = text.split(/\n---\n+(?=## User|## Assistant)/);
  const messages: ChatMessage[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("# ") || trimmed === "#") continue;

    const userMatch = trimmed.match(/^## User(?:\s*\n([\s\S]*))?$/);
    if (userMatch) {
      messages.push({
        role: "user",
        content: userMatch[1] ? userMatch[1].trim() : "",
        toolCalls: [],
      });
      continue;
    }

    const asstMatch = trimmed.match(
      /^## Assistant\s*\((.*?)\)(?:\s*\n([\s\S]*))?$/,
    );
    if (!asstMatch) continue;

    const headerParts = asstMatch[1].split("·").map((s) => s.trim());
    const modelName = headerParts[0] ?? "";
    const duration =
      headerParts.length > 1 ? parseDuration(headerParts[1]) : "";

    let body = asstMatch[2] ? asstMatch[2].trim() : "";

    let thinking = "";
    const thinkMatch = body.match(
      /_Thinking:_\n\n([\s\S]*?)(?=\n\n\*\*Tool:|$)/,
    );
    if (thinkMatch) {
      thinking = thinkMatch[1].trim();
      body = body.replace(thinkMatch[0], "").trim();
    }

    const toolCalls: ToolCall[] = [];
    // Blank lines appear between **Tool:**, **Input:**, and **Output:** sections
    const toolRegex =
      /\*\*Tool:\s*(.+?)\*\*\n+\*\*Input:\*\*\s*```(?:json)?\s*\n([\s\S]*?)```\n+\*\*Output:\*\*\s*```[^\n]*\n([\s\S]*?)```/g;
    let toolMatch;
    while ((toolMatch = toolRegex.exec(body)) !== null) {
      toolCalls.push({
        tool: toolMatch[1].trim(),
        input: toolMatch[2].trim(),
        output: cleanOutput(toolMatch[3].trim()),
      });
    }

    // Prose is only text that appears before the first tool call block
    const firstTool = body.search(/\*\*Tool:/);
    const content = (firstTool >= 0 ? body.slice(0, firstTool) : body)
      .replace(/<\|channel>[\s\S]*?<channel\|>/g, "")
      .replace(/\d+-hour timer:.*/g, "")
      .trim()
      .replace(/\n{3,}/g, "\n\n");

    messages.push({
      role: "assistant",
      modelName,
      duration,
      content,
      toolCalls,
      thinking,
    });
  }

  return { title, sessionId, created, updated, messages, modelSlug };
}

import gemma4MoeRaw from "../content/agentic/gemma-4-moe-rag.md?raw";
import gemma4E4bRaw from "../content/agentic/gemma4-e4b-rag.md?raw";
import glmFlashRaw from "../content/agentic/glm-flash-rag.md?raw";
import qwen3CoderRaw from "../content/agentic/qwen3-coder-rag.md?raw";
import sushiCoderRaw from "../content/agentic/sushi-coder-rag.md?raw";
import gptossRaw from "../content/agentic/gpt-oss-rag.md?raw";

const RAW_CHATS: Record<string, string> = {
  "gemma-4-19b-reap": gemma4MoeRaw,
  "gemma-4-e4b": gemma4E4bRaw,
  "glm-4-7-flash-23b-reap": glmFlashRaw,
  "cerebras-qwen3-25b-reap": qwen3CoderRaw,
  "sushi-coder-9b": sushiCoderRaw,
  "gpt-oss-20b-medium": gptossRaw,
};

const parsedCache = new Map<string, AgenticChatLog>();

export function getAgenticChatLog(modelSlug: string): AgenticChatLog | null {
  if (parsedCache.has(modelSlug)) return parsedCache.get(modelSlug)!;

  const raw = RAW_CHATS[modelSlug];
  if (!raw) return null;

  const parsed = parseChatMarkdown(raw, modelSlug);
  parsedCache.set(modelSlug, parsed);
  return parsed;
}

export function hasAgenticChatLog(modelSlug: string): boolean {
  return modelSlug in RAW_CHATS;
}

export type AgenticModel = {
  slug: string;
  name: string;
  vendor: string;
  params: string;
  iconifyId: string;
  thinkingLevel?: string;
};

export const AGENTIC_MODELS: AgenticModel[] = [
  {
    slug: "gpt-oss-20b-medium",
    name: "GPT OSS 20B",
    vendor: "OpenAI",
    params: "20B A3.6B (MoE)",
    iconifyId: "simple-icons:openai",
    thinkingLevel: "medium",
  },
  {
    slug: "gemma-4-e4b",
    name: "Gemma 4 E4B",
    vendor: "Google",
    params: "4B active (MoE)",
    iconifyId: "simple-icons:googlegemini",
  },
  {
    slug: "gemma-4-19b-reap",
    name: "Gemma 4 19B",
    vendor: "Google",
    params: "19B A4B (REAP-pruned)",
    iconifyId: "simple-icons:googlegemini",
    thinkingLevel: "default",
  },
  {
    slug: "glm-4-7-flash-23b-reap",
    name: "GLM 4.7 Flash 23B",
    vendor: "Zhipu AI",
    params: "23B A3B (REAP-pruned)",
    iconifyId: "logos:zhipuai",
    thinkingLevel: "default",
  },
  {
    slug: "cerebras-qwen3-25b-reap",
    name: "Qwen3 Coder 25B",
    vendor: "Cerebras (Qwen)",
    params: "25B A3B (REAP-pruned)",
    iconifyId: "simple-icons:qwen",
  },
  {
    slug: "sushi-coder-9b",
    name: "Sushi Coder",
    vendor: "Alibaba (community)",
    params: "9B",
    iconifyId: "simple-icons:qwen",
    thinkingLevel: "default",
  },
  {
    slug: "devstral-small-2-2512",
    name: "Devstral Small 2",
    vendor: "Mistral AI",
    params: "24B",
    iconifyId: "simple-icons:mistral",
  },
] as const;
