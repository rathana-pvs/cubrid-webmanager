const path = require('path');

class CleanReporter {
  constructor(options = {}) {
    this.options = options;
    this.total = 0;
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.current = 0;
  }

  onBegin(config, suite) {
    this.total = suite.allTests().length;
    console.log(`\n🚀 Starting test run: ${this.total} test scenarios\n`);
  }

  onTestEnd(test, result) {
    this.current++;
    const num = `[${this.current}/${this.total}]`.padStart(8);
    const file = path.basename(test.location.file);
    const duration = (result.duration / 1000).toFixed(1) + 's';
    const title = test.title.replace(/^Scenario:\s*/i, '');

    if (result.status === 'passed') {
      this.passed++;
      console.log(` ✅ ${num} ${file} › ${title} (${duration})`);
    } else if (result.status === 'skipped') {
      this.skipped++;
      console.log(` ⚠️ ${num} ${file} › ${title} (SKIPPED)`);
    } else {
      this.failed++;
      console.log(` ❌ ${num} ${file} › ${title} (${duration})`);
      if (result.error && result.error.message) {
        const firstLine = result.error.message.split('\n')[0].trim();
        console.log(`     └─ Error: ${firstLine}`);
      }
    }
  }

  onEnd(result) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Test Summary: ${this.passed} passed, ${this.failed} failed, ${this.skipped} skipped (Total: ${this.total})`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
}

module.exports = CleanReporter;
