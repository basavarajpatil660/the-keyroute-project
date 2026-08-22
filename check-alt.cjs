const fs = require('fs');

function walk(d) {
  fs.readdirSync(d).forEach(f => {
    const p = d + '/' + f;
    const s = fs.statSync(p);
    if (s.isDirectory()) {
      walk(p);
    } else if (f.endsWith('.tsx')) {
      const c = fs.readFileSync(p, 'utf8');
      c.split('\n').forEach((l, i) => {
        const matches = l.match(/alt\s*=\s*["']([^"']*)["']/g);
        if (matches) {
          matches.forEach(m => {
            const valMatch = m.match(/alt\s*=\s*["']([^"']*)["']/);
            if (valMatch) {
              const val = valMatch[1];
              if (!val || val === '' || val === 'image' || val === 'img' || val === 'photo') {
                console.log(p, ':', i+1, 'alt="' + val + '"', l.trim());
              }
            }
          });
        }
      });
    }
  });
}

walk('src');