import { describe, it, expect } from 'vitest';
import { normalizeExpression, equationToZero, solveEquations } from '../logic/equations';

describe('equations logic', () => {
    describe('normalizeExpression', () => {
        it('replaces Pi with pi', () => {
            expect(normalizeExpression('2*Pi')).toBe('2*pi');
        });

        it('replaces Ln( with log(', () => {
            expect(normalizeExpression('Ln(x)')).toBe('log(x)');
        });

        it('replaces Sin/Cos/Tan', () => {
            expect(normalizeExpression('Sin(x)')).toBe('sin(x)');
            expect(normalizeExpression('Cos(x)')).toBe('cos(x)');
            expect(normalizeExpression('Tan(x)')).toBe('tan(x)');
        });

        it('replaces tg with tan', () => {
            expect(normalizeExpression('tg(x)')).toBe('tan(x)');
        });

        it('replaces |x| with abs(x)', () => {
            expect(normalizeExpression('|x + 1|')).toBe('abs(x + 1)');
        });

        it('replaces bracket notation Cos[x] with cos(x)', () => {
            expect(normalizeExpression('Cos[x]')).toBe('cos(x)');
        });

        it('returns empty string for empty input', () => {
            expect(normalizeExpression('')).toBe('');
        });

        it('handles trimming', () => {
            expect(normalizeExpression('  Sin(x)  ')).toBe('sin(x)');
        });
    });

    describe('equationToZero', () => {
        it('converts equation to zero form', () => {
            expect(equationToZero('x=5')).toBe('(x)-(5)');
        });

        it('handles already-zero-form expressions', () => {
            expect(equationToZero('x+1')).toBe('x+1');
        });

        it('handles equations with normalizations', () => {
            const r = equationToZero('Sin(x)=0');
            expect(r).toBe('(sin(x))-(0)');
        });
    });

    describe('solveEquations', () => {
        it('returns error for empty equations', () => {
            const result = solveEquations([], [], {});
            expect(result.converged).toBe(false);
            expect(result.message).toBeTruthy();
        });

        it('solves simple linear equation x = 5', () => {
            const result = solveEquations(['x - 5'], ['x'], { x: 0 }, { maxIterations: 50, restarts: 3 });
            expect(result.converged).toBe(true);
            expect(result.solutions.length).toBeGreaterThanOrEqual(1);
            expect(result.solutions[0].x).toBeCloseTo(5, 4);
        });

        it('solves x^2 = 4', () => {
            const result = solveEquations(['x^2 - 4'], ['x'], { x: 1 }, { restarts: 10 });
            expect(result.converged).toBe(true);
            // Should find at least one root (2 or -2)
            const hasRoot = result.solutions.some(s => Math.abs(Math.abs(s.x) - 2) < 0.01);
            expect(hasRoot).toBe(true);
        });

        it('solves 2-variable system x+y=3, x-y=1', () => {
            const result = solveEquations(
                ['x + y - 3', 'x - y - 1'],
                ['x', 'y'],
                { x: 0, y: 0 },
                { maxIterations: 50 },
            );
            expect(result.converged).toBe(true);
            expect(result.solutions[0].x).toBeCloseTo(2, 4);
            expect(result.solutions[0].y).toBeCloseTo(1, 4);
        });
    });
});
