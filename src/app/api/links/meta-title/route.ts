import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  url: z.string().url(),
});

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? null;
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "URL không hợp lệ." }, { status: 400 });
  }

  try {
    const response = await fetch(parsed.data.url, {
      method: "GET",
      cache: "no-store",
      headers: {
        "user-agent": "ThinksmartShortlinkBot/1.0",
      },
    });

    const html = await response.text();
    const title = extractTitle(html);

    return NextResponse.json({ success: true, data: { title } });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể lấy tiêu đề trang đích.",
      },
      { status: 502 },
    );
  }
}
