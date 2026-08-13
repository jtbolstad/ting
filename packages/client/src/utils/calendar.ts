import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/**
 * Uken starter på mandag i alle kalendervisninger.
 * date-fns default er søndag (0), som ikke passer norsk/europeisk kontekst.
 */
export const WEEK_STARTS_ON = 1 as const;

/** i18n-nøkler for ukedagsoverskrifter, i visningsrekkefølge (mandag først). */
export const WEEKDAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

/**
 * Alle dagene som skal vises i et månedsgrid, inkludert utfyllingsdager
 * fra forrige og neste måned, slik at griddet starter på mandag.
 */
export function getCalendarDays(month: Date): Date[] {
  const calendarStart = startOfWeek(startOfMonth(month), {
    weekStartsOn: WEEK_STARTS_ON,
  });
  const calendarEnd = endOfWeek(endOfMonth(month), {
    weekStartsOn: WEEK_STARTS_ON,
  });
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
}

/**
 * Formaterer en dato som "yyyy-MM-dd" i *lokal* tid.
 *
 * `Date.prototype.toISOString()` konverterer til UTC, og i soner øst for
 * Greenwich (f.eks. Europe/Oslo) blir lokal midnatt dagen før i UTC. Da
 * forskyves datoen én dag bakover, både i visningen og i det som sendes
 * til API-et.
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parser "yyyy-MM-dd" til lokal midnatt.
 *
 * `new Date("2026-08-19")` tolkes som UTC-midnatt av spesifikasjonen, som
 * gir feil dag i vestlige soner og feil klokkeslett i østlige. Denne bygger
 * datoen eksplisitt i lokal tid.
 */
export function parseDateString(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Dagens dato som "yyyy-MM-dd" i lokal tid — for `min`/`max` på date-input. */
export function todayDateString(): string {
  return toDateString(new Date());
}
