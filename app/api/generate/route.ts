import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import {
  promptSessions,
  generations,
  generatedItems,
} from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { generateItems } from "@/lib/llm";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, temperature, model } = body;
    let { sessionId } = body;

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const now = new Date();

    // ── Session creation (if no sessionId provided, create one atomically) ──
    // This prevents orphan sessions when generation fails.
    if (!sessionId) {
      const title =
        prompt.trim().length > 50
          ? prompt.trim().slice(0, 50) + "…"
          : prompt.trim();
      sessionId = nanoid();
      await db.insert(promptSessions).values({
        id: sessionId,
        title,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      // Verify existing session
      const [session] = await db
        .select()
        .from(promptSessions)
        .where(eq(promptSessions.id, sessionId));
      if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
    }

    const generationId = nanoid();

    // ── Lifecycle: supersede all previously active generations ──
    await db
      .update(generations)
      .set({ lifecycle: "superseded" })
      .where(
        and(
          eq(generations.sessionId, sessionId),
          ne(generations.lifecycle, "superseded")
        )
      );

    // Create generation in "running" state — this is what the UI polls or shows
    await db.insert(generations).values({
      id: generationId,
      sessionId,
      prompt: prompt.trim(),
      status: "running",
      lifecycle: "active",
      model: model ?? "claude-haiku-4-5",
      temperature: temperature ?? 0.7,
      createdAt: now,
    });

    // Update session updatedAt
    await db
      .update(promptSessions)
      .set({ updatedAt: now })
      .where(eq(promptSessions.id, sessionId));

    try {
      const items = await generateItems(
        prompt.trim(),
        model ?? "claude-haiku-4-5",
        temperature ?? 0.7
      );

      const itemRecords = items.map((item) => ({
        id: nanoid(),
        generationId,
        sessionId,
        title: item.title,
        description: item.description,
        tags: JSON.stringify(item.tags),
        status: "active" as const,
        createdAt: new Date(),
      }));

      if (itemRecords.length > 0) {
        await db.insert(generatedItems).values(itemRecords);
      }

      await db
        .update(generations)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(generations.id, generationId));

      return NextResponse.json({
        sessionId,
        generationId,
        itemCount: items.length,
        status: "completed",
      });
    } catch (llmError) {
      const errMsg =
        llmError instanceof Error ? llmError.message : "Unknown LLM error";
      await db
        .update(generations)
        .set({ status: "failed", errorMessage: errMsg, completedAt: new Date() })
        .where(eq(generations.id, generationId));

      return NextResponse.json(
        { error: "LLM generation failed", details: errMsg, sessionId, generationId },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("POST /api/generate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
