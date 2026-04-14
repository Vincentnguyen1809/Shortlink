import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import type {
  ClickStreamRow,
  DashboardAnalytics,
  DailyClickPoint,
  DistributionPoint,
  TopLinkPoint,
  UTMPoint,
} from "@/types/analytics";

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildDateSeries(days: number): string[] {
  const dates: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    dates.push(formatDateKey(subDays(new Date(), offset)));
  }
  return dates;
}

function safeName(value: string | null | undefined, fallback: string): string {
  if (!value || value.trim().length === 0) return fallback;
  return value;
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  const lookbackDays = 14;
  const fromDate = subDays(new Date(), lookbackDays - 1);

  const [
    summary,
    rawRecentClicks,
    rawTopLinks,
    groupedCountries,
    groupedBrowsers,
    groupedOs,
    groupedReferrers,
    groupedUtm,
    clickStreamRows,
  ] = await Promise.all([
    prisma.click.aggregate({
      where: { clickedAt: { gte: fromDate } },
      _count: { id: true },
      _avg: { responseTimeMs: true },
    }),
    prisma.click.findMany({
      where: { clickedAt: { gte: fromDate } },
      select: {
        clickedAt: true,
        isUnique: true,
        excludedByIpRule: true,
      },
      orderBy: { clickedAt: "asc" },
    }),
    prisma.link.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, shortUrl: true, totalClicks: true },
      orderBy: { totalClicks: "desc" },
      take: 8,
    }),
    prisma.click.groupBy({
      by: ["country"],
      where: { clickedAt: { gte: fromDate }, excludedByIpRule: false },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.click.groupBy({
      by: ["browser"],
      where: { clickedAt: { gte: fromDate }, excludedByIpRule: false },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.click.groupBy({
      by: ["os"],
      where: { clickedAt: { gte: fromDate }, excludedByIpRule: false },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.click.groupBy({
      by: ["refererHost"],
      where: { clickedAt: { gte: fromDate }, excludedByIpRule: false },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.click.groupBy({
      by: ["utmSource", "utmMedium", "utmCampaign"],
      where: { clickedAt: { gte: fromDate }, excludedByIpRule: false },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 12,
    }),
    prisma.click.findMany({
      where: { clickedAt: { gte: fromDate } },
      select: {
        id: true,
        clickedAt: true,
        visitorIp: true,
        country: true,
        city: true,
        referrer: true,
        browser: true,
        os: true,
        link: {
          select: {
            slug: true,
          },
        },
      },
      orderBy: { clickedAt: "desc" },
      take: 30,
    }),
  ]);

  const uniqueClicks = rawRecentClicks.filter((item) => item.isUnique && !item.excludedByIpRule).length;
  const excludedClicks = rawRecentClicks.filter((item) => item.excludedByIpRule).length;

  const dateSeries = buildDateSeries(lookbackDays);
  const trendMap = new Map<string, { total: number; unique: number }>();
  for (const date of dateSeries) {
    trendMap.set(date, { total: 0, unique: 0 });
  }

  for (const click of rawRecentClicks) {
    const key = formatDateKey(click.clickedAt);
    const point = trendMap.get(key);
    if (!point) continue;

    if (!click.excludedByIpRule) {
      point.total += 1;
      if (click.isUnique) point.unique += 1;
    }
  }

  const trend: DailyClickPoint[] = dateSeries.map((date) => ({
    date,
    total: trendMap.get(date)?.total ?? 0,
    unique: trendMap.get(date)?.unique ?? 0,
  }));

  const topLinks: TopLinkPoint[] = rawTopLinks.map((item) => ({
    slug: item.slug,
    shortUrl: item.shortUrl,
    totalClicks: Number(item.totalClicks),
  }));

  const topCountries: DistributionPoint[] = groupedCountries.map((item) => ({
    name: safeName(item.country, "Không rõ quốc gia"),
    value: item._count.id,
  }));

  const topBrowsers: DistributionPoint[] = groupedBrowsers.map((item) => ({
    name: safeName(item.browser, "Không rõ trình duyệt"),
    value: item._count.id,
  }));

  const topOs: DistributionPoint[] = groupedOs.map((item) => ({
    name: safeName(item.os, "Không rõ hệ điều hành"),
    value: item._count.id,
  }));

  const topReferrers: DistributionPoint[] = groupedReferrers.map((item) => ({
    name: safeName(item.refererHost, "Truy cập trực tiếp"),
    value: item._count.id,
  }));

  const utmBreakdown: UTMPoint[] = groupedUtm.map((item) => ({
    source: safeName(item.utmSource, "(trống)"),
    medium: safeName(item.utmMedium, "(trống)"),
    campaign: safeName(item.utmCampaign, "(trống)"),
    total: item._count.id,
  }));

  const clickStream: ClickStreamRow[] = clickStreamRows.map((item) => ({
    id: item.id,
    clickedAt: item.clickedAt.toISOString(),
    ip: item.visitorIp,
    country: safeName(item.country, "Không rõ"),
    city: safeName(item.city, "Không rõ"),
    referrer: safeName(item.referrer, "Trực tiếp"),
    browser: safeName(item.browser, "Không rõ"),
    os: safeName(item.os, "Không rõ"),
    slug: item.link.slug,
  }));

  return {
    totalClicks: summary._count.id,
    uniqueClicks,
    averageResponseMs: Number(summary._avg.responseTimeMs ?? 0),
    excludedClicks,
    trend,
    topLinks,
    topCountries,
    topBrowsers,
    topOs,
    topReferrers,
    utmBreakdown,
    clickStream,
  };
}
