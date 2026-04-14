"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DistributionPoint } from "@/types/analytics";

type Props = {
  data: DistributionPoint[];
};

const COLORS = ["#22d3ee", "#818cf8", "#f472b6", "#facc15", "#4ade80", "#fb7185", "#2dd4bf", "#c084fc"];

export function TrafficDonut({ data }: Props): JSX.Element {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={105}
            innerRadius={58}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index + 1}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid #1e293b",
              borderRadius: 10,
              color: "#e2e8f0",
            }}
            formatter={(value: number, _name, payload) => [`${value} click`, payload.payload.name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
