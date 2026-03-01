import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { promptSessions, generations, generatedItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [session] = await db
      .select()
      .from(promptSessions)
      .where(eq(promptSessions.id, id));

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const gens = await db
      .select()
      .from(generations)
      .where(eq(generations.sessionId, id))
      .orderBy(desc(generations.createdAt));

    const generationsWithItems = await Promise.all(
      gens.map(async (gen) => {
        const items = await db
          .select()
          .from(generatedItems)
          .where(eq(generatedItems.generationId, gen.id));

        return {
          ...gen,
          items: items.map((item) => ({
            ...item,
            tags: JSON.parse(item.tags || "[]"),
          })),
        };
      })
    );

    return NextResponse.json({ ...session, generations: generationsWithItems });
  } catch (error) {
    console.error("GET /api/sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(promptSessions).where(eq(promptSessions.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
