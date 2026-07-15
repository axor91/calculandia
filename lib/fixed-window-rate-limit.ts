export type FixedWindowRateLimiterOptions = {
  windowMs: number;
  perKeyLimit: number;
  globalLimit: number;
};

export class FixedWindowRateLimiter {
  private windowStartedAt = 0;
  private globalCount = 0;
  private readonly countsByKey = new Map<string, number>();

  constructor(private readonly options: FixedWindowRateLimiterOptions) {
    if (
      options.windowMs <= 0 ||
      options.perKeyLimit <= 0 ||
      options.globalLimit < options.perKeyLimit
    ) {
      throw new Error("Invalid fixed-window rate limiter options");
    }
  }

  consume(key: string, now = Date.now()): boolean {
    if (
      this.windowStartedAt === 0 ||
      now - this.windowStartedAt >= this.options.windowMs
    ) {
      this.windowStartedAt = now;
      this.globalCount = 0;
      this.countsByKey.clear();
    }

    const keyCount = this.countsByKey.get(key) || 0;
    if (
      keyCount >= this.options.perKeyLimit ||
      this.globalCount >= this.options.globalLimit
    ) {
      return false;
    }

    this.countsByKey.set(key, keyCount + 1);
    this.globalCount += 1;
    return true;
  }
}
