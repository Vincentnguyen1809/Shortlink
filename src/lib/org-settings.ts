import { prisma } from "@/lib/prisma";
import type { Actor } from "@/lib/rbac";
import { assertAdmin } from "@/lib/rbac";
import type { OrganizationSettingsView, RoleRow } from "@/types/settings";

async function ensureSettingsRow(): Promise<string> {
  const existed = await prisma.organizationSetting.findFirst({ select: { id: true } });
  if (existed) return existed.id;

  const created = await prisma.organizationSetting.create({
    data: {
      organizationName: "Thinksmart Insurance",
      destinationAllowlist: ["thinksmartins.com"],
    },
    select: { id: true },
  });

  return created.id;
}

export async function getOrganizationSettings(): Promise<OrganizationSettingsView> {
  const settingId = await ensureSettingsRow();

  const [settings, roles] = await Promise.all([
    prisma.organizationSetting.findUniqueOrThrow({
      where: { id: settingId },
      include: {
        ipExclusions: {
          select: { id: true, ipAddress: true, note: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const mappedRoles: RoleRow[] = roles.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  }));

  return {
    id: settings.id,
    organizationName: settings.organizationName,
    ga4MeasurementId: settings.ga4MeasurementId,
    metaPixelId: settings.metaPixelId,
    webhookUrl: settings.webhookUrl,
    destinationAllowlist: settings.destinationAllowlist,
    ipExclusions: settings.ipExclusions,
    roles: mappedRoles,
  };
}

type UpdateSettingsInput = {
  organizationName?: string;
  ga4MeasurementId?: string | null;
  metaPixelId?: string | null;
  webhookUrl?: string | null;
  destinationAllowlist?: string[];
};

export async function updateOrganizationSettings(actor: Actor, input: UpdateSettingsInput): Promise<OrganizationSettingsView> {
  assertAdmin(actor);

  const settingId = await ensureSettingsRow();

  await prisma.organizationSetting.update({
    where: { id: settingId },
    data: {
      organizationName: input.organizationName,
      ga4MeasurementId: input.ga4MeasurementId,
      metaPixelId: input.metaPixelId,
      webhookUrl: input.webhookUrl,
      destinationAllowlist: input.destinationAllowlist,
      updatedByUserId: actor.userId,
    },
  });

  return getOrganizationSettings();
}

export async function addIpExclusion(actor: Actor, ipAddress: string, note?: string): Promise<OrganizationSettingsView> {
  assertAdmin(actor);

  const settingId = await ensureSettingsRow();

  await prisma.ipExclusion.upsert({
    where: {
      settingId_ipAddress: {
        settingId,
        ipAddress,
      },
    },
    update: {
      note: note ?? null,
    },
    create: {
      settingId,
      ipAddress,
      note: note ?? null,
    },
  });

  return getOrganizationSettings();
}

export async function removeIpExclusion(actor: Actor, id: string): Promise<OrganizationSettingsView> {
  assertAdmin(actor);

  await prisma.ipExclusion.delete({ where: { id } });
  return getOrganizationSettings();
}

export async function updateUserRole(actor: Actor, userId: string, role: "ADMIN" | "MEMBER"): Promise<OrganizationSettingsView> {
  assertAdmin(actor);

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return getOrganizationSettings();
}

export async function isDestinationAllowed(url: string): Promise<boolean> {
  const settingId = await ensureSettingsRow();
  const settings = await prisma.organizationSetting.findUniqueOrThrow({
    where: { id: settingId },
    select: { destinationAllowlist: true },
  });

  if (settings.destinationAllowlist.length === 0) return true;

  const host = new URL(url).hostname.toLowerCase();
  return settings.destinationAllowlist.some((domain) => {
    const normalized = domain.toLowerCase();
    return host === normalized || host.endsWith(`.${normalized}`);
  });
}
