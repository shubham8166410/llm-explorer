import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LLMOutputItem } from "@/lib/types";

export const AVAILABLE_MODELS = [
  { id: "claude-haiku-4-5", label: "Claude Haiku (Fast)" },
  { id: "claude-sonnet-4-5", label: "Claude Sonnet (Balanced)" },
] as const;

export type ModelId = (typeof AVAILABLE_MODELS)[number]["id"];

const SYSTEM_PROMPT = `You are a structured content generator. When given a user prompt, you generate a list of 4-8 well-structured items relevant to the request.

You MUST respond with valid JSON only — no markdown, no explanation, just the JSON array.

Each item must have:
- title: string (short, 3-8 words)
- description: string (2-4 sentences explaining the item)
- tags: string[] (2-4 relevant tags)

Example response format:
[
  {
    "title": "Example Item Title",
    "description": "This is a description of the item. It explains what this item is about in a few sentences.",
    "tags": ["tag1", "tag2", "tag3"]
  }
]

Generate items that are diverse, actionable, and directly relevant to the user's prompt.`;

/**
 * Extracts a JSON array from a string that may contain markdown fences,
 * preamble text, or trailing commentary.
 * Strategy: find first '[' and last ']', parse that substring.
 */
function extractJsonArray(text: string): unknown[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");

  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `LLM response did not contain a JSON array.\nRaw response:\n${text.slice(0, 500)}`
    );
  }

  const candidate = text.slice(start, end + 1);

  try {
    const parsed = JSON.parse(candidate);
    if (!Array.isArray(parsed)) throw new Error("Parsed value is not an array");
    return parsed;
  } catch (e) {
    throw new Error(
      `Failed to parse JSON array from LLM response.\nExtracted:\n${candidate.slice(0, 500)}\nParse error: ${e instanceof Error ? e.message : e}`
    );
  }
}

export async function generateItems(
  prompt: string,
  model: string = "claude-haiku-4-5",
  temperature: number = 0.7
): Promise<LLMOutputItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const anthropic = createAnthropic({ apiKey });

  const { text } = await generateText({
    model: anthropic(model as ModelId),
    system: SYSTEM_PROMPT,
    prompt,
    maxOutputTokens: 2048,
    temperature,
  });

  const parsed = extractJsonArray(text);

  if (parsed.length === 0) throw new Error("LLM returned an empty array");

  return parsed.map((item: unknown, i: number) => {
    const obj = item as Record<string, unknown>;
    if (!obj.title || !obj.description) {
      throw new Error(`Item at index ${i} is missing required fields`);
    }
    return {
      title: String(obj.title),
      description: String(obj.description),
      tags: Array.isArray(obj.tags) ? (obj.tags as unknown[]).map(String) : [],
    };
  });
}
