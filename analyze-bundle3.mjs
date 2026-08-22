import fs from 'fs';
const html = fs.readFileSync('dist/bundle-analysis.html', 'utf8');
// Search for various patterns
const patterns = [
  /"data"\s*:\s*(\[.*?\])/s,
  /const data = (\[.*?\])/s,
  /var data = (\[.*?\])/s,
  /data:\s*(\[.*?\])/s,
];

for (const pattern of patterns) {
  const match = html.match(pattern);
  if (match) {
    console.log('Found with pattern:', pattern);
    try {
      const data = JSON.parse(match[1]);
      data.sort((a, b) => b.size - a.size);
      data.slice(0, 30).forEach(item => {
        console.log(`${(item.size / 1024).toFixed(1)} kB - ${item.name}`);
      });
      break;
    } catch (e) {
      console.log('Failed to parse:', e.message);
    }
  }
}

if (!html.match(/"data"\s*:\s*\[/)) {
  console.log('No data pattern found in HTML');
  // Show a snippet around "data"
  const idx = html.indexOf('"data"');
  if (idx >= 0) {
    console.log(html.substring(idx, idx + 200));
  }
}