import { describe, it, expect } from 'vitest';
import { calculateAnnuityDetails, calculateDifferentiatedDetails } from '../logic/mortgage';

describe('mortgage detailed', () => {
    describe('calculateAnnuityDetails', () => {
        it('returns null for zero loan', () => {
            expect(calculateAnnuityDetails(0, 12, 10)).toBeNull();
        });

        it('returns null for zero rate', () => {
            expect(calculateAnnuityDetails(1000000, 0, 10)).toBeNull();
        });

        it('returns null for zero years', () => {
            expect(calculateAnnuityDetails(1000000, 12, 0)).toBeNull();
        });

        it('calculates annuity correctly', () => {
            const r = calculateAnnuityDetails(1_000_000, 12, 10);
            expect(r).not.toBeNull();
            expect(r!.loanAmount).toBe(1_000_000);
            expect(r!.monthlyPayment).toBeGreaterThan(10000);
            expect(r!.schedule.length).toBe(120);
            expect(r!.overpayment).toBeGreaterThan(0);
            expect(r!.totalPayment).toBeCloseTo(r!.monthlyPayment * 120, 2);
        });

        it('first and last payments are equal for annuity', () => {
            const r = calculateAnnuityDetails(500_000, 10, 5);
            expect(r).not.toBeNull();
            expect(r!.firstPayment).toBeCloseTo(r!.lastPayment, 2);
        });

        it('schedule balance ends near zero', () => {
            const r = calculateAnnuityDetails(1_000_000, 12, 20);
            expect(r).not.toBeNull();
            const lastBalance = r!.schedule[r!.schedule.length - 1].balance;
            expect(lastBalance).toBeLessThan(1); // near zero
        });

        it('schedule interest decreases over time', () => {
            const r = calculateAnnuityDetails(1_000_000, 12, 10);
            expect(r).not.toBeNull();
            const firstInterest = r!.schedule[0].interest;
            const lastInterest = r!.schedule[r!.schedule.length - 1].interest;
            expect(firstInterest).toBeGreaterThan(lastInterest);
        });
    });

    describe('calculateDifferentiatedDetails', () => {
        it('returns null for invalid inputs', () => {
            expect(calculateDifferentiatedDetails(-1, 12, 10)).toBeNull();
            expect(calculateDifferentiatedDetails(1000, -1, 10)).toBeNull();
            expect(calculateDifferentiatedDetails(1000, 12, 0)).toBeNull();
        });

        it('calculates differentiated correctly', () => {
            const r = calculateDifferentiatedDetails(1_000_000, 12, 10);
            expect(r).not.toBeNull();
            expect(r!.loanAmount).toBe(1_000_000);
            expect(r!.schedule.length).toBe(120);
            expect(r!.overpayment).toBeGreaterThan(0);
        });

        it('first payment is greater than last for differentiated', () => {
            const r = calculateDifferentiatedDetails(1_000_000, 12, 10);
            expect(r).not.toBeNull();
            expect(r!.firstPayment).toBeGreaterThan(r!.lastPayment);
        });

        it('payments decrease over time', () => {
            const r = calculateDifferentiatedDetails(1_000_000, 12, 10);
            expect(r).not.toBeNull();
            const first = r!.schedule[0].payment;
            const last = r!.schedule[r!.schedule.length - 1].payment;
            expect(first).toBeGreaterThan(last);
        });

        it('schedule balance ends near zero', () => {
            const r = calculateDifferentiatedDetails(1_000_000, 12, 20);
            expect(r).not.toBeNull();
            const lastBalance = r!.schedule[r!.schedule.length - 1].balance;
            expect(lastBalance).toBeLessThan(1);
        });
    });
});
