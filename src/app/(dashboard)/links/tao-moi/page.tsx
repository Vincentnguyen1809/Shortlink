import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateLinkForm } from "@/components/links/create-link-form";

export default function CreateLinkPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mb-5">
        <Link href="/links" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
          <ArrowLeft size={14} /> Quay về danh sách link
        </Link>

        <h1 className="text-2xl font-semibold">Tạo link rút gọn mới</h1>
        <p className="text-sm text-slate-400">Nhập URL gốc, cấu hình slug/UTM và thiết lập các quy tắc quản trị.</p>
      </div>

      <CreateLinkForm />
    </main>
  );
}
