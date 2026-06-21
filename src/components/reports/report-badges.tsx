import { Badge } from "@/components/ui/badge";
import { getPriorityLabel, getStatusLabel } from "@/lib/constants/app";
import type { ReportPriority, ReportStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: ReportStatus }) {
  if (status === "resolved") return <Badge variant="success">{getStatusLabel(status)}</Badge>;
  if (status === "rejected") return <Badge variant="destructive">{getStatusLabel(status)}</Badge>;
  if (status === "in_progress") return <Badge variant="info">{getStatusLabel(status)}</Badge>;
  return <Badge variant="warning">{getStatusLabel(status)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: ReportPriority }) {
  if (priority === "emergency") return <Badge variant="destructive">{getPriorityLabel(priority)}</Badge>;
  if (priority === "high") return <Badge variant="warning">{getPriorityLabel(priority)}</Badge>;
  if (priority === "medium") return <Badge variant="info">{getPriorityLabel(priority)}</Badge>;
  return <Badge variant="secondary">{getPriorityLabel(priority)}</Badge>;
}
