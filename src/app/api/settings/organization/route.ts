import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationSettings, updateOrganizationSettings } from "@/lib/org-settings";
import { resolveActorFromRequest } from "@/lib/rbac";

const updateSchema = z.object({
  organizationName: z.string().min(2).max(120).optional(),
  ga4MeasurementId: z.string().max(100).optional().or(z.literal("")),
  metaPixelId: z.string().max(100).optional().or(z.literal("")),
  webhookUrl: z.string().url().optional().or(z.literal("")),
  destinationAllowlist: z.array(z.string()).optional(),
});

export async function GET(): Promise<Response> {
  const data = await getOrganizationSettings();
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: Request): Promise<Response> {
  const actor = await resolveActorFromRequest(request);
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dữ liệu cài đặt không hợp lệ." }, { status: 400 });
  }

  try {
    const data = await updateOrganizationSettings(actor, {
      organizationName: parsed.data.organizationName,
      ga4MeasurementId: parsed.data.ga4MeasurementId === "" ? null : parsed.data.ga4MeasurementId,
      metaPixelId: parsed.data.metaPixelId === "" ? null : parsed.data.metaPixelId,
      webhookUrl: parsed.data.webhookUrl === "" ? null : parsed.data.webhookUrl,
      destinationAllowlist: parsed.data.destinationAllowlist?.map((item) => item.toLowerCase().trim()).filter(Boolean),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Bạn không có quyền Admin." }, { status: 403 });
    }

    return NextResponse.json({ success: false, message: "Cập nhật cài đặt thất bại." }, { status: 500 });
  }
}
