/**
 * Returns the current date formatted as YYYY-MM-DD
 * This format is required for HTML date inputs (<input type="date">)
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

export default getCurrentDate;
