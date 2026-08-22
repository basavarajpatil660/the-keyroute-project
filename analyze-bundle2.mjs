import fs from 'fs';
const html = fs.readFileSync('dist/bundle-analysis.html', 'utf8');
// Find the data section
const dataMatch = html.match(/const data = (\[.*?\]);/s);
if (dataMatch) {
  try {
    const data = JSON.parse(dataMatch[1]);
    // Sort by size
    data.sort((a, b) => b.size - a.size);
    data.slice(0, 30).forEach(item => {
      console.log(`${(item.size / 1024).toFixed(1)} kB - ${item.name}`);
    });
  } catch (e) {
    console.log('Failed to parse:', e.message);
  }
} else {
  console.log('Data pattern not found');
}