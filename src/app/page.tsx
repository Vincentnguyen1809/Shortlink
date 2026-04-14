import Link from "next/link";

export default function HomePage(): JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <p className="mb-2 text-xs uppercase tracking-wider text-cyan-300">Thinksmart Insurance</p>
        <h1 className="mb-3 text-3xl font-semibold">Hệ thống rút gọn link nội bộ</h1>
        <p className="mx-auto mb-6 max-w-xl text-sm text-slate-400">
          Triển khai thành công. Chọn khu vực quản trị để tiếp tục cấu hình Domain, Link Workspace, Analytics và Cài đặt tổ chức.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/links" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
            Vào quản lý link
          </Link>
          <Link href="/domains" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">
            Vào quản lý domain
          </Link>
          <Link href="/analytics" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">
            Xem analytics
          </Link>
          <Link href="/cai-dat" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800">
            Cài đặt tổ chức
          </Link>
        </div>
      </div>
    </main>
  );
}
