import { prisma } from "@/lib/prisma";

export type Actor = {
  userId: string;
  role: "ADMIN" | "MEMBER";
  email: string;
};

async function bootstrapAdmin(): Promise<Actor> {
  const existing = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true, email: true, role: true } });
  if (existing) {
    return { userId: existing.id, role: existing.role, email: existing.email };
  }

  const created = await prisma.user.create({
    data: {
      email: "admin@thinksmartins.local",
      fullName: "Quản trị viên hệ thống",
      passwordHash: "bootstrap-admin",
      role: "ADMIN",
    },
    select: { id: true, email: true, role: true },
  });

  return { userId: created.id, role: created.role, email: created.email };
}

export async function resolveActorFromRequest(request: Request): Promise<Actor> {
  const email = request.headers.get("x-user-email");
  if (!email) {
    return bootstrapAdmin();
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    const created = await prisma.user.create({
      data: {
        email,
        fullName: email.split("@")[0] ?? "Thanh vien",
        passwordHash: "onboard-member",
        role: "MEMBER",
      },
      select: { id: true, email: true, role: true },
    });

    return { userId: created.id, role: created.role, email: created.email };
  }

  return { userId: user.id, role: user.role, email: user.email };
}

export function assertAdmin(actor: Actor): void {
  if (actor.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
}
