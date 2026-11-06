import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.jsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(path.resolve('src'));
let issues = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check for hardcoded plain English words between tags >Word<
    const matches = line.match(/>\s*([A-Za-z]{3,}[^<{]*)\s*</g);
    if (matches) {
      matches.forEach(m => {
        const text = m.replace(/[><]/g, '').trim();
        // Ignore known safe words like HTML entities, numbers, common tags
        if (!text.includes('{') && !text.includes('t(') && text.length > 2) {
          console.log(`[${path.basename(file)}:${idx + 1}] Possible hardcoded text: "${text}"`);
          issues++;
        }
      });
    }
  });
});

console.log(`Scan completed. Found ${issues} items to review.`);
