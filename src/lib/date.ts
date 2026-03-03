import { formatDistanceToNow } from "date-fns";

export function timeAgo(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
