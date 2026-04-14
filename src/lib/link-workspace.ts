import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import type { Actor } from "@/lib/rbac";
import type { CreateLinkPayload, LinkRow } from "@/types/link";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function ensureSlug(input?: string): string {
  if (!input || input.trim().length === 0) return nanoid(6).toLowerCase();
  return input.trim().toLowerCase();
}

export async function getOrCreateOwnerUserId(): Promise<string> {
  const firstUser = await prisma.user.findFirst({ select: { id: true } });
  if (firstUser) return firstUser.id;

  const created = await prisma.user.create({
    data: {
      email: "admin@thinksmartins.local",
      fullName: "Quản trị viên Thinksmart",
      passwordHash: hashPassword("thinksmart-admin"),
      role: "ADMIN",
    },
    select: { id: true },
  });

  return created.id;
}

export async function resolvePrimaryDomainHost(): Promise<string> {
  const primary = await prisma.domain.findFirst({ where: { isPrimary: true }, select: { hostname: true } });
  if (primary) return primary.hostname;

  const anyDomain = await prisma.domain.findFirst({ select: { hostname: true } });
  if (anyDomain) return anyDomain.hostname;

  const created = await prisma.domain.create({
    data: {
      hostname: "s.thinksmartins.com",
      isPrimary: true,
      dnsStatus: "ACTIVE",
      sslStatus: "ACTIVE",
      mainPageUrl: "https://thinksmartins.com",
      notFoundUrl: "https://thinksmartins.com/404",
    },
    select: { hostname: true },
  });

  return created.hostname;
}

export async function listLinks(actor?: Actor): Promise<LinkRow[]> {
  const activeActor = actor ?? { userId: "", role: "ADMIN", email: "" };
  const links = await prisma.link.findMany({
    where: {
      deletedAt: null,
      status: { not: "DELETED" },
      ...(activeActor.role === "MEMBER" ? { ownerId: activeActor.userId } : {}),
    },
    select: {
      id: true,
      slug: true,
      shortUrl: true,
      originalUrl: true,
      metaTitle: true,
      totalClicks: true,
      createdAt: true,
      owner: {
        select: {
          fullName: true,
          avatarUrl: true,
        },
      },
      folder: {
        select: {
          name: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return links.map((item) => ({
    id: item.id,
    ownerName: item.owner.fullName,
    ownerAvatarUrl: item.owner.avatarUrl,
    shortUrl: item.shortUrl,
    slug: item.slug,
    originalUrl: item.originalUrl,
    metaTitle: item.metaTitle,
    totalClicks: Number(item.totalClicks),
    tags: item.tags.map((tag) => tag.tag.name),
    folderName: item.folder?.name ?? null,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function createLink(payload: CreateLinkPayload & { actor?: Actor }): Promise<LinkRow> {
  const ownerId =
    payload.actor && payload.actor.role === "MEMBER"
      ? payload.actor.userId
      : await getOrCreateOwnerUserId();
  const host = await resolvePrimaryDomainHost();
  const domain = await prisma.domain.findFirstOrThrow({ where: { hostname: host }, select: { id: true, hostname: true } });

  const slug = ensureSlug(payload.customSlug);
  const shortUrl = `https://${domain.hostname}/${slug}`;

  const folder = payload.folderName
    ? await prisma.folder.upsert({
        where: {
          ownerId_name: {
            ownerId,
            name: payload.folderName.trim(),
          },
        },
        create: {
          ownerId,
          name: payload.folderName.trim(),
        },
        update: {},
      })
    : null;

  const created = await prisma.link.create({
    data: {
      domainId: domain.id,
      ownerId,
      folderId: folder?.id,
      slug,
      shortUrl,
      originalUrl: payload.originalUrl,
      metaTitle: payload.metaTitle ?? null,
      utmSource: payload.utmSource?.trim() || null,
      utmMedium: payload.utmMedium?.trim() || null,
      utmCampaign: payload.utmCampaign?.trim() || null,
      passwordHash: payload.password ? hashPassword(payload.password) : null,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      clickLimit: payload.clickLimit ?? null,
      tags: payload.tags && payload.tags.length > 0
        ? {
            create: payload.tags
              .map(normalizeTag)
              .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index)
              .map((name) => ({
                tag: {
                  connectOrCreate: {
                    where: { name },
                    create: { name },
                  },
                },
              })),
          }
        : undefined,
    },
    include: {
      owner: { select: { fullName: true, avatarUrl: true } },
      folder: { select: { name: true } },
      tags: { select: { tag: { select: { name: true } } } },
    },
  });

  return {
    id: created.id,
    ownerName: created.owner.fullName,
    ownerAvatarUrl: created.owner.avatarUrl,
    shortUrl: created.shortUrl,
    slug: created.slug,
    originalUrl: created.originalUrl,
    metaTitle: created.metaTitle,
    totalClicks: Number(created.totalClicks),
    tags: created.tags.map((item) => item.tag.name),
    folderName: created.folder?.name ?? null,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function softDeleteLink(id: string): Promise<void> {
  await prisma.link.update({
    where: { id },
    data: {
      status: "DELETED",
      deletedAt: new Date(),
    },
  });
}

export async function updateLink(id: string, input: { originalUrl?: string; metaTitle?: string }): Promise<void> {
  await prisma.link.update({
    where: { id },
    data: {
      originalUrl: input.originalUrl,
      metaTitle: input.metaTitle,
    },
  });
}
