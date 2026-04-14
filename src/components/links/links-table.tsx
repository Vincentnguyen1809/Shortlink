"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Copy, Pencil, QrCode, Trash2 } from "lucide-react";
import { QrDialog } from "@/components/links/qr-dialog";
import type { LinkRow } from "@/types/link";

type Props = {
  initialData: LinkRow[];
};

export function LinksTable({ initialData }: Props): JSX.Element {
  const [rows, setRows] = useState<LinkRow[]>(initialData);
  const [qrTarget, setQrTarget] = useState<string | null>(null);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [rows],
  );

  const copyShortLink = async (shortUrl: string): Promise<void> => {
    await navigator.clipboard.writeText(shortUrl);
  };

  const deleteLink = async (id: string): Promise<void> => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa link này? Hành động này không thể hoàn tác.");
    if (!confirmed) return;

    const response = await fetch(`/api/links/${id}`, { method: "DELETE" });
    if (!response.ok) {
      alert("Xóa link thất bại. Vui lòng thử lại.");
      return;
    }

    setRows((prev) => prev.filter((item) => item.id !== id));
  };

  const editLink = async (row: LinkRow): Promise<void> => {
    const newUrl = window.prompt("Nhập URL gốc mới", row.originalUrl);
    if (!newUrl || newUrl === row.originalUrl) return;

    const res = await fetch(`/api/links/${row.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ originalUrl: newUrl }),
    });

    if (!res.ok) {
      alert("Cập nhật link thất bại.");
      return;
    }

    setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, originalUrl: newUrl } : item)));
  };

  return (
    <>
      <div className="overflow-auto rounded-2xl border border-slate-800 bg-slate-950/60">
        <table className="min-w-[1100px] text-left text-sm">
          <thead className="bg-slate-900/90 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Người tạo</th>
              <th className="px-4 py-3 font-medium">Link rút gọn</th>
              <th className="px-4 py-3 font-medium">Link gốc + Meta title</th>
              <th className="px-4 py-3 text-right font-medium">Tổng click</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.id} className="border-t border-slate-800/80 text-slate-200">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {row.ownerAvatarUrl ? (
                      <Image
                        src={row.ownerAvatarUrl}
                        alt={row.ownerName}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold">
                        {row.ownerName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">{row.ownerName}</span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a className="text-cyan-300 hover:text-cyan-200" href={row.shortUrl} target="_blank" rel="noreferrer">
                      {row.shortUrl}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyShortLink(row.shortUrl)}
                      className="rounded-md border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </td>

                <td className="max-w-[380px] px-4 py-3">
                  <p className="truncate text-slate-300" title={row.originalUrl}>
                    {row.originalUrl}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500" title={row.metaTitle ?? "Chưa có meta title"}>
                    {row.metaTitle ?? "Chưa lấy được tiêu đề trang"}
                  </p>
                </td>

                <td className="px-4 py-3 text-right font-semibold">{row.totalClicks.toLocaleString("vi-VN")}</td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {row.tags.length === 0 ? (
                      <span className="text-xs text-slate-500">Không có tag</span>
                    ) : (
                      row.tags.map((tag) => (
                        <span
                          key={`${row.id}-${tag}`}
                          className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
                        >
                          {tag}
                        </span>
                      ))
                    )}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editLink(row)}
                      className="rounded-md border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"
                      title="Sửa"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrTarget(row.shortUrl)}
                      className="rounded-md border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"
                      title="QR"
                    >
                      <QrCode size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteLink(row.id)}
                      className="rounded-md border border-rose-900/80 p-1.5 text-rose-300 hover:bg-rose-950/60"
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <QrDialog isOpen={Boolean(qrTarget)} shortUrl={qrTarget ?? ""} onClose={() => setQrTarget(null)} />
    </>
  );
}
