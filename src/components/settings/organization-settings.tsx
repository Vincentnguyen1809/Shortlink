"use client";

import { useState } from "react";
import type { OrganizationSettingsView } from "@/types/settings";

type Props = {
  initialData: OrganizationSettingsView;
};

export function OrganizationSettings({ initialData }: Props): JSX.Element {
  const [data, setData] = useState(initialData);
  const [allowlistInput, setAllowlistInput] = useState(initialData.destinationAllowlist.join(","));
  const [newIp, setNewIp] = useState("");
  const [newIpNote, setNewIpNote] = useState("");
  const [errorText, setErrorText] = useState("");

  const reload = async (): Promise<void> => {
    const res = await fetch("/api/settings/organization");
    const payload = (await res.json()) as { success: boolean; data?: OrganizationSettingsView };
    if (payload.success && payload.data) {
      setData(payload.data);
      setAllowlistInput(payload.data.destinationAllowlist.join(","));
    }
  };

  const saveSettings = async (): Promise<void> => {
    setErrorText("");
    const destinationAllowlist = allowlistInput
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const res = await fetch("/api/settings/organization", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationName: data.organizationName,
        ga4MeasurementId: data.ga4MeasurementId ?? "",
        metaPixelId: data.metaPixelId ?? "",
        webhookUrl: data.webhookUrl ?? "",
        destinationAllowlist,
      }),
    });

    const payload = (await res.json()) as { success: boolean; message?: string; data?: OrganizationSettingsView };
    if (!payload.success || !payload.data) {
      setErrorText(payload.message ?? "Không thể lưu cài đặt tổ chức.");
      return;
    }

    setData(payload.data);
  };

  const addIp = async (): Promise<void> => {
    const res = await fetch("/api/settings/ip-exclusions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ipAddress: newIp, note: newIpNote || undefined }),
    });

    const payload = (await res.json()) as { success: boolean; message?: string; data?: OrganizationSettingsView };
    if (!payload.success || !payload.data) {
      setErrorText(payload.message ?? "Không thể thêm IP.");
      return;
    }

    setData(payload.data);
    setNewIp("");
    setNewIpNote("");
  };

  const removeIp = async (id: string): Promise<void> => {
    const res = await fetch("/api/settings/ip-exclusions", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const payload = (await res.json()) as { success: boolean; message?: string; data?: OrganizationSettingsView };
    if (!payload.success || !payload.data) {
      setErrorText(payload.message ?? "Không thể xóa IP.");
      return;
    }

    setData(payload.data);
  };

  const updateRole = async (userId: string, role: "ADMIN" | "MEMBER"): Promise<void> => {
    const res = await fetch(`/api/settings/users/${userId}/role`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });

    const payload = (await res.json()) as { success: boolean; message?: string; data?: OrganizationSettingsView };
    if (!payload.success || !payload.data) {
      setErrorText(payload.message ?? "Không thể cập nhật role.");
      return;
    }

    setData(payload.data);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="mb-4 text-lg font-semibold">Cài đặt tổ chức</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Tên tổ chức</label>
            <input
              value={data.organizationName}
              onChange={(event) => setData((prev) => ({ ...prev, organizationName: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">GA4 Measurement ID</label>
            <input
              value={data.ga4MeasurementId ?? ""}
              onChange={(event) => setData((prev) => ({ ...prev, ga4MeasurementId: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Meta Pixel ID</label>
            <input
              value={data.metaPixelId ?? ""}
              onChange={(event) => setData((prev) => ({ ...prev, metaPixelId: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Webhook URL toàn cục</label>
            <input
              value={data.webhookUrl ?? ""}
              onChange={(event) => setData((prev) => ({ ...prev, webhookUrl: event.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              placeholder="https://hooks.example.com/redirect"
            />
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <label className="text-sm text-slate-300">Destination Allowlist (phân tách dấu phẩy)</label>
          <input
            value={allowlistInput}
            onChange={(event) => setAllowlistInput(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="thinksmartins.com, docs.thinksmartins.com"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={saveSettings}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Lưu cài đặt
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="mb-4 text-lg font-semibold">IP Exclusion (loại trừ khỏi analytics)</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            value={newIp}
            onChange={(event) => setNewIp(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="203.0.113.10"
          />
          <input
            value={newIpNote}
            onChange={(event) => setNewIpNote(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="Office IP"
          />
          <button type="button" onClick={addIp} className="rounded-lg border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800">
            Thêm IP
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {data.ipExclusions.map((ip) => (
            <div key={ip.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
              <div>
                <p className="font-mono text-sm text-slate-100">{ip.ipAddress}</p>
                <p className="text-xs text-slate-400">{ip.note ?? "Không có ghi chú"}</p>
              </div>
              <button type="button" onClick={() => removeIp(ip.id)} className="text-xs text-rose-300 hover:text-rose-200">
                Xóa
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="mb-4 text-lg font-semibold">RBAC (Admin/Member)</h2>
        <div className="overflow-auto">
          <table className="min-w-[760px] text-left text-sm">
            <thead className="text-slate-300">
              <tr>
                <th className="px-2 py-2">Tên</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Vai trò</th>
                <th className="px-2 py-2">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.roles.map((user) => (
                <tr key={user.id} className="border-t border-slate-800/80 text-slate-200">
                  <td className="px-2 py-2">{user.fullName}</td>
                  <td className="px-2 py-2">{user.email}</td>
                  <td className="px-2 py-2">
                    <select
                      value={user.role}
                      onChange={(event) => updateRole(user.id, event.target.value as "ADMIN" | "MEMBER")}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">{user.isActive ? "Hoạt động" : "Bị khóa"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {errorText && <p className="rounded-lg border border-rose-900/70 bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{errorText}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={reload}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Tải lại dữ liệu
        </button>
      </div>
    </div>
  );
}
