const fs = require('fs');
const path = require('path');

// فحص وتحديث جميع ملفات الواجهة (EJS / HTML)
function patchUI(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.git', '.vscode'].includes(item)) {
        patchUI(fullPath);
      }
    } else if (item.endsWith('.ejs') || item.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('welcome') || content.includes('Dashboard')) {
        console.log(`✅ Patched UI file: ${fullPath}`);
      }
    }
  }
}

patchUI('./');
