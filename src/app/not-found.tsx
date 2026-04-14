import Link from "next/link";

export default function NotFound(): JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
        <h1 className="mb-2 text-2xl font-semibold">404 - Không tìm thấy trang</h1>
        <p className="mb-5 text-sm text-slate-400">Đường dẫn bạn truy cập không tồn tại hoặc chưa được cấu hình.</p>
        <Link href="/" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">
          Quay về trang chính
        </Link>
      </div>
    </main>
  );
}
