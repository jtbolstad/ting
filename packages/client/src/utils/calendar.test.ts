import { describe, it, expect } from 'vitest';
import { WEEK_STARTS_ON, WEEKDAY_KEYS, getCalendarDays } from './calendar';

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
