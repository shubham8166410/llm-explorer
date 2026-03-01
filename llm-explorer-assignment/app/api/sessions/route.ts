import { NextResponse } from "next/server";
import { db, runMigrations } from "@/lib/db/client";
import { promptSessions, generations, generatedItems } from "@/lib/db/schema";
import { desc, eq, and, count } from "drizzle-orm";

runMigrations();

export async function GET() {
  try {
    const sessions = await db
      .select()
      .from(promptSessions)
      .orderBy(desc(promptSessions.updatedAt));

    const enriched = await Promise.all(
      sessions.map(async (session) => {
        const [latestGen] = await db
          .select()
          .from(generations)
          .where(eq(generations.sessionId, session.id))
          .orderBy(desc(generations.createdAt))
          .limit(1);

        if (!latestGen) return { ...session, latestGeneration: null };

        const [itemCountResult] = await db
          .select({ count: count() })
          .from(generatedItems)
          .where(
            and(
              eq(generatedItems.generationId, latestGen.id),
              eq(generatedItems.status, "active")
            )
          );

        return {
          ...session,
          latestGeneration: {
            ...latestGen,
            itemCount: itemCountResult?.count ?? 0,
          },
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }
}
