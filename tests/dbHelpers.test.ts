import { describe, it, expect } from 'vitest';
import { safeJsonParse } from '../lib/db-helpers';

describe('db-helpers', () => {
    describe('safeJsonParse', () => {
        it('parses valid JSON', () => {
            expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
        });

        it('parses valid JSON array', () => {
            expect(safeJsonParse('["a","b"]', [])).toEqual(['a', 'b']);
        });

        it('returns fallback for invalid JSON', () => {
            expect(safeJsonParse('not json', 'fallback')).toBe('fallback');
        });

        it('returns fallback for null', () => {
            expect(safeJsonParse(null, 42)).toBe(42);
        });

        it('returns fallback for undefined', () => {
            expect(safeJsonParse(undefined as unknown as string, [])).toEqual([]);
        });

        it('returns fallback for empty string', () => {
            expect(safeJsonParse('', 'default')).toBe('default');
        });

        it('handles non-string input gracefully', () => {
            expect(safeJsonParse(123 as unknown as string, 'fallback')).toBe('fallback');
        });
    });
});
