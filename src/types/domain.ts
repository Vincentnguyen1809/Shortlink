export type RedirectMode = "PERMANENT_301" | "TEMPORARY_302";

export type DomainRow = {
  id: string;
  hostname: string;
  dnsStatus: "PENDING" | "ACTIVE" | "FAILED";
  sslStatus: "PENDING" | "ACTIVE" | "FAILED";
  mainPageUrl: string | null;
  mainPageRedirect: RedirectMode;
  notFoundUrl: string | null;
  notFoundRedirect: RedirectMode;
  isPrimary: boolean;
};
