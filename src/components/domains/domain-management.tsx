"use client";

import { useState } from "react";
import type { DomainRow, RedirectMode } from "@/types/domain";

type Props = {
  initialDomains: DomainRow[];
};

type DomainForm = {
  hostname: string;
  isPrimary: boolean;
  mainPageUrl: string;
  mainPageRedirect: RedirectMode;
  notFoundUrl: string;
  notFoundRedirect: RedirectMode;
};

const REDIRECT_OPTIONS: Array<{ value: RedirectMode; label: string }> = [
  { value: "PERMANENT_301", label: "301 - Vĩnh viễn" },
  { value: "TEMPORARY_302", label: "302 - Tạm thời" },
];

function statusBadge(active: boolean, activeLabel: string, inactiveLabel: string): JSX.Element {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "border border-emerald-700 bg-emerald-950/70 text-emerald-300" : "border border-amber-700 bg-amber-950/70 text-amber-300"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function DomainManagement({ initialDomains }: Props): JSX.Element {
  const [domains, setDomains] = useState<DomainRow[]>(initialDomains);
  const [form, setForm] = useState<DomainForm>({
    hostname: "",
    isPrimary: domains.length === 0,
    mainPageUrl: "",
    mainPageRedirect: "TEMPORARY_302",
    notFoundUrl: "",
    notFoundRedirect: "TEMPORARY_302",
  });
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");

  const reloadDomains = async (): Promise<void> => {
    const res = await fetch("/api/domains", { method: "GET" });
    const payload = (await res.json()) as { success: boolean; data?: DomainRow[] };
    if (payload.success && payload.data) {
      setDomains(payload.data);
    }
  };

  const createDomain = async (): Promise<void> => {
    setSaving(true);
    setErrorText("");

    const res = await fetch("/api/domains", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = (await res.json()) as { success: boolean; message?: string; data?: DomainRow };
    if (!payload.success || !payload.data) {
      setErrorText(payload.message ?? "Không thể thêm domain.");
      setSaving(false);
      return;
    }

    await reloadDomains();
    setForm({
      hostname: "",
      isPrimary: false,
      mainPageUrl: "",
      mainPageRedirect: "TEMPORARY_302",
      notFoundUrl: "",
      notFoundRedirect: "TEMPORARY_302",
    });
    setSaving(false);
  };

  const patchDomain = async (id: string, body: Record<string, unknown>): Promise<void> => {
    const res = await fetch(`/api/domains/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = (await res.json()) as { success: boolean; data?: DomainRow; message?: string };
    if (!payload.success || !payload.data) {
      alert(payload.message ?? "Cập nhật domain thất bại.");
      return;
    }

    await reloadDomains();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Thêm subdomain tùy chỉnh</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="hostname">
              Hostname
            </label>
            <input
              id="hostname"
              value={form.hostname}
              onChange={(event) => setForm((prev) => ({ ...prev, hostname: event.target.value }))}
              placeholder="s.thinksmartins.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring"
            />
          </div>

          <label className="mt-8 inline-flex items-center gap-2 text-sm text-slate-300 md:mt-0">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(event) => setForm((prev) => ({ ...prev, isPrimary: event.target.checked }))}
            />
            Đặt làm domain chính
          </label>

          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="mainPageUrl">
              Main Page Redirect URL
            </label>
            <input
              id="mainPageUrl"
              value={form.mainPageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, mainPageUrl: event.target.value }))}
              placeholder="https://thinksmartins.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="mainRedirectType">
              Trạng thái redirect Main Page
            </label>
            <select
              id="mainRedirectType"
              value={form.mainPageRedirect}
              onChange={(event) => setForm((prev) => ({ ...prev, mainPageRedirect: event.target.value as RedirectMode }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none"
            >
              {REDIRECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="notFoundUrl">
              404 Redirect URL
            </label>
            <input
              id="notFoundUrl"
              value={form.notFoundUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, notFoundUrl: event.target.value }))}
              placeholder="https://thinksmartins.com/404"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="notFoundRedirectType">
              Trạng thái redirect 404
            </label>
            <select
              id="notFoundRedirectType"
              value={form.notFoundRedirect}
              onChange={(event) => setForm((prev) => ({ ...prev, notFoundRedirect: event.target.value as RedirectMode }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none"
            >
              {REDIRECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorText && <p className="mt-3 text-sm text-rose-300">{errorText}</p>}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={createDomain}
            disabled={saving}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Thêm domain"}
          </button>
        </div>
      </section>

      <section className="overflow-auto rounded-2xl border border-slate-800 bg-slate-950/60">
        <table className="min-w-[1050px] text-left text-sm">
          <thead className="bg-slate-900/90 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">DNS</th>
              <th className="px-4 py-3 font-medium">SSL</th>
              <th className="px-4 py-3 font-medium">Main Page</th>
              <th className="px-4 py-3 font-medium">404 Redirect</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((domain) => (
              <tr key={domain.id} className="border-t border-slate-800/80 text-slate-200">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{domain.hostname}</span>
                    {domain.isPrimary && (
                      <span className="rounded-full border border-cyan-700 bg-cyan-950/60 px-2 py-0.5 text-xs text-cyan-300">Chính</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {statusBadge(domain.dnsStatus === "ACTIVE", "DNS Configured", "DNS Pending")}
                </td>
                <td className="px-4 py-3">
                  {statusBadge(domain.sslStatus === "ACTIVE", "SSL Active", "SSL Pending")}
                </td>
                <td className="px-4 py-3 text-xs text-slate-300">
                  <p>{domain.mainPageUrl ?? "Chưa cấu hình"}</p>
                  <p className="text-slate-500">{domain.mainPageRedirect === "PERMANENT_301" ? "301" : "302"}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-300">
                  <p>{domain.notFoundUrl ?? "Chưa cấu hình"}</p>
                  <p className="text-slate-500">{domain.notFoundRedirect === "PERMANENT_301" ? "301" : "302"}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        patchDomain(domain.id, {
                          dnsStatus: domain.dnsStatus === "ACTIVE" ? "PENDING" : "ACTIVE",
                        })
                      }
                      className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                    >
                      Toggle DNS
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        patchDomain(domain.id, {
                          sslStatus: domain.sslStatus === "ACTIVE" ? "PENDING" : "ACTIVE",
                        })
                      }
                      className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                    >
                      Toggle SSL
                    </button>
                    {!domain.isPrimary && (
                      <button
                        type="button"
                        onClick={() => patchDomain(domain.id, { isPrimary: true })}
                        className="rounded-lg border border-cyan-700 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-950/40"
                      >
                        Đặt chính
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
