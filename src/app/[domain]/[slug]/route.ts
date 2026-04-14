import { createHash, timingSafeEqual } from "node:crypto";
import type { DeviceType, Prisma } from "@prisma/client";
import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";
import { getOrganizationSettings } from "@/lib/org-settings";
import { prisma } from "@/lib/prisma";
import { ensureRedisConnected, redis } from "@/lib/redis";

export const runtime = "nodejs";

const CACHE_TTL_SECONDS = 300;

type CachedLinkPayload = {
  id: string;
  slug: string;
  domainId: string;
  originalUrl: string;
  passwordHash: string | null;
  isCloakingEnabled: boolean;
  cloakedUrl: string | null;
  expiresAt: string | null;
  clickLimit: number | null;
  totalClicks: number;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  ownerId: string;
  rules: Array<{
    id: string;
    priority: number;
    countryCode: string | null;
    cityName: string | null;
    deviceType: DeviceType | null;
    targetUrl: string;
    isActive: boolean;
  }>;
  abVariants: Array<{
    id: string;
    targetUrl: string;
    trafficWeight: number;
    isActive: boolean;
  }>;
};

function normalizeDevice(userAgent: string): DeviceType {
  const parser = new UAParser(userAgent);
  const os = parser.getOS().name?.toLowerCase() ?? "";
  const deviceType = parser.getDevice().type;

  if (os.includes("ios")) return "IOS";
  if (os.includes("android")) return "ANDROID";
  if (deviceType === "tablet") return "TABLET";
  if (deviceType === "mobile") return "OTHER";

  return "DESKTOP";
}

function resolveGeo(ip: string, request: Request): { countryCode: string | null; cityName: string | null } {
  const countryFromEdge = request.headers.get("x-vercel-ip-country");
  const cityFromEdge = request.headers.get("x-vercel-ip-city");

  if (countryFromEdge || cityFromEdge) {
    return {
      countryCode: countryFromEdge?.toUpperCase() ?? null,
      cityName: cityFromEdge ?? null,
    };
  }

  const lookup = geoip.lookup(ip);
  return {
    countryCode: lookup?.country?.toUpperCase() ?? null,
    cityName: lookup?.city ?? null,
  };
}

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function passwordMatches(input: string | null, storedHash: string | null): boolean {
  if (!storedHash) return true;
  if (!input) return false;

  const encodedInput = Buffer.from(sha256(input));
  const encodedStoredHash = Buffer.from(storedHash);
  if (encodedInput.length !== encodedStoredHash.length) return false;

  return timingSafeEqual(encodedInput, encodedStoredHash);
}

function chooseAbTarget(
  variants: CachedLinkPayload["abVariants"],
  fallbackUrl: string,
): { destinationUrl: string; matchedVariantId: string | null } {
  const activeVariants = variants.filter((item) => item.isActive && item.trafficWeight > 0);
  if (activeVariants.length === 0) {
    return { destinationUrl: fallbackUrl, matchedVariantId: null };
  }

  const totalWeight = activeVariants.reduce((acc, item) => acc + item.trafficWeight, 0);
  const random = Math.random() * totalWeight;
  let rollingWeight = 0;

  for (const variant of activeVariants) {
    rollingWeight += variant.trafficWeight;
    if (random <= rollingWeight) {
      return { destinationUrl: variant.targetUrl, matchedVariantId: variant.id };
    }
  }

  return {
    destinationUrl: activeVariants[0]?.targetUrl ?? fallbackUrl,
    matchedVariantId: activeVariants[0]?.id ?? null,
  };
}

function chooseRuleTarget(
  rules: CachedLinkPayload["rules"],
  countryCode: string | null,
  cityName: string | null,
  deviceType: DeviceType,
): { destinationUrl: string | null; matchedRuleId: string | null } {
  const activeRules = [...rules].filter((rule) => rule.isActive).sort((a, b) => a.priority - b.priority);

  for (const rule of activeRules) {
    const countryMatch = !rule.countryCode || rule.countryCode.toUpperCase() === (countryCode ?? "").toUpperCase();
    const cityMatch = !rule.cityName || rule.cityName.toLowerCase() === (cityName ?? "").toLowerCase();
    const deviceMatch = !rule.deviceType || rule.deviceType === deviceType;

    if (countryMatch && cityMatch && deviceMatch) {
      return { destinationUrl: rule.targetUrl, matchedRuleId: rule.id };
    }
  }

  return { destinationUrl: null, matchedRuleId: null };
}

function cacheKey(domain: string, slug: string): string {
  return `redirect:v1:${domain.toLowerCase()}:${slug.toLowerCase()}`;
}

