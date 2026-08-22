import fs from 'fs';
const html = fs.readFileSync('dist/bundle-analysis.html', 'utf8');

const dataStart = html.indexOf('const data = ');
const dataEnd = html.indexOf('};', dataStart);
const jsonStr = html.substring(dataStart + 'const data = '.length, dataEnd + 1);
const data = JSON.parse(jsonStr);

console.log('Data keys:', Object.keys(data));

// tree has the module hierarchy
console.log('\n--- Tree structure (first level) ---');
if (data.tree && data.tree.children) {
  data.tree.children.slice(0, 5).forEach(c => console.log('  ', c.name));
}

// nodeMetas has the size info
console.log('\n--- nodeMetas sample ---');
let count = 0;
for (const [key, meta] of Object.entries(data.nodeMetas || {})) {
  if (meta.size) {
    console.log(`  ${key}: size=${meta.size}, name=${meta.name}`);
    count++;
    if (count >= 10) break;
  }
}

// nodeParts has the module ids
console.log('\n--- nodeParts sample ---');
count = 0;
for (const [key, parts] of Object.entries(data.nodeParts || {})) {
  console.log(`  ${key}:`, parts);
  count++;
  if (count >= 5) break;
}

// Let's traverse the tree and collect sizes
function collectModules(node, path = '') {
  const currentPath = path + (node.name || '');
  const result = [];
  
  if (node.uid && data.nodeMetas[node.uid]?.size) {
    result.push({
      path: currentPath,
      size: data.nodeMetas[node.uid].size,
      uid: node.uid
    });
  }
  
  if (node.children) {
    for (const child of node.children) {
      result.push(...collectModules(child, currentPath + '/'));
    }
  }
  return result;
}

const allModules = collectModules(data.tree);
allModules.sort((a, b) => b.size - a.size);

console.log('\n=== TOP 40 MODULES BY SIZE ===');
allModules.slice(0, 40).forEach((m, i) => {
  console.log(`${i+1}. ${(m.size/1024).toFixed(1)} kB - ${m.path} (${m.uid})`);
});

// Group by package
const byPackage = {};
for (const m of allModules) {
  const pkgMatch = m.path.match(/node_modules\/([^/]+)/);
  const pkg = pkgMatch ? pkgMatch[1] : 'app';
  if (!byPackage[pkg]) byPackage[pkg] = 0;
  byPackage[pkg] += m.size;
}

console.log('\n=== BY PACKAGE ===');
Object.entries(byPackage)
  .sort((a, b) => b[1] - a[1])
  .forEach(([pkg, size]) => {
    console.log(`${(size/1024).toFixed(1)} kB - ${pkg}`);
  });