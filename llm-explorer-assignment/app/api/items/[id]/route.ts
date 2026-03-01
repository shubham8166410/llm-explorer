import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { generatedItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Partial<{
      title: string;
      description: string;
      tags: string;
      editedAt: Date;
    }> = {
      editedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = String(body.title);
    if (body.description !== undefined)
      updateData.description = String(body.description);
    if (body.tags !== undefined)
      updateData.tags = JSON.stringify(
        Array.isArray(body.tags) ? body.tags : []
      );

    await db
      .update(generatedItems)
      .set(updateData)
      .where(eq(generatedItems.id, id));

    const [updated] = await db
      .select()
      .from(generatedItems)
      .where(eq(generatedItems.id, id));

    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...updated,
      tags: JSON.parse(updated.tags || "[]"),
    });
  } catch (error) {
    console.error("PATCH /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete — keeps the record for historical integrity
    await db
      .update(generatedItems)
      .set({ status: "deleted" })
      .where(eq(generatedItems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/items/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
