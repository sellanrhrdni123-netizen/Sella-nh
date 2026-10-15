/**
 * TataDana Unified Adversarial Stress Test Runner (Tiers 1-5)
 * Runs M1, M2, M3, M4, and M5 adversarial suites.
 */

import { runM1AdversarialTests } from './m1-adversarial.test';
import { runM2AdversarialTests } from './m2-adversarial.test';
import { runM3AdversarialTests } from './m3-adversarial.test';
import { runM4AdversarialTests } from './m4-adversarial.test';
import { runM5AdversarialTests } from './m5-adversarial.test';

export async function runAllAdversarialSuites() {
  console.log('\n================================================================================');
  console.log('⚔️  TATADANA ADVERSARIAL STRESS TEST SUITE (MILESTONES 1 TO 5)');
  console.log('================================================================================\n');

  const m1Results = await runM1AdversarialTests();
  console.log(`M1 (Database & Client): ${m1Results.filter(r => r.passed).length}/${m1Results.length} passed`);

  const m2Results = await runM2AdversarialTests();
  console.log(`M2 (Telegram Engine & Limits): ${m2Results.filter(r => r.passed).length}/${m2Results.length} passed`);

  const m3Results = await runM3AdversarialTests();
  console.log(`M3 (AI Multi-Provider & Multimodal): ${m3Results.filter(r => r.passed).length}/${m3Results.length} passed`);

  const m4Results = await runM4AdversarialTests();
  console.log(`M4 (Dashboard, Reports & Exports): ${m4Results.filter(r => r.passed).length}/${m4Results.length} passed`);

  const m5Results = await runM5AdversarialTests();
  console.log(`M5 (Admin Security, Payments & Landing): ${m5Results.filter(r => r.passed).length}/${m5Results.length} passed`);

  const allResults = [...m1Results, ...m2Results, ...m3Results, ...m4Results, ...m5Results];
  const totalPassed = allResults.filter(r => r.passed).length;
  const totalFailed = allResults.filter(r => !r.passed).length;

  console.log('\n================================================================================');
  console.log(`TOTAL ADVERSARIAL TESTS: ${allResults.length} | PASSED: ${totalPassed} | FAILED: ${totalFailed}`);
  console.log(`PASS RATE: ${((totalPassed / allResults.length) * 100).toFixed(1)}%`);
  console.log('================================================================================\n');

  return {
    total: allResults.length,
    passed: totalPassed,
    failed: totalFailed,
    allPassed: totalFailed === 0
  };
}

if (require.main === module) {
  runAllAdversarialSuites().then(res => {
    if (!res.allPassed) {
      process.exit(1);
    }
  });
}
