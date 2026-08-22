const fs = require('fs');
const html = fs.readFileSync('dist/index.html', 'utf8');
console.log(html.includes('lang="en"') ? 'OK: lang="en" present in dist' : 'MISSING: lang="en" in dist');
const match = html.match(/<html[^>]*>/);
if (match) console.log('HTML tag:', match[0]);