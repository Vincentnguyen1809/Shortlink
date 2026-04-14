import { NextResponse } from "next/server";
import { z } from "zod";
import { updateDomain } from "@/lib/domain-workspace";

const updateSchema = z.object({
  mainPageUrl: z.string().url().optional().or(z.literal("")),
  mainPageRedirect: z.enum(["PERMANENT_301", "TEMPORARY_302"]).optional(),
  notFoundUrl: z.string().url().optional().or(z.literal("")),
  notFoundRedirect: z.enum(["PERMANENT_301", "TEMPORARY_302"]).optional(),
  dnsStatus: z.enum(["PENDING", "ACTIVE", "FAILED"]).optional(),
  sslStatus: z.enum(["PENDING", "ACTIVE", "FAILED"]).optional(),
  isPrimary: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
  }

  const updated = await updateDomain(id, {
    mainPageUrl: parsed.data.mainPageUrl === "" ? null : parsed.data.mainPageUrl,
    mainPageRedirect: parsed.data.mainPageRedirect,
    notFoundUrl: parsed.data.notFoundUrl === "" ? null : parsed.data.notFoundUrl,
    notFoundRedirect: parsed.data.notFoundRedirect,
    dnsStatus: parsed.data.dnsStatus,
    sslStatus: parsed.data.sslStatus,
    isPrimary: parsed.data.isPrimary,
  });

  return NextResponse.json({ success: true, data: updated });
}
