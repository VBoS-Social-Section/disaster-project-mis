// Custom formatter for Y-axis (format large numbers)
export const formatYAxisLabel = (value: number, key?: string) => {
  // Check if the axis key is 'year' to prevent special formatting
  if (key?.toString().toLowerCase() === "year") {
    return value.toString();
  }

  if (value === 0) {
    return "0";
  }
  if (Number(value)) {
    if (Math.abs(value) < 1000) return value.toLocaleString();
    if (Math.abs(value) < 1e6) return `${(value / 1e3).toFixed(1)}K`;
    if (Math.abs(value) < 1e9) return `${(value / 1e6).toFixed(1)}M`;
    return `${(value / 1e9).toFixed(1)}B`;
  }
  return value.toString();
};
