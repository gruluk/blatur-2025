import { toZonedTime } from "date-fns-tz";
import { formatDistanceToNowStrict } from "date-fns";

export const formatRelativeTime = (utcDate: string) => {
  if (!utcDate) return "Unknown time";

  // Convert to UTC first
  const utcTime = new Date(utcDate);

  // Convert UTC to CET
  const cetTime = toZonedTime(utcTime, "Europe/Paris");

  // Format as "2 minutes ago"
  return formatDistanceToNowStrict(cetTime, { addSuffix: true });
};
