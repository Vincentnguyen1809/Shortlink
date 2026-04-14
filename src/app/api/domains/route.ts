import { NextResponse } from "next/server";
import { z } from "zod";
import { createDomain, listDomains } from "@/lib/domain-workspace";

const createSchema = z.object({
  hostname: z
    .string()
    .min(3)
    .max(253)
    .regex(/^[a-zA-Z0-9.-]+$/, "Hostname không hợp lệ"),
  isPrimary: z.boolean().optional(),
  mainPageUrl: z.string().url().optional().or(z.literal("")),
  mainPageRedirect: z.enum(["PERMANENT_301", "TEMPORARY_302"]).optional(),
  notFoundUrl: z.string().url().optional().or(z.literal("")),
  notFoundRedirect: z.enum(["PERMANENT_301", "TEMPORARY_302"]).optional(),
});

export async function GET(): Promise<Response> {
  const data = await listDomains();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Dữ liệu domain không hợp lệ." }, { status: 400 });
  }

  const created = await createDomain({
    hostname: parsed.data.hostname,
    isPrimary: parsed.data.isPrimary,
    mainPageUrl: parsed.data.mainPageUrl || undefined,
    mainPageRedirect: parsed.data.mainPageRedirect,
    notFoundUrl: parsed.data.notFoundUrl || undefined,
    notFoundRedirect: parsed.data.notFoundRedirect,
  });

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
