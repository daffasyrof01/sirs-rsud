"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORY_COLORS: Record<string, string> = {
  listrik: "#f59e0b",
  plumbing: "#0ea5e9",
  struktural: "#8b5cf6",
  peralatan_medis: "#10b981",
  hvac: "#ef4444",
  it_jaringan: "#14b8a6",
  lainnya: "#64748b",
};

export function PieChartCard({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: Array<{ name: string; value: number; category?: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-64 px-3 sm:h-72 sm:px-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--card))",
              }}
            />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="44%" outerRadius="68%" paddingAngle={4}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={CATEGORY_COLORS[entry.category ?? entry.name] ?? "#64748b"} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
