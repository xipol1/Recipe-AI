const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';

if (isWindows) {
  process.exit(0);
}

const binDir = path.join(process.cwd(), 'node_modules', '.bin');

if (!fs.existsSync(binDir)) {
  process.exit(0);
}

for (const file of fs.readdirSync(binDir)) {
  const fullPath = path.join(binDir, file);
  try {
    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) continue;
    const mode = stats.mode | 0o755;
    fs.chmodSync(fullPath, mode);
  } catch (error) {
    // no-op: best-effort permission fix
    void error;
  }
}

console.log('✅ Local bin permissions checked');
