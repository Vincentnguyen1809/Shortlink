import Link from "next/link";
import { Plus } from "lucide-react";
import { LinksTable } from "@/components/links/links-table";
import { listLinks } from "@/lib/link-workspace";

export const dynamic = "force-dynamic";

export default async function LinksPage(): Promise<JSX.Element> {
  const data = await listLinks();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Quản lý link rút gọn</h1>
          <p className="text-sm text-slate-400">Theo dõi, quản trị và tối ưu tất cả short links nội bộ.</p>
        </div>
        <Link
          href="/links/tao-moi"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <Plus size={16} /> Tạo link mới
        </Link>
      </header>

      <LinksTable initialData={data} />
    </main>
  );
}
