import { formatDistanceToNow, differenceInDays, isAfter, isBefore, isToday, isTomorrow, format, addDays, parseISO } from "date-fns";

/**
 * Formats a date string as a human-readable relative time
 * @param dateString - Date string to format
 * @returns Formatted string (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Determines the status of an item based on its expiration date
 * @param expirationDate - Expiration date string or Date object
 * @returns Status object with status type and days until expiration
 */
export function getExpirationStatus(expirationDate: string | Date): {
  status: 'expired' | 'expiring-soon' | 'fresh';
  daysUntilExpiration: number;
} {
  const expDate = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysUntilExpiration = differenceInDays(expDate, today);
  
  let status: 'expired' | 'expiring-soon' | 'fresh';
  if (!isAfter(expDate, today)) {
    status = 'expired';
  } else if (daysUntilExpiration <= 3) {
    status = 'expiring-soon';
  } else {
    status = 'fresh';
  }
  
  return { status, daysUntilExpiration };
}

/**
 * Gets formatted expiration text based on status
 * @param status - Expiration status
 * @param daysUntilExpiration - Days until expiration
 * @returns Formatted expiration text
 */
export function getExpirationText(status: 'expired' | 'expiring-soon' | 'fresh', daysUntilExpiration: number): string {
  if (status === 'expired') {
    return 'Expired';
  } else if (daysUntilExpiration === 0) {
    return 'Expires today';
  } else if (daysUntilExpiration === 1) {
    return 'Expires tomorrow';
  } else if (status === 'expiring-soon') {
    return `Expires in ${daysUntilExpiration} days`;
  } else {
    return `Fresh for ${daysUntilExpiration} days`;
  }
}

/**
 * Gets color code based on expiration status
 * @param status - Expiration status
 * @returns Color name (e.g., 'red', 'yellow', 'green')
 */
export function getStatusColor(status: 'expired' | 'expiring-soon' | 'fresh'): string {
  switch (status) {
    case 'expired':
      return 'red';
    case 'expiring-soon':
      return 'yellow';
    case 'fresh':
      return 'green';
    default:
      return 'gray';
  }
}

/**
 * Formats a date in the YYYY-MM-DD format for input fields
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateForInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Creates default expiration date (e.g., 7 days from purchase date)
 * @param purchaseDate - Purchase date
 * @param defaultDays - Default days to add (default: 7)
 * @returns Default expiration date
 */
export function createDefaultExpirationDate(purchaseDate: Date, defaultDays = 7): Date {
  return addDays(purchaseDate, defaultDays);
}

/**
 * Parses an ISO date string safely
 * @param dateString - ISO date string
 * @returns Date object or null if invalid
 */
export function safeParseDateString(dateString: string): Date | null {
  try {
    return parseISO(dateString);
  } catch (e) {
    return null;
  }
}

/**
 * Formats a date for display in the UI
 * @param date - Date to format
 * @param formatString - Format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDateForDisplay(date: Date | string, formatString = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString);
}

/**
 * Groups dates into periods for analytics
 * @param dates - Array of date strings
 * @returns Object with counts by period
 */
export function groupDatesByPeriod(dates: string[]): Record<string, number> {
  const periods: Record<string, number> = {
    today: 0,
    tomorrow: 0,
    thisWeek: 0,
    nextWeek: 0,
    later: 0,
    expired: 0
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const nextWeek = addDays(today, 7);
  const twoWeeksLater = addDays(today, 14);
  
  dates.forEach(dateStr => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    
    if (isBefore(date, today)) {
      periods.expired++;
    } else if (isToday(date)) {
      periods.today++;
    } else if (isTomorrow(date)) {
      periods.tomorrow++;
    } else if (isBefore(date, nextWeek)) {
      periods.thisWeek++;
    } else if (isBefore(date, twoWeeksLater)) {
      periods.nextWeek++;
    } else {
      periods.later++;
    }
  });
  
  return periods;
}
