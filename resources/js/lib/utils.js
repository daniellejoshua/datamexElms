import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format number with commas for display
export function formatNumberWithCommas(value) {
  if (value === '' || value === null || value === undefined) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Parse formatted number string back to number
export function parseFormattedNumber(value) {
  if (value === '' || value === null || value === undefined) return '';
  // Remove commas and return as string to preserve decimal places
  return value.toString().replace(/,/g, '');
}
