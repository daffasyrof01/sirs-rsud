import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <CardTitle className="text-2xl sm:text-3xl">{value}</CardTitle>
        </div>
        <div className="shrink-0 rounded-2xl bg-primary/10 p-3 text-primary">{icon}</div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
        <ArrowUpRight className="hidden h-4 w-4 text-muted-foreground sm:block" />
      </CardContent>
    </Card>
  );
}
