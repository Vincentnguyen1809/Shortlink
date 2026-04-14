import { NextResponse } from "next/server";
import { z } from "zod";
import { softDeleteLink, updateLink } from "@/lib/link-workspace";
import { isDestinationAllowed } from "@/lib/org-settings";
import { prisma } from "@/lib/prisma";
import { resolveActorFromRequest } from "@/lib/rbac";

const updateSchema = z.object({
  originalUrl: z.string().url().optional(),
  metaTitle: z.string().max(500).optional(),
});

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const actor = await resolveActorFromRequest(request);
  const link = await prisma.link.findUnique({ where: { id }, select: { ownerId: true } });
  if (!link) return NextResponse.json({ success: false, message: "Không tìm thấy link." }, { status: 404 });
  if (actor.role === "MEMBER" && link.ownerId !== actor.userId) {
    return NextResponse.json({ success: false, message: "Không có quyền xóa link này." }, { status: 403 });
  }
  await softDeleteLink(id);
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const actor = await resolveActorFromRequest(request);
  const link = await prisma.link.findUnique({ where: { id }, select: { ownerId: true } });
  if (!link) return NextResponse.json({ success: false, message: "Không tìm thấy link." }, { status: 404 });
  if (actor.role === "MEMBER" && link.ownerId !== actor.userId) {
    return NextResponse.json({ success: false, message: "Không có quyền cập nhật link này." }, { status: 403 });
  }
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
  }

  if (parsed.data.originalUrl) {
    const allowed = await isDestinationAllowed(parsed.data.originalUrl);
    if (!allowed) {
      return NextResponse.json(
        { success: false, message: "URL đích không nằm trong allowlist của tổ chức." },
        { status: 403 },
      );
    }
  }

  await updateLink(id, parsed.data);
  return NextResponse.json({ success: true });
}
