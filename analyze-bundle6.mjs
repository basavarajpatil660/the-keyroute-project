import fs from 'fs';
const html = fs.readFileSync('dist/bundle-analysis.html', 'utf8');

const sizeIdx = html.indexOf('"size":');
if (sizeIdx >= 0) {
  console.log('Found "size" at index', sizeIdx);
  console.log(html.substring(sizeIdx, sizeIdx + 500));
} else {
  console.log('"size" not found');
}