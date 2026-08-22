import fs from 'fs';
const html = fs.readFileSync('dist/bundle-analysis.html', 'utf8');
const matches = html.match(/"name":".*?","size":\d+/g);
if (matches) {
  matches.slice(0, 50).forEach(m => console.log(m));
}