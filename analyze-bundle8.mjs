import fs from 'fs';
const html = fs.readFileSync('dist/bundle-analysis.html', 'utf8');

const dataStart = html.indexOf('const data = ');
const dataEnd = html.indexOf('};', dataStart);
const jsonStr = html.substring(dataStart + 'const data = '.length, dataEnd + 1);
const data = JSON.parse(jsonStr);

console.log('Data keys:', Object.keys(data));
console.log('modules type:', typeof data.modules);
console.log('modules keys:', data.modules ? Object.keys(data.modules) : 'none');

// Check first few b4609a9b keys
let count = 0;
for (const key of Object.keys(data)) {
  if (key.startsWith('b4609a9b-')) {
    console.log(`  ${key}:`, data[key]);
    count++;
    if (count >= 3) break;
  }
}