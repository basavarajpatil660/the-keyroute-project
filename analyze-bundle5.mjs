import fs from 'fs';
const html = fs.readFileSync('dist/bundle-analysis.html', 'utf8');

// The data is embedded in a large JSON object. Let me find it by looking for "modules"
const idx = html.indexOf('"modules"');
if (idx >= 0) {
  console.log('Found "modules" at index', idx);
  console.log(html.substring(idx, idx + 500));
} else {
  console.log('"modules" not found');
  // Search for size
  const sizeIdx = html.indexOf('"size":');
  if (sizeIdx >= 0) {
    console.log('Found "size" at index', sizeIdx);
    console.log(html.substring(sizeIdx, sizeIdx + 500));
  }
}