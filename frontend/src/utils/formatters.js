import { convertAmount } from './currencyConverter';

/**
 * Formats a numeric amount into currency representation (e.g. ₹1,60,000 or $1,200.00)
 * Automatically converts from INR to the target currency using live exchange rates.
 * @param {number} amount - The numeric figure (always stored in INR in our DB)
 * @param {string} currencyCode - INR, USD, EUR, GBP
 * @returns {string} Formatted currency string with converted value
 */
export const formatCurrency = (amount = 0, currencyCode = 'INR') => {
  const rawNum = Number(amount) || 0;

  // Convert from INR to target currency
  const convertedNum = convertAmount(rawNum, currencyCode);
  
  if (currencyCode === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(convertedNum);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode || 'USD',
    maximumFractionDigits: 2
  }).format(convertedNum);
};

/**
 * Formats ISO date string to a readable format e.g., "Jul 16, 2026"
 * @param {string} dateString 
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    return dateString;
  }
};

/**
 * Formats date into relative time (e.g. "2 days ago", "Today")
 * @param {string} dateString 
 * @returns {string}
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return formatDate(dateString);
};

/**
 * Calculates accurate percentage
 * @param {number} current 
 * @param {number} total 
 * @returns {number}
 */
export const calculatePercentage = (current = 0, total = 0) => {
  if (!total || total <= 0) return 0;
  const perc = (Number(current) / Number(total)) * 100;
  return Math.min(Math.round(perc * 10) / 10, 100);
};
