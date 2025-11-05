/**
 * Date utility functions
 */

import { format, subDays, subMonths, subYears, differenceInMinutes } from 'date-fns';

export const formatDate = (date: Date): string => {
  return format(date, 'MMM d, yyyy');
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'MMM d, yyyy h:mm a');
};

export const formatRelativeTime = (date: Date): string => {
  const minutesAgo = differenceInMinutes(new Date(), date);
  
  if (minutesAgo < 1) return 'just now';
  if (minutesAgo < 60) return `${minutesAgo} min${minutesAgo > 1 ? 's' : ''} ago`;
  
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
  
  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 7) return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
  
  const weeksAgo = Math.floor(daysAgo / 7);
  if (weeksAgo < 4) return `${weeksAgo} week${weeksAgo > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
};

export const getDateRange = (range: '30d' | '90d' | '365d' | 'custom', customStart?: Date, customEnd?: Date) => {
  const end = new Date();
  let start: Date;
  
  switch (range) {
    case '30d':
      start = subDays(end, 30);
      break;
    case '90d':
      start = subDays(end, 90);
      break;
    case '365d':
      start = subDays(end, 365);
      break;
    case 'custom':
      start = customStart || subDays(end, 30);
      end.setTime(customEnd?.getTime() || end.getTime());
      break;
    default:
      start = subDays(end, 30);
  }
  
  return { start, end };
};



