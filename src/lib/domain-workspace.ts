import { prisma } from "@/lib/prisma";
import type { DomainRow, RedirectMode } from "@/types/domain";

export async function listDomains(): Promise<DomainRow[]> {
  const domains = await prisma.domain.findMany({
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });

  return domains.map((item) => ({
    id: item.id,
    hostname: item.hostname,
    dnsStatus: item.dnsStatus,
    sslStatus: item.sslStatus,
    mainPageUrl: item.mainPageUrl,
    mainPageRedirect: item.mainPageRedirect,
    notFoundUrl: item.notFoundUrl,
    notFoundRedirect: item.notFoundRedirect,
    isPrimary: item.isPrimary,
  }));
}

type CreateDomainInput = {
  hostname: string;
  isPrimary?: boolean;
  mainPageUrl?: string;
  mainPageRedirect?: RedirectMode;
  notFoundUrl?: string;
  notFoundRedirect?: RedirectMode;
};

export async function createDomain(input: CreateDomainInput): Promise<DomainRow> {
  if (input.isPrimary) {
    await prisma.domain.updateMany({
      where: { isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const created = await prisma.domain.create({
    data: {
      hostname: input.hostname.toLowerCase(),
      isPrimary: Boolean(input.isPrimary),
      dnsStatus: "PENDING",
      sslStatus: "PENDING",
      mainPageUrl: input.mainPageUrl ?? null,
      mainPageRedirect: input.mainPageRedirect ?? "TEMPORARY_302",
      notFoundUrl: input.notFoundUrl ?? null,
      notFoundRedirect: input.notFoundRedirect ?? "TEMPORARY_302",
    },
  });

  return {
    id: created.id,
    hostname: created.hostname,
    dnsStatus: created.dnsStatus,
    sslStatus: created.sslStatus,
    mainPageUrl: created.mainPageUrl,
    mainPageRedirect: created.mainPageRedirect,
    notFoundUrl: created.notFoundUrl,
    notFoundRedirect: created.notFoundRedirect,
    isPrimary: created.isPrimary,
  };
}

type UpdateDomainInput = {
  mainPageUrl?: string | null;
  mainPageRedirect?: RedirectMode;
  notFoundUrl?: string | null;
  notFoundRedirect?: RedirectMode;
  dnsStatus?: "PENDING" | "ACTIVE" | "FAILED";
  sslStatus?: "PENDING" | "ACTIVE" | "FAILED";
  isPrimary?: boolean;
};

export async function updateDomain(id: string, input: UpdateDomainInput): Promise<DomainRow> {
  if (input.isPrimary) {
    await prisma.domain.updateMany({
      where: { id: { not: id }, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const updated = await prisma.domain.update({
    where: { id },
    data: {
      mainPageUrl: input.mainPageUrl,
      mainPageRedirect: input.mainPageRedirect,
      notFoundUrl: input.notFoundUrl,
      notFoundRedirect: input.notFoundRedirect,
      dnsStatus: input.dnsStatus,
      sslStatus: input.sslStatus,
      isPrimary: input.isPrimary,
    },
  });

  return {
    id: updated.id,
    hostname: updated.hostname,
    dnsStatus: updated.dnsStatus,
    sslStatus: updated.sslStatus,
    mainPageUrl: updated.mainPageUrl,
    mainPageRedirect: updated.mainPageRedirect,
    notFoundUrl: updated.notFoundUrl,
    notFoundRedirect: updated.notFoundRedirect,
    isPrimary: updated.isPrimary,
  };
}
