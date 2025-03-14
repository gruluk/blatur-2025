import { fromZonedTime } from "date-fns-tz";
import { formatDistanceToNowStrict } from "date-fns";

export const formatRelativeTime = (utcDate: string) => {
  if (!utcDate) return "Unknown time";

  // Convert stored time (which should be UTC) to an actual UTC Date object
  const utcTime = fromZonedTime(new Date(utcDate), "UTC");

  // Format relative time correctly
  return formatDistanceToNowStrict(utcTime, { addSuffix: true });
};
