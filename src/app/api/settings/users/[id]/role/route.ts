import { NextResponse } from "next/server";
import { z } from "zod";
import { updateUserRole } from "@/lib/org-settings";
import { resolveActorFromRequest } from "@/lib/rbac";

const schema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const actor = await resolveActorFromRequest(request);
  const { id } = await context.params;
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Role không hợp lệ." }, { status: 400 });
  }

  try {
    const data = await updateUserRole(actor, id, parsed.data.role);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Bạn không có quyền Admin." }, { status: 403 });
    }

    return NextResponse.json({ success: false, message: "Không thể cập nhật role." }, { status: 500 });
  }
}
