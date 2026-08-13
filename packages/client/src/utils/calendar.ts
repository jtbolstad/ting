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
