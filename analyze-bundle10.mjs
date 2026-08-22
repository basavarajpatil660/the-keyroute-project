import fs from 'fs';
const html = fs.readFileSync('dist/bundle-analysis.html', 'utf8');

const dataStart = html.indexOf('const data = ');
const dataEnd = html.indexOf('};', dataStart);
const jsonStr = html.substring(dataStart + 'const data = '.length, dataEnd + 1);
const data = JSON.parse(jsonStr);

console.log('nodeMetas sample:');
let count = 0;
for (const [key, meta] of Object.entries(data.nodeMetas || {})) {
  console.log(`  ${key}:`, meta);
  count++;
  if (count >= 10) break;
}

console.log('\nnodeParts sample (more):');
count = 0;
for (const [key, parts] of Object.entries(data.nodeParts || {})) {
  console.log(`  ${key}:`, parts);
  count++;
  if (count >= 20) break;
}

// The structure seems to be:
// - tree: module hierarchy with uids
// - nodeParts: maps uid -> { renderedLength, gzipLength, brotliLength, metaUid }
// - nodeMetas: maps metaUid -> { name, id, etc }

// Let's trace: tree node has uid -> nodeParts[uid] has metaUid -> nodeMetas[metaUid] has name/id

function collectModules(node, path = '') {
  const currentPath = path + (node.name || '');
  const result = [];
  
  if (node.uid) {
    const part = data.nodeParts[node.uid];
    if (part) {
      const meta = data.nodeMetas[part.metaUid];
      if (meta) {
        result.push({
          path: currentPath,
          size: part.gzipLength, // use gzip size
          renderedSize: part.renderedLength,
          name: meta.name,
          id: meta.id,
          uid: node.uid
        });
      }
    }
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

console.log('\n=== TOP 40 MODULES BY GZIP SIZE ===');
allModules.slice(0, 40).forEach((m, i) => {
  console.log(`${i+1}. ${(m.size/1024).toFixed(1)} kB (rendered: ${(m.renderedSize/1024).toFixed(1)} kB) - ${m.id || m.name} (${m.uid})`);
});

// Group by package
const byPackage = {};
for (const m of allModules) {
  let pkg = 'app';
  if (m.id) {
    const pkgMatch = m.id.match(/node_modules\/([^/]+)/);
    if (pkgMatch) pkg = pkgMatch[1];
  }
  if (!byPackage[pkg]) byPackage[pkg] = 0;
  byPackage[pkg] += m.size;
}

console.log('\n=== BY PACKAGE (GZIP) ===');
Object.entries(byPackage)
  .sort((a, b) => b[1] - a[1])
  .forEach(([pkg, size]) => {
    console.log(`${(size/1024).toFixed(1)} kB - ${pkg}`);
  });