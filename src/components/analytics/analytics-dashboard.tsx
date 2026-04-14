import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, BarChart3, Globe2, MousePointerClick, ShieldBan, Users } from "lucide-react";
import { ClicksLineChart } from "@/components/charts/clicks-line-chart";
import { TopLinksBar } from "@/components/charts/top-links-bar";
import { TrafficDonut } from "@/components/charts/traffic-donut";
import type { DashboardAnalytics } from "@/types/analytics";

type Props = {
  data: DashboardAnalytics;
};

function StatCard(props: { title: string; value: string; sub: string; icon: ReactNode }): JSX.Element {
  const { title, value, sub, icon } = props;
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <span className="text-cyan-300">{icon}</span>
      </div>
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </article>
  );
}

export function AnalyticsDashboard({ data }: Props): JSX.Element {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Tổng click"
          value={data.totalClicks.toLocaleString("vi-VN")}
          sub="Trong 14 ngày gần nhất"
          icon={<MousePointerClick size={18} />}
        />
        <StatCard
          title="Click duy nhất"
          value={data.uniqueClicks.toLocaleString("vi-VN")}
          sub="Lọc IP/cookie trùng"
          icon={<Users size={18} />}
        />
        <StatCard
          title="Độ trễ redirect trung bình"
          value={`${Math.round(data.averageResponseMs)} ms`}
          sub="Theo responseTimeMs đã ghi"
          icon={<Activity size={18} />}
        />
        <StatCard
          title="Click loại trừ IP"
          value={data.excludedClicks.toLocaleString("vi-VN")}
          sub="Không tính vào thống kê chính"
          icon={<ShieldBan size={18} />}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-100">Xu hướng click theo ngày</h2>
          <ClicksLineChart data={data.trend} />
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-100">Top link có nhiều click nhất</h2>
          <TopLinksBar data={data.topLinks} />
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-100">Top quốc gia</h2>
          <TrafficDonut data={data.topCountries} />
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-100">Top trình duyệt</h2>
          <TrafficDonut data={data.topBrowsers} />
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-100">Top hệ điều hành</h2>
          <TrafficDonut data={data.topOs} />
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <h2 className="text-base font-semibold text-slate-100">Top nguồn giới thiệu</h2>
            <Globe2 size={16} className="text-slate-400" />
          </div>
          <div className="max-h-[320px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-900/90 text-slate-300 backdrop-blur">
                <tr>
                  <th className="px-4 py-3 font-medium">Nguồn</th>
                  <th className="px-4 py-3 text-right font-medium">Click</th>
                </tr>
              </thead>
              <tbody>
                {data.topReferrers.map((item) => (
                  <tr key={item.name} className="border-t border-slate-800/80 text-slate-200">
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3 text-right">{item.value.toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <h2 className="text-base font-semibold text-slate-100">Phân tích UTM</h2>
            <BarChart3 size={16} className="text-slate-400" />
          </div>
          <div className="max-h-[320px] overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-900/90 text-slate-300 backdrop-blur">
                <tr>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Medium</th>
                  <th className="px-4 py-3 font-medium">Campaign</th>
                  <th className="px-4 py-3 text-right font-medium">Click</th>
                </tr>
              </thead>
              <tbody>
                {data.utmBreakdown.map((item) => (
                  <tr
                    key={`${item.source}-${item.medium}-${item.campaign}`}
                    className="border-t border-slate-800/80 text-slate-200"
                  >
                    <td className="px-4 py-3">{item.source}</td>
                    <td className="px-4 py-3">{item.medium}</td>
                    <td className="px-4 py-3">{item.campaign}</td>
                    <td className="px-4 py-3 text-right">{item.total.toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h2 className="text-base font-semibold text-slate-100">Click stream thời gian thực</h2>
          <Link href="/analytics" className="text-xs text-cyan-300 hover:text-cyan-200">
            Tự động cập nhật khi tải lại trang
          </Link>
        </div>
        <div className="overflow-auto">
          <table className="min-w-[980px] text-left text-sm">
            <thead className="bg-slate-900/90 text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Thời gian</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Vị trí</th>
                <th className="px-4 py-3 font-medium">Referrer</th>
                <th className="px-4 py-3 font-medium">Trình duyệt</th>
                <th className="px-4 py-3 font-medium">Hệ điều hành</th>
                <th className="px-4 py-3 font-medium">Slug</th>
              </tr>
            </thead>
            <tbody>
              {data.clickStream.map((row) => (
                <tr key={row.id} className="border-t border-slate-800/80 text-slate-200">
                  <td className="whitespace-nowrap px-4 py-3">{new Date(row.clickedAt).toLocaleString("vi-VN")}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono">{row.ip}</td>
                  <td className="whitespace-nowrap px-4 py-3">{`${row.city}, ${row.country}`}</td>
                  <td className="max-w-[280px] truncate px-4 py-3" title={row.referrer}>
                    {row.referrer}
                  </td>
                  <td className="px-4 py-3">{row.browser}</td>
                  <td className="px-4 py-3">{row.os}</td>
                  <td className="px-4 py-3 font-medium text-cyan-300">/{row.slug}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
