export type DailyClickPoint = {
  date: string;
  total: number;
  unique: number;
};

export type TopLinkPoint = {
  slug: string;
  shortUrl: string;
  totalClicks: number;
};

export type DistributionPoint = {
  name: string;
  value: number;
};

export type UTMPoint = {
  source: string;
  medium: string;
  campaign: string;
  total: number;
};

export type ClickStreamRow = {
  id: string;
  clickedAt: string;
  ip: string;
  country: string;
  city: string;
  referrer: string;
  browser: string;
  os: string;
  slug: string;
};

export type DashboardAnalytics = {
  totalClicks: number;
  uniqueClicks: number;
  averageResponseMs: number;
  excludedClicks: number;
  trend: DailyClickPoint[];
  topLinks: TopLinkPoint[];
  topCountries: DistributionPoint[];
  topBrowsers: DistributionPoint[];
  topOs: DistributionPoint[];
  topReferrers: DistributionPoint[];
  utmBreakdown: UTMPoint[];
  clickStream: ClickStreamRow[];
};
