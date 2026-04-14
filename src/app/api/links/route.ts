import { NextResponse } from "next/server";
import { z } from "zod";
import { createLink, listLinks } from "@/lib/link-workspace";
import { isDestinationAllowed } from "@/lib/org-settings";
import { resolveActorFromRequest } from "@/lib/rbac";

const createLinkSchema = z.object({
  originalUrl: z.string().url(),
  metaTitle: z.string().max(500).optional(),
  customSlug: z.string().min(3).max(64).regex(/^[a-zA-Z0-9-_]+$/).optional().or(z.literal("")),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(120).optional(),
  tags: z.array(z.string()).optional(),
  folderName: z.string().max(120).optional(),
  password: z.string().min(4).max(64).optional(),
  expiresAt: z.string().min(1).optional(),
  clickLimit: z.number().int().positive().max(100000000).optional(),
});

export async function GET(request: Request): Promise<Response> {
  const actor = await resolveActorFromRequest(request);
  const links = await listLinks(actor);
  return NextResponse.json({ success: true, data: links });
}

export async function POST(request: Request): Promise<Response> {
  const actor = await resolveActorFromRequest(request);
  const body = await request.json();
  const parsed = createLinkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Dữ liệu tạo link không hợp lệ.",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const allowed = await isDestinationAllowed(parsed.data.originalUrl);
  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "URL đích không nằm trong danh sách allowlist của tổ chức.",
      },
      { status: 403 },
    );
  }

  const link = await createLink({
    actor,
    ...parsed.data,
    customSlug: parsed.data.customSlug || undefined,
  });

  return NextResponse.json({ success: true, data: link }, { status: 201 });
}
