import { NextRequest, NextResponse } from "next/server";
import * as bkend from "@/lib/bkend";
import { invalidateCache } from "@/lib/terminology";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.term && !body.aliases && !body.category && !body.description) {
      return NextResponse.json(
        { error: "수정할 내용이 없습니다." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.term !== undefined) updateData.term = body.term;
    if (body.aliases !== undefined) updateData.aliases = body.aliases;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;

    const updated = await bkend.updateTerm(id, updateData);
    invalidateCache();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("terms PUT error:", error);
    return NextResponse.json(
      { error: "용어 수정 실패" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await bkend.deleteTerm(id);
    invalidateCache();

    return NextResponse.json({ message: "삭제되었습니다." });
  } catch (error) {
    console.error("terms DELETE error:", error);
    return NextResponse.json(
      { error: "용어 삭제 실패" },
      { status: 500 }
    );
  }
}
