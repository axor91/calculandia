import { describe, it, expect } from 'vitest';
import { calculatorUpdateSchema, normalizeKeywords } from '../lib/validation';

describe('validation', () => {
  it('accepts valid payload', () => {
    const payload = {
      id: 'percent-diff',
      seo: {
        title: 'Заголовок',
        description: 'Описание',
        keywords: ['a', 'b', 'c'],
      },
      content: {
        afterCalculator: '<h2>Ok</h2>',
        faq: [{ question: 'Q', answer: 'A' }],
      },
      ads: {
        topBanner: { enabled: true, code: '<!-- ad -->' },
      },
    };
    const res = calculatorUpdateSchema.safeParse(payload);
    expect(res.success).toBe(true);
  });

  it('rejects invalid keywords and empty seo', () => {
    const res = calculatorUpdateSchema.safeParse({ id: '', seo: { title: '', description: '', keywords: [] } });
    expect(res.success).toBe(false);
  });

  it('normalizeKeywords dedupes and trims, caps at 50', () => {
    const input = [' A ', 'a', 'B', 'b', ...Array(100).fill('x')];
    const out = normalizeKeywords(input as string[]);
    expect(out[0]).toBe('A');
    expect(out[1]).toBe('B');
    expect(out.length).toBeLessThanOrEqual(50);
  });
});


