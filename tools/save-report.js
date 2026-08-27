const fs = require('fs');
const path = require('path');

let srcDir = path.resolve(__dirname, '../e2e/artifacts/web-report');
if (process.argv[3]) {
  srcDir = path.resolve(__dirname, '..', process.argv[3]);
} else if (!fs.existsSync(srcDir) && fs.existsSync(path.resolve(__dirname, '../e2e/artifacts/electron-report'))) {
  srcDir = path.resolve(__dirname, '../e2e/artifacts/electron-report');
}
const baseDestDir = path.resolve(__dirname, '../e2e/artifacts/saved-reports');

if (!fs.existsSync(srcDir)) {
  console.error(`\n❌ No report found at ${srcDir} to save.`);
  console.error('   Run tests first before saving the report.\n');
  process.exit(1);
}

const customName = process.argv[2] ? `-${process.argv[2].replace(/[^a-zA-Z0-9_-]/g, '_')}` : '';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
const folderName = `report_${timestamp}${customName}`;
const destDir = path.join(baseDestDir, folderName);

fs.mkdirSync(destDir, { recursive: true });
fs.cpSync(srcDir, destDir, { recursive: true });

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Report successfully saved to:`);
console.log(`   📂 ${destDir}`);
console.log('\n🔍 To view this saved report at any time:');
console.log(`   npx playwright show-report e2e/artifacts/saved-reports/${folderName}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
