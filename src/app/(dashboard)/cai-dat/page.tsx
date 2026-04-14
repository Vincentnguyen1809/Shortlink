import { OrganizationSettings } from "@/components/settings/organization-settings";
import { getOrganizationSettings } from "@/lib/org-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage(): Promise<JSX.Element> {
  const data = await getOrganizationSettings();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Cài đặt nội bộ tổ chức</h1>
        <p className="mt-1 text-sm text-slate-400">RBAC, IP Exclusion, destination allowlist và global tracking scripts.</p>
      </header>

      <OrganizationSettings initialData={data} />
    </main>
  );
}
