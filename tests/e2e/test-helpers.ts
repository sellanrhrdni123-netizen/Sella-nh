/**
 * TataDana E2E Test Suite - Test Helpers & Lightweight Harness
 * Provides assertions, fixtures, store reset, and simulated Next.js route callers.
 */

import { store } from '../../src/lib/storage';
import { UserProfile, Wallet, Category, Budget, Transaction, PaymentRecord } from '../../src/lib/types';
import { POST as telegramWebhookPOST } from '../../src/app/api/telegram/webhook/route';
import { POST as midtransPOST } from '../../src/app/api/payments/midtrans/route';

// ==============================================================================
// ASSERTIONS
// ==============================================================================

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

export function assertTrue(condition: boolean, message: string = 'Expected condition to be true'): void {
  if (!condition) {
    throw new AssertionError(message);
  }
}

export function assertFalse(condition: boolean, message: string = 'Expected condition to be false'): void {
  if (condition) {
    throw new AssertionError(message);
  }
}

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    const defaultMsg = `Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`;
    throw new AssertionError(message ? `${message} (${defaultMsg})` : defaultMsg);
  }
}

export function assertNotEqual<T>(actual: T, notExpected: T, message?: string): void {
  if (actual === notExpected) {
    const defaultMsg = `Expected value not to equal ${JSON.stringify(notExpected)}`;
    throw new AssertionError(message ? `${message} (${defaultMsg})` : defaultMsg);
  }
}

export function assertContains(haystack: string, needle: string, message?: string): void {
  if (!haystack.includes(needle)) {
    const defaultMsg = `Expected string to contain "${needle}"\nFull string: "${haystack}"`;
    throw new AssertionError(message ? `${message}: ${defaultMsg}` : defaultMsg);
  }
}

export function assertGreaterThan(actual: number, expected: number, message?: string): void {
  if (actual <= expected) {
    throw new AssertionError(message || `Expected ${actual} > ${expected}`);
  }
}

export function assertGreaterThanOrEqual(actual: number, expected: number, message?: string): void {
  if (actual < expected) {
    throw new AssertionError(message || `Expected ${actual} >= ${expected}`);
  }
}

export async function assertThrowsAsync(
  fn: () => Promise<any>,
  expectedErrorSubstr?: string,
  message?: string
): Promise<void> {
  let threw = false;
  try {
    await fn();
  } catch (err: any) {
    threw = true;
    if (expectedErrorSubstr && !err.message.includes(expectedErrorSubstr)) {
      throw new AssertionError(
        `Expected error containing "${expectedErrorSubstr}", got "${err.message}"`
      );
    }
  }
  if (!threw) {
    throw new AssertionError(message || 'Expected function to throw an error, but it did not.');
  }
}

// ==============================================================================
// TEST RUNNER & SUITE DEFINITIONS
// ==============================================================================

export interface TestCaseResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export interface TestSuiteResult {
  suiteName: string;
  results: TestCaseResult[];
  passedCount: number;
  failedCount: number;
  totalDurationMs: number;
}

export class TestRunner {
  private suites: { name: string; fn: () => Promise<void> }[] = [];
  private currentResults: TestCaseResult[] = [];
  private allSuiteResults: TestSuiteResult[] = [];

  test(name: string, fn: () => void | Promise<void>) {
    return async () => {
      const start = Date.now();
      try {
        await fn();
        const duration = Date.now() - start;
        this.currentResults.push({ name, passed: true, durationMs: duration });
      } catch (err: any) {
        const duration = Date.now() - start;
        this.currentResults.push({
          name,
          passed: false,
          durationMs: duration,
          error: err.stack || err.message || String(err)
        });
      }
    };
  }

  async runSuite(suiteName: string, suiteFn: () => Promise<void>): Promise<TestSuiteResult> {
    this.currentResults = [];
    const suiteStart = Date.now();
    await suiteFn();
    const totalDuration = Date.now() - suiteStart;

    const passedCount = this.currentResults.filter(r => r.passed).length;
    const failedCount = this.currentResults.filter(r => !r.passed).length;

    const suiteResult: TestSuiteResult = {
      suiteName,
      results: [...this.currentResults],
      passedCount,
      failedCount,
      totalDurationMs: totalDuration
    };

    this.allSuiteResults.push(suiteResult);
    return suiteResult;
  }

  getResults(): TestSuiteResult[] {
    return this.allSuiteResults;
  }
}

// ==============================================================================
// STORE & WEBHOOK SIMULATION HELPERS
// ==============================================================================

/**
 * Resets the store to initial seed state before tests
 */
export function resetTestStore(): void {
  store.resetAll();
}

/**
 * Creates a mock NextRequest compatible with Next.js App Router route handlers
 */
export function createMockRequest(body: any, url: string = 'http://localhost:3000/api'): any {
  return {
    url,
    method: 'POST',
    json: async () => body,
    headers: new Headers({ 'content-type': 'application/json' })
  };
}

/**
 * Calls the Telegram Webhook route directly
 */
export async function callTelegramWebhook(payload: any): Promise<{ status: number; body: any }> {
  const req = createMockRequest(payload, 'http://localhost:3000/api/telegram/webhook');
  const res: any = await telegramWebhookPOST(req);
  const json = await res.json();
  return {
    status: res.status || 200,
    body: json
  };
}

/**
 * Calls the Midtrans Webhook route directly
 */
export async function callMidtransWebhook(payload: any): Promise<{ status: number; body: any }> {
  const req = createMockRequest(payload, 'http://localhost:3000/api/payments/midtrans');
  const res: any = await midtransPOST(req);
  const json = await res.json();
  return {
    status: res.status || 200,
    body: json
  };
}
