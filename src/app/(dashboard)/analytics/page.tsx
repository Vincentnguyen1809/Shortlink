import { Suspense } from "react";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { getDashboardAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

async function AnalyticsContent(): Promise<JSX.Element> {
  const data = await getDashboardAnalytics();
  return <AnalyticsDashboard data={data} />;
}

function LoadingState(): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`loading-card-${index + 1}`}
          className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
        />
      ))}
    </div>
  );
}

export default function AnalyticsPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Bảng điều khiển phân tích</h1>
        <p className="text-sm text-slate-400">Theo dõi hiệu suất link rút gọn theo thời gian thực cho Thinksmart Insurance.</p>
      </header>

      <Suspense fallback={<LoadingState />}>
        <AnalyticsContent />
      </Suspense>
    </main>
  );
}
