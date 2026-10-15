/**
 * TataDana Unified E2E Test Runner
 * Executes Tier 1, Tier 2, Tier 3, and Tier 4 suites and outputs structured report.
 * Can be run via: npx tsx tests/e2e/run-all.ts or npm run test:e2e
 */

import { runTier1Tests } from './tier1.test';
import { runTier2Tests } from './tier2.test';
import { runTier3Tests } from './tier3.test';
import { runTier4Tests } from './tier4.test';

interface SuiteResult {
  suiteName: string;
  tier: number;
  results: { name: string; passed: boolean; error?: string }[];
  durationMs: number;
}

export async function runAllSuites(): Promise<{ success: boolean; suites: SuiteResult[] }> {
  console.log('\n================================================================================');
  console.log('🚀 TATADANA E2E TEST SUITE (SYSTEMATIC 4-TIER METHODOLOGY)');
  console.log('================================================================================\n');

  const overallStart = Date.now();
  const suites: SuiteResult[] = [];

  // Tier 1
  console.log('📦 Executing Tier 1: Feature Coverage (Core Feature Completeness)...');
  const t1Start = Date.now();
  const t1Results = await runTier1Tests();
  const t1Duration = Date.now() - t1Start;
  suites.push({
    suiteName: 'Tier 1 - Feature Coverage',
    tier: 1,
    results: t1Results,
    durationMs: t1Duration
  });
  console.log(`   └─ Completed ${t1Results.length} tests in ${t1Duration}ms (Passed: ${t1Results.filter(r => r.passed).length}/${t1Results.length})`);

  // Tier 2
  console.log('\n🛡️ Executing Tier 2: Boundary & Corner Cases (Resilience & Edge Stress)...');
  const t2Start = Date.now();
  const t2Results = await runTier2Tests();
  const t2Duration = Date.now() - t2Start;
  suites.push({
    suiteName: 'Tier 2 - Boundary & Corner Cases',
    tier: 2,
    results: t2Results,
    durationMs: t2Duration
  });
  console.log(`   └─ Completed ${t2Results.length} tests in ${t2Duration}ms (Passed: ${t2Results.filter(r => r.passed).length}/${t2Results.length})`);

  // Tier 3
  console.log('\n🔗 Executing Tier 3: Cross-Feature Interactions (Pairwise Pipelines)...');
  const t3Start = Date.now();
  const t3Results = await runTier3Tests();
  const t3Duration = Date.now() - t3Start;
  suites.push({
    suiteName: 'Tier 3 - Cross-Feature Interactions',
    tier: 3,
    results: t3Results,
    durationMs: t3Duration
  });
  console.log(`   └─ Completed ${t3Results.length} tests in ${t3Duration}ms (Passed: ${t3Results.filter(r => r.passed).length}/${t3Results.length})`);

  // Tier 4
  console.log('\n🇮🇩 Executing Tier 4: Real-World Indonesian User Scenarios (Full Journeys)...');
  const t4Start = Date.now();
  const t4Results = await runTier4Tests();
  const t4Duration = Date.now() - t4Start;
  suites.push({
    suiteName: 'Tier 4 - Real-World Application Scenarios',
    tier: 4,
    results: t4Results,
    durationMs: t4Duration
  });
  console.log(`   └─ Completed ${t4Results.length} tests in ${t4Duration}ms (Passed: ${t4Results.filter(r => r.passed).length}/${t4Results.length})`);

  const overallDuration = Date.now() - overallStart;

  // Print Summary Table
  console.log('\n================================================================================');
  console.log('📊 TATADANA E2E TEST EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log('| Suite Name                             | Total | Pass | Fail | Pass Rate | Time   |');
  console.log('|----------------------------------------|-------|------|------|-----------|--------|');

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const s of suites) {
    const total = s.results.length;
    const passed = s.results.filter(r => r.passed).length;
    const failed = s.results.filter(r => !r.passed).length;
    const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    totalTests += total;
    totalPassed += passed;
    totalFailed += failed;

    const padSuite = s.suiteName.padEnd(38);
    const padTotal = String(total).padStart(5);
    const padPass = String(passed).padStart(4);
    const padFail = String(failed).padStart(4);
    const padRate = `${rate}%`.padStart(9);
    const padTime = `${s.durationMs}ms`.padStart(6);

    console.log(`| ${padSuite} | ${padTotal} | ${padPass} | ${padFail} | ${padRate} | ${padTime} |`);
  }

  const overallRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
  console.log('|----------------------------------------|-------|------|------|-----------|--------|');
  console.log(`| OVERALL TOTAL                          | ${String(totalTests).padStart(5)} | ${String(totalPassed).padStart(4)} | ${String(totalFailed).padStart(4)} | ${`${overallRate}%`.padStart(9)} | ${`${overallDuration}ms`.padStart(6)} |`);
  console.log('================================================================================');

  // Print Failures if any
  if (totalFailed > 0) {
    console.log('\n❌ FAILED TEST DETAILS:');
    for (const s of suites) {
      for (const r of s.results) {
        if (!r.passed) {
          console.log(`\n• [${s.suiteName}] ${r.name}`);
          console.log(`  Error: ${r.error}`);
        }
      }
    }
  } else {
    console.log('\n✨ ALL TESTS PASSED! E2E SUITE IS 100% GREEN.');
  }

  const success = totalFailed === 0;
  return { success, suites };
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllSuites().then(({ success }) => {
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
  });
} else if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('run-all')) {
  runAllSuites().then(({ success }) => {
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
  });
}