function redirectStatusFromType(type: "PERMANENT_301" | "TEMPORARY_302"): 301 | 302 {
  return type === "PERMANENT_301" ? 301 : 302;
}

async function domainFallbackRedirect(domain: string): Promise<Response> {
  const domainRow = await prisma.domain.findUnique({
    where: { hostname: domain },
    select: {
      notFoundUrl: true,
      notFoundRedirect: true,
    },
  });

  if (domainRow?.notFoundUrl) {
    return Response.redirect(domainRow.notFoundUrl, redirectStatusFromType(domainRow.notFoundRedirect));
  }

  return Response.json({ success: false, message: "Không tìm thấy liên kết rút gọn." }, { status: 404 });
}

function cloakingHtml(input: {
  destinationUrl: string;
  ga4MeasurementId: string | null;
  metaPixelId: string | null;
}): string {
  const { destinationUrl, ga4MeasurementId, metaPixelId } = input;

  const ga4Script = ga4MeasurementId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}"></script>
       <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4MeasurementId}');</script>`
    : "";
  const pixelScript = metaPixelId
    ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');</script>`
    : "";

  return `<!doctype html>
  <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Đang chuyển hướng...</title>
      ${ga4Script}
      ${pixelScript}
      <style>html,body,iframe{margin:0;padding:0;width:100%;height:100%;background:#020617;color:#e2e8f0;font-family:ui-sans-serif,system-ui;} .loading{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:2;background:#020617}</style>
    </head>
    <body>
      <div class="loading">Đang tải trang đích...</div>
      <iframe src="${destinationUrl}" frameborder="0" referrerpolicy="no-referrer-when-downgrade"></iframe>
      <script>window.addEventListener('load',()=>{const el=document.querySelector('.loading');if(el)el.remove();});</script>
    </body>
  </html>`;
}

async function loadLink(domain: string, slug: string): Promise<CachedLinkPayload | null> {
  const key = cacheKey(domain, slug);

  try {
    await ensureRedisConnected();
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as CachedLinkPayload;
    }
  } catch {
    // Intentionally fallback to DB without failing redirect.
  }

  const dbLink = await prisma.link.findFirst({
    where: {
      slug,
      status: "ACTIVE",
      domain: { hostname: domain },
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
      domainId: true,
      originalUrl: true,
      passwordHash: true,
      isCloakingEnabled: true,
      cloakedUrl: true,
      expiresAt: true,
      clickLimit: true,
      totalClicks: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      ownerId: true,
      rules: {
        select: {
          id: true,
          priority: true,
          countryCode: true,
          cityName: true,
          deviceType: true,
          targetUrl: true,
          isActive: true,
        },
      },
      abVariants: {
        select: {
          id: true,
          targetUrl: true,
          trafficWeight: true,
          isActive: true,
        },
      },
    },
  });

  if (!dbLink) return null;

  const payload: CachedLinkPayload = {
    ...dbLink,
    expiresAt: dbLink.expiresAt?.toISOString() ?? null,
    totalClicks: Number(dbLink.totalClicks),
  };

  try {
    await ensureRedisConnected();
    await redis.setex(key, CACHE_TTL_SECONDS, JSON.stringify(payload));
  } catch {
    // Intentionally ignore cache write failure.
  }

  return payload;
}

async function isIpExcluded(ip: string): Promise<boolean> {
  const exclusions = await prisma.ipExclusion.findMany({
    select: { ipAddress: true },
  });

  return exclusions.some((entry) => entry.ipAddress === ip);
}

function extractClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() ?? "0.0.0.0";
  }

  return request.headers.get("x-real-ip") ?? "0.0.0.0";
}

function withUtm(url: string, link: CachedLinkPayload): string {
  const parsed = new URL(url);

  if (link.utmSource) parsed.searchParams.set("utm_source", link.utmSource);
  if (link.utmMedium) parsed.searchParams.set("utm_medium", link.utmMedium);
  if (link.utmCampaign) parsed.searchParams.set("utm_campaign", link.utmCampaign);

  return parsed.toString();
}

