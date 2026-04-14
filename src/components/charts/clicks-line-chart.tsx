"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyClickPoint } from "@/types/analytics";

type Props = {
  data: DailyClickPoint[];
};

export function ClicksLineChart({ data }: Props): JSX.Element {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
            stroke="#475569"
          />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} stroke="#475569" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid #1e293b",
              borderRadius: 10,
              color: "#e2e8f0",
            }}
            labelFormatter={(value) => `Ngày: ${new Date(value).toLocaleDateString("vi-VN")}`}
          />
          <Line type="monotone" dataKey="total" name="Tổng click" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="unique" name="Click duy nhất" stroke="#a78bfa" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
