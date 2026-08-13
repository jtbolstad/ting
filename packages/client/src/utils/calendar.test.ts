import { describe, it, expect } from 'vitest';
import {
  WEEK_STARTS_ON,
  WEEKDAY_KEYS,
  getCalendarDays,
  toDateString,
  parseDateString,
} from './calendar';

describe('WEEK_STARTS_ON', () => {
  it('er mandag', () => {
    expect(WEEK_STARTS_ON).toBe(1);
  });
});

describe('WEEKDAY_KEYS', () => {
  it('har mandag først og søndag sist', () => {
    expect(WEEKDAY_KEYS).toEqual(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  });
});

describe('getCalendarDays', () => {
  it('starter griddet på en mandag og slutter på en søndag', () => {
    const days = getCalendarDays(new Date(2026, 7, 13)); // 13. august 2026
    expect(days[0].getDay()).toBe(1);
    expect(days[days.length - 1].getDay()).toBe(0);
  });

  it('gir hele uker (multiplum av 7 dager)', () => {
    const days = getCalendarDays(new Date(2026, 7, 13));
    expect(days.length % 7).toBe(0);
  });

  it('plasserer 13. august 2026 i torsdagskolonnen (indeks 3)', () => {
    const days = getCalendarDays(new Date(2026, 7, 13));
    const index = days.findIndex(
      (d) =>
        d.getFullYear() === 2026 && d.getMonth() === 7 && d.getDate() === 13,
    );
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index % 7).toBe(3);
  });

  it('inkluderer utfyllingsdager fra forrige måned når måneden ikke starter på mandag', () => {
    // 1. august 2026 er en lørdag -> griddet må starte 27. juli
    const days = getCalendarDays(new Date(2026, 7, 1));
    expect(days[0].getMonth()).toBe(6);
    expect(days[0].getDate()).toBe(27);
  });

  it('inkluderer alle dagene i måneden', () => {
    const days = getCalendarDays(new Date(2026, 7, 1));
    const augustDays = days.filter((d) => d.getMonth() === 7);
    expect(augustDays.length).toBe(31);
  });

  it('starter på mandag også når måneden selv starter på mandag', () => {
    // 1. juni 2026 er en mandag
    const days = getCalendarDays(new Date(2026, 5, 15));
    expect(days[0].getMonth()).toBe(5);
    expect(days[0].getDate()).toBe(1);
  });
});

describe('toDateString', () => {
  it('bruker lokal dato, ikke UTC', () => {
    // Lokal midnatt 19. august 2026. I Europe/Oslo er dette 18. aug 22:00 UTC,
    // så toISOString() ville gitt "2026-08-18".
    expect(toDateString(new Date(2026, 7, 19))).toBe('2026-08-19');
  });

  it('nullpadder måned og dag', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('beholder datoen sent på dagen', () => {
    expect(toDateString(new Date(2026, 7, 19, 23, 59, 59))).toBe('2026-08-19');
  });
});

describe('parseDateString', () => {
  it('gir lokal midnatt', () => {
    const d = parseDateString('2026-08-19');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(19);
    expect(d.getHours()).toBe(0);
  });

  it('er invers av toDateString', () => {
    const original = new Date(2026, 7, 19);
    expect(parseDateString(toDateString(original)).getTime()).toBe(original.getTime());
  });
});

describe('valgt periode (regresjon: sluttdato ble ikke inkludert)', () => {
  it('markerer 19, 20 og 21 når bruker klikker 19 og 21', () => {
    // Simulerer rundturen klikk -> lagret streng -> selectedStart/End
    const clickedStart = new Date(2026, 7, 19);
    const clickedEnd = new Date(2026, 7, 21);

    const selectedStart = parseDateString(toDateString(clickedStart));
    const selectedEnd = parseDateString(toDateString(clickedEnd));

    const marked = [18, 19, 20, 21, 22].filter((day) => {
      const d = new Date(2026, 7, day);
      d.setHours(0, 0, 0, 0);
      return d >= selectedStart && d <= selectedEnd;
    });

    expect(marked).toEqual([19, 20, 21]);
  });
});
