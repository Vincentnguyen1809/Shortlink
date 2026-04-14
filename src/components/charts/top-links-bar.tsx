"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TopLinkPoint } from "@/types/analytics";

type Props = {
  data: TopLinkPoint[];
};

export function TopLinksBar({ data }: Props): JSX.Element {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="slug"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            stroke="#475569"
            interval={0}
            angle={-20}
            textAnchor="end"
            height={58}
          />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} stroke="#475569" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid #1e293b",
              borderRadius: 10,
              color: "#e2e8f0",
            }}
            formatter={(value: number) => [`${value} click`, "Lượt click"]}
          />
          <Bar dataKey="totalClicks" fill="#38bdf8" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
