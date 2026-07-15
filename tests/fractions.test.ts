import { describe, it, expect } from 'vitest';
import {
    simplifyFraction,
    addFractions,
    subFractions,
    mulFractions,
    divFractions,
    fromMixed,
    toMixed,
} from '../logic/fractions';

describe('fractions logic', () => {
    describe('simplifyFraction', () => {
        it('simplifies 2/4 to 1/2', () => {
            const r = simplifyFraction({ numerator: 2, denominator: 4 });
            expect(r.numerator).toBe(1);
            expect(r.denominator).toBe(2);
        });

        it('simplifies 6/9 to 2/3', () => {
            const r = simplifyFraction({ numerator: 6, denominator: 9 });
            expect(r.numerator).toBe(2);
            expect(r.denominator).toBe(3);
        });

        it('handles negative denominator', () => {
            const r = simplifyFraction({ numerator: 3, denominator: -6 });
            expect(r.numerator).toBe(-1);
            expect(r.denominator).toBe(2);
        });

        it('handles negative numerator', () => {
            const r = simplifyFraction({ numerator: -4, denominator: 8 });
            expect(r.numerator).toBe(-1);
            expect(r.denominator).toBe(2);
        });

        it('returns NaN for zero denominator', () => {
            const r = simplifyFraction({ numerator: 5, denominator: 0 });
            expect(r.numerator).toBeNaN();
            expect(r.denominator).toBeNaN();
        });

        it('returns NaN for non-finite inputs', () => {
            expect(simplifyFraction({ numerator: NaN, denominator: 1 }).numerator).toBeNaN();
            expect(simplifyFraction({ numerator: 1, denominator: Infinity }).denominator).toBeNaN();
        });

        it('keeps 0/5 as 0/1', () => {
            const r = simplifyFraction({ numerator: 0, denominator: 5 });
            expect(r.numerator).toBe(0);
            expect(r.denominator).toBe(1);
        });
    });

    describe('addFractions', () => {
        it('adds 1/2 + 1/3 = 5/6', () => {
            const r = addFractions({ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 3 });
            expect(r).not.toBeNull();
            expect(r!.numerator).toBe(5);
            expect(r!.denominator).toBe(6);
        });

        it('returns null for zero denominator', () => {
            expect(addFractions({ numerator: 1, denominator: 0 }, { numerator: 1, denominator: 3 })).toBeNull();
        });
    });

    describe('subFractions', () => {
        it('subtracts 3/4 - 1/4 = 1/2', () => {
            const r = subFractions({ numerator: 3, denominator: 4 }, { numerator: 1, denominator: 4 });
            expect(r).not.toBeNull();
            expect(r!.numerator).toBe(1);
            expect(r!.denominator).toBe(2);
        });

        it('subtracts 1/3 - 1/2 = -1/6', () => {
            const r = subFractions({ numerator: 1, denominator: 3 }, { numerator: 1, denominator: 2 });
            expect(r).not.toBeNull();
            expect(r!.numerator).toBe(-1);
            expect(r!.denominator).toBe(6);
        });
    });

    describe('mulFractions', () => {
        it('multiplies 2/3 * 3/4 = 1/2', () => {
            const r = mulFractions({ numerator: 2, denominator: 3 }, { numerator: 3, denominator: 4 });
            expect(r).not.toBeNull();
            expect(r!.numerator).toBe(1);
            expect(r!.denominator).toBe(2);
        });

        it('returns null for zero denominator', () => {
            expect(mulFractions({ numerator: 1, denominator: 0 }, { numerator: 1, denominator: 2 })).toBeNull();
        });
    });

    describe('divFractions', () => {
        it('divides 1/2 ÷ 1/4 = 2/1', () => {
            const r = divFractions({ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 4 });
            expect(r).not.toBeNull();
            expect(r!.numerator).toBe(2);
            expect(r!.denominator).toBe(1);
        });

        it('returns null when dividing by 0/n', () => {
            expect(divFractions({ numerator: 1, denominator: 2 }, { numerator: 0, denominator: 3 })).toBeNull();
        });
    });

    describe('fromMixed', () => {
        it('converts 1 1/2 to 3/2', () => {
            const r = fromMixed(1, 1, 2);
            expect(r).not.toBeNull();
            expect(r!.numerator).toBe(3);
            expect(r!.denominator).toBe(2);
        });

        it('converts 2 3/4 to 11/4', () => {
            const r = fromMixed(2, 3, 4);
            expect(r).not.toBeNull();
            expect(r!.numerator).toBe(11);
            expect(r!.denominator).toBe(4);
        });

        it('returns null for zero denominator', () => {
            expect(fromMixed(1, 1, 0)).toBeNull();
        });
    });

    describe('toMixed', () => {
        it('converts 7/3 to 2 1/3', () => {
            const r = toMixed({ numerator: 7, denominator: 3 });
            expect(r).not.toBeNull();
            expect(r!.whole).toBe(2);
            expect(r!.numerator).toBe(1);
            expect(r!.denominator).toBe(3);
        });

        it('converts 1/3 to 0 1/3', () => {
            const r = toMixed({ numerator: 1, denominator: 3 });
            expect(r).not.toBeNull();
            expect(r!.whole).toBe(0);
            expect(r!.numerator).toBe(1);
            expect(r!.denominator).toBe(3);
        });

        it('returns null for NaN inputs', () => {
            expect(toMixed({ numerator: NaN, denominator: 1 })).toBeNull();
        });
    });
});
