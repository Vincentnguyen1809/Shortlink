export type LinkRow = {
  id: string;
  ownerName: string;
  ownerAvatarUrl: string | null;
  shortUrl: string;
  slug: string;
  originalUrl: string;
  metaTitle: string | null;
  totalClicks: number;
  tags: string[];
  folderName: string | null;
  createdAt: string;
};

export type CreateLinkPayload = {
  originalUrl: string;
  metaTitle?: string;
  customSlug?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  tags?: string[];
  folderName?: string;
  password?: string;
  expiresAt?: string;
  clickLimit?: number;
};
