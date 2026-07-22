export const APP_TIMEZONE = 'America/Bahia';
export const APP_LOCALE = 'pt-BR';

/**
 * Formata uma data no padrão local de Paulo Afonso / Bahia (America/Bahia)
 */
export function formatDate(
  date?: Date | string | number | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    ...options,
  });
}

/**
 * Formata data e hora no padrão local de Paulo Afonso / Bahia (America/Bahia)
 */
export function formatDateTime(
  date?: Date | string | number | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    ...options,
  });
}

/**
 * Formata apenas a hora no padrão local de Paulo Afonso / Bahia (America/Bahia)
 */
export function formatTime(
  date?: Date | string | number | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(APP_LOCALE, {
    timeZone: APP_TIMEZONE,
    ...options,
  });
}

/**
 * Retorna uma string de data por extenso no padrão de Paulo Afonso - BA
 * Ex: "Paulo Afonso - BA, 22 de julho de 2026"
 */
export function formatLongDatePauloAfonso(
  date?: Date | string | number | null,
  city: string = "Paulo Afonso"
): string {
  const d = !date ? new Date() : (typeof date === 'string' || typeof date === 'number' ? new Date(date) : date);
  const formatted = formatDate(d, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${city} - BA, ${formatted}.`;
}
