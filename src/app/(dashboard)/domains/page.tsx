import { DomainManagement } from "@/components/domains/domain-management";
import { listDomains } from "@/lib/domain-workspace";

export const dynamic = "force-dynamic";

export default async function DomainsPage(): Promise<JSX.Element> {
  const domains = await listDomains();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Quản lý domain trung chuyển</h1>
        <p className="mt-1 text-sm text-slate-400">Quản lý DNS/SSL, Main Page Redirect và 404 Redirect cho từng domain.</p>
      </header>

      <DomainManagement initialDomains={domains} />
    </main>
  );
}