async function persistAnalytics(input: {
  link: CachedLinkPayload;
  request: Request;
  destinationUrl: string;
  responseTimeMs: number;
  matchedRuleId: string | null;
  matchedVariantId: string | null;
}): Promise<void> {
  const { link, request, destinationUrl, responseTimeMs, matchedRuleId, matchedVariantId } = input;
  const userAgent = request.headers.get("user-agent") ?? "";
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser().name ?? null;
  const os = parser.getOS().name ?? null;
  const device = normalizeDevice(userAgent);
  const ip = extractClientIp(request);
  const geo = resolveGeo(ip, request);
  const referrer = request.headers.get("referer") ?? request.headers.get("referrer") ?? null;
  let referrerHost: string | null = null;
  if (referrer) {
    try {
      referrerHost = new URL(referrer).hostname;
    } catch {
      referrerHost = null;
    }
  }
  const ipHash = sha256(ip);

  const url = new URL(request.url);
  const cookieVisitor = request.headers.get("cookie")?.match(/visitor_id=([^;]+)/)?.[1] ?? null;
  const uniqueSignature = cookieVisitor ? `${ipHash}:${cookieVisitor}` : ipHash;
  const uniquenessKey = `unique:v1:${link.id}:${uniqueSignature}`;

  let unique = false;

  try {
    await ensureRedisConnected();
    const setResult = await redis.set(uniquenessKey, "1", "EX", 60 * 60 * 24, "NX");
    unique = setResult === "OK";
  } catch {
    unique = false;
  }

  const excludedByIpRule = await isIpExcluded(ip);

  const clickData: Prisma.ClickCreateInput = {
    clickedAt: new Date(),
    visitorIp: ip,
    ipHash,
    userAgent,
    browser,
    os,
    device,
    countryCode: geo.countryCode,
    city: geo.cityName,
    referrer,
    refererHost: referrerHost,
    utmSource: url.searchParams.get("utm_source") ?? link.utmSource,
    utmMedium: url.searchParams.get("utm_medium") ?? link.utmMedium,
    utmCampaign: url.searchParams.get("utm_campaign") ?? link.utmCampaign,
    isUnique: unique,
    excludedByIpRule,
    responseTimeMs,
    link: {
      connect: { id: link.id },
    },
  };

  await prisma.$transaction([
    prisma.click.create({ data: clickData }),
    prisma.link.update({
      where: { id: link.id },
      data: {
        totalClicks: excludedByIpRule ? undefined : { increment: 1 },
        uniqueClicks: excludedByIpRule || !unique ? undefined : { increment: 1 },
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: link.ownerId,
        action: "REDIRECT",
        entityType: "Link",
        entityId: link.id,
        message: `Redirected to ${destinationUrl}`,
        metadata: {
          matchedRuleId,
          matchedVariantId,
        },
      },
    }),
  ]);
}

function passwordResponse(): Response {
  return new Response(
    JSON.stringify({
      success: false,
      message: "Liên kết này được bảo vệ bằng mật khẩu. Vui lòng cung cấp ?password=...",
    }),
    {
      status: 401,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ domain: string; slug: string }> },
): Promise<Response> {
  const startedAt = Date.now();
  const { domain, slug } = await context.params;

  const link = await loadLink(domain, slug);
  if (!link) {
    return domainFallbackRedirect(domain);
  }

  const now = new Date();
  if (link.expiresAt && new Date(link.expiresAt) <= now) {
    return Response.json({ success: false, message: "Liên kết đã hết hạn." }, { status: 410 });
  }

  if (typeof link.clickLimit === "number" && link.totalClicks >= link.clickLimit) {
    return Response.json({ success: false, message: "Liên kết đã vượt quá giới hạn lượt nhấp." }, { status: 410 });
  }

  const passwordInput = new URL(request.url).searchParams.get("password");
  if (!passwordMatches(passwordInput, link.passwordHash)) {
    return passwordResponse();
  }

  const ip = extractClientIp(request);
  const ua = request.headers.get("user-agent") ?? "";
  const geo = resolveGeo(ip, request);
  const deviceType = normalizeDevice(ua);

  const ruleChoice = chooseRuleTarget(link.rules, geo.countryCode, geo.cityName, deviceType);
  const abChoice = chooseAbTarget(link.abVariants, link.originalUrl);

  const selectedDestination = ruleChoice.destinationUrl ?? abChoice.destinationUrl;
  const destinationUrl = withUtm(selectedDestination, link);

  const response = Response.redirect(destinationUrl, 302);
  const responseTimeMs = Date.now() - startedAt;

  void persistAnalytics({
    link,
    request,
    destinationUrl,
    responseTimeMs,
    matchedRuleId: ruleChoice.matchedRuleId,
    matchedVariantId: abChoice.matchedVariantId,
  });

  if (link.isCloakingEnabled) {
    const settings = await getOrganizationSettings();
    return new Response(
      cloakingHtml({
        destinationUrl,
        ga4MeasurementId: settings.ga4MeasurementId,
        metaPixelId: settings.metaPixelId,
      }),
      {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }

  return response;
}
