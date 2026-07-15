import { describe, it, expect } from 'vitest';
import { parseDate, formatDateISO, addToDate, diffDates } from '../logic/days';

describe('days logic', () => {
    describe('parseDate', () => {
        it('parses valid ISO date', () => {
            const d = parseDate('2024-03-15');
            expect(d).not.toBeNull();
            expect(d!.getFullYear()).toBe(2024);
            expect(d!.getMonth()).toBe(2); // March=2
            expect(d!.getDate()).toBe(15);
        });

        it('returns null for empty string', () => {
            expect(parseDate('')).toBeNull();
        });

        it('returns null for invalid date', () => {
            expect(parseDate('not-a-date')).toBeNull();
        });
    });

    describe('formatDateISO', () => {
        it('formats date correctly', () => {
            expect(formatDateISO(new Date(2024, 0, 5))).toBe('2024-01-05');
            expect(formatDateISO(new Date(2024, 11, 31))).toBe('2024-12-31');
        });

        it('pads single-digit month and day', () => {
            expect(formatDateISO(new Date(2024, 0, 1))).toBe('2024-01-01');
        });
    });

    describe('addToDate', () => {
        it('adds days', () => {
            const base = new Date(2024, 0, 1);
            const result = addToDate(base, 0, 0, 10);
            expect(result.getDate()).toBe(11);
        });

        it('adds months', () => {
            const base = new Date(2024, 0, 15);
            const result = addToDate(base, 0, 2, 0);
            expect(result.getMonth()).toBe(2); // March
        });

        it('adds years', () => {
            const base = new Date(2024, 5, 1);
            const result = addToDate(base, 3, 0, 0);
            expect(result.getFullYear()).toBe(2027);
        });

        it('handles negative values', () => {
            const base = new Date(2024, 5, 15);
            const result = addToDate(base, 0, 0, -15);
            expect(result.getMonth()).toBe(4); // May 31
        });
    });

    describe('diffDates', () => {
        it('calculates correct total days between two dates (inclusive)', () => {
            const a = new Date(2024, 0, 1);
            const b = new Date(2024, 0, 10);
            const result = diffDates(a, b, true);
            expect(result.totalDays).toBe(10);
        });

        it('calculates correct total days (exclusive end)', () => {
            const a = new Date(2024, 0, 1);
            const b = new Date(2024, 0, 10);
            const result = diffDates(a, b, false);
            expect(result.totalDays).toBe(9);
        });

        it('calculates weeks correctly', () => {
            const a = new Date(2024, 0, 1);
            const b = new Date(2024, 0, 22);
            const result = diffDates(a, b, false);
            expect(result.weeks.weeks).toBe(3);
            expect(result.weeks.days).toBe(0);
        });

        it('returns 0 for same dates (exclusive)', () => {
            const d = new Date(2024, 5, 15);
            const result = diffDates(d, d, false);
            expect(result.totalDays).toBe(0);
        });

        it('calculates working days (simple, no holidays)', () => {
            // Mon=Jan 1, 2024 to Fri=Jan 5, 2024 -- 5 working days (inclusive)
            const a = new Date(2024, 0, 1);
            const b = new Date(2024, 0, 5);
            const result = diffDates(a, b, true, false);
            expect(result.workingDays).toBeGreaterThan(0);
            expect(result.workingDays).toBeLessThanOrEqual(5);
        });

        it('calculates YMD breakdown', () => {
            const a = new Date(2024, 0, 1);
            const b = new Date(2025, 2, 15); // 1 year 2 months 14 days
            const result = diffDates(a, b, false);
            expect(result.ymd.years).toBe(1);
            expect(result.ymd.months).toBe(2);
            expect(result.ymd.days).toBeGreaterThanOrEqual(13);
            expect(result.ymd.days).toBeLessThanOrEqual(15);
        });

        it('handles reversed dates', () => {
            const a = new Date(2024, 5, 15);
            const b = new Date(2024, 5, 1);
            const result = diffDates(a, b, false);
            expect(result.totalDays).toBe(14);
        });
    });
});
