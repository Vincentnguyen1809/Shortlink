import { prisma } from "@/lib/prisma";

function redirectStatusFromType(type: "PERMANENT_301" | "TEMPORARY_302"): 301 | 302 {
  return type === "PERMANENT_301" ? 301 : 302;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ domain: string }> },
): Promise<Response> {
  const { domain } = await context.params;

  const domainRow = await prisma.domain.findUnique({
    where: { hostname: domain },
    select: {
      mainPageUrl: true,
      mainPageRedirect: true,
      notFoundUrl: true,
      notFoundRedirect: true,
    },
  });

  if (!domainRow) {
    return Response.json({ success: false, message: "Domain không tồn tại." }, { status: 404 });
  }

  if (domainRow.mainPageUrl) {
    return Response.redirect(domainRow.mainPageUrl, redirectStatusFromType(domainRow.mainPageRedirect));
  }

  if (domainRow.notFoundUrl) {
    return Response.redirect(domainRow.notFoundUrl, redirectStatusFromType(domainRow.notFoundRedirect));
  }

  return Response.json({ success: false, message: "Domain chưa cấu hình trang mặc định." }, { status: 404 });
}
