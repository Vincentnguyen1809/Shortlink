import { NextResponse } from "next/server";
import { z } from "zod";
import { addIpExclusion, removeIpExclusion } from "@/lib/org-settings";
import { resolveActorFromRequest } from "@/lib/rbac";

const createSchema = z.object({
  ipAddress: z.string().min(7).max(45),
  note: z.string().max(200).optional(),
});

const deleteSchema = z.object({
  id: z.string().cuid(),
});

export async function POST(request: Request): Promise<Response> {
  const actor = await resolveActorFromRequest(request);
  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "IP không hợp lệ." }, { status: 400 });
  }

  try {
    const data = await addIpExclusion(actor, parsed.data.ipAddress, parsed.data.note);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Bạn không có quyền Admin." }, { status: 403 });
    }

    return NextResponse.json({ success: false, message: "Không thể thêm IP loại trừ." }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const actor = await resolveActorFromRequest(request);
  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dữ liệu xóa không hợp lệ." }, { status: 400 });
  }

  try {
    const data = await removeIpExclusion(actor, parsed.data.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Bạn không có quyền Admin." }, { status: 403 });
    }

    return NextResponse.json({ success: false, message: "Không thể xóa IP loại trừ." }, { status: 500 });
  }
}
