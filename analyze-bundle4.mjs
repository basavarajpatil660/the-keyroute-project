import fs from 'fs';
const html = fs.readFileSync('dist/bundle-analysis.html', 'utf8');

// Find the module data - it's in the format: "b4609a9b-XXX":{"id":"...","size":...}
const moduleMatches = html.match(/"b4609a9b-\d+":\{[^}]*"size":\d+/g);
if (moduleMatches) {
  const modules = [];
  for (const match of moduleMatches) {
    const idMatch = match.match(/"id":"([^"]+)"/);
    const sizeMatch = match.match(/"size":(\d+)/);
    if (idMatch && sizeMatch) {
      modules.push({
        id: idMatch[1],
        size: parseInt(sizeMatch[1])
      });
    }
  }
  modules.sort((a, b) => b.size - a.size);
  console.log('=== TOP MODULES BY SIZE ===');
  modules.slice(0, 30).forEach((m, i) => {
    const kb = (m.size / 1024).toFixed(1);
    console.log(`${i+1}. ${kb} kB - ${m.id}`);
  });
  
  // Group by package
  const byPackage = {};
  for (const m of modules) {
    const pkgMatch = m.id.match(/node_modules\/([^/]+)/);
    const pkg = pkgMatch ? pkgMatch[1] : 'app';
    if (!byPackage[pkg]) byPackage[pkg] = 0;
    byPackage[pkg] += m.size;
  }
  console.log('\n=== BY PACKAGE ===');
  Object.entries(byPackage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([pkg, size]) => {
      console.log(`${(size / 1024).toFixed(1)} kB - ${pkg}`);
    });
}