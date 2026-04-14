"use client";

import { useMemo, useRef } from "react";
import { Download, QrCode, X } from "lucide-react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";

type Props = {
  isOpen: boolean;
  shortUrl: string;
  onClose: () => void;
};

export function QrDialog({ isOpen, shortUrl, onClose }: Props): JSX.Element | null {
  const canvasRef = useRef<HTMLDivElement>(null);
  const safeFileName = useMemo(
    () => shortUrl.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9-_]/g, "-"),
    [shortUrl],
  );

  if (!isOpen) return null;

  const downloadPng = (): void => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${safeFileName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const downloadSvg = (): void => {
    const svg = document.getElementById("qr-svg-element");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFileName}.svg`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode size={18} className="text-cyan-300" />
            <h3 className="text-base font-semibold text-slate-100">Mã QR cho link rút gọn</h3>
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-800"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>

        <p className="mb-4 break-all text-xs text-slate-400">{shortUrl}</p>

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white p-4" ref={canvasRef}>
            <QRCodeCanvas value={shortUrl} size={200} includeMargin />
          </div>

          <div className="hidden">
            <QRCodeSVG id="qr-svg-element" value={shortUrl} size={200} includeMargin />
          </div>

          <div className="flex w-full gap-2">
            <button
              type="button"
              onClick={downloadPng}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              <Download size={14} /> Tải PNG
            </button>
            <button
              type="button"
              onClick={downloadSvg}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              <Download size={14} /> Tải SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
