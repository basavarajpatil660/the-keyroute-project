const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
console.log(html.includes('lang="en"') ? 'OK: lang="en" present' : 'MISSING: lang="en"');
const match = html.match(/<html[^>]*>/);
if (match) console.log('HTML tag:', match[0]);