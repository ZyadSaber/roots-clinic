export interface LocalizedString {
  en: string;
  ar: string;
  [key: string]: string;
}

/**
 * Returns the string for the current locale.
 * Falls back to English if the locale-specific string is missing.
 */
export function getLocalizedValue(
  data: LocalizedString | undefined | null,
  locale: string,
): string {
  if (!data) return "";

  // Return requested locale or fallback to English, then any available string
  return data[locale] || data.en || Object.values(data)[0] || "";
}
