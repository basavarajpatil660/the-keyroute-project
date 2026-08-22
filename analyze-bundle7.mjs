import fs from 'fs';
const html = fs.readFileSync('dist/bundle-analysis.html', 'utf8');

// Find the start of the data object
const dataStart = html.indexOf('const data = ');
if (dataStart < 0) {
  console.log('const data not found');
  process.exit(1);
}

// Find the end of the data object - it ends with }; before the next const
const dataEnd = html.indexOf('};', dataStart);
if (dataEnd < 0) {
  console.log('Data end not found');
  process.exit(1);
}

const jsonStr = html.substring(dataStart + 'const data = '.length, dataEnd + 1);
const data = JSON.parse(jsonStr);

// Now we have the tree structure in data.modules
// And the module details in data.modules...uid entries

// First, extract all leaf modules with their uids
const leaves = [];
function extractLeaves(node, path = '') {
  if (node.uid) {
    leaves.push({ path: path + node.name, uid: node.uid });
  }
  if (node.children) {
    for (const child of node.children) {
      extractLeaves(child, path + node.name + '/');
    }
  }
}

extractLeaves(data.modules);

// Now map uids to their size from the flat module list at the bottom
const moduleDetails = data.modules; // This is actually the flat list with uid keys

// Wait, the structure is: data = { modules: { tree }, "b4609a9b-XXX": { module details }, ... }
// Let me check the keys of data
const keys = Object.keys(data);
console.log('Data keys:', keys);

if (keys.includes('modules')) {
  // The flat module details are the other keys
  for (const key of keys) {
    if (key.startsWith('b4609a9b-') && data[key].size) {
      // Found a module detail
    }
  }
  
  // Build size map
  const sizeMap = {};
  for (const key of keys) {
    if (key.startsWith('b4609a9b-') && data[key].size) {
      sizeMap[key] = data[key].size;
    }
  }
  
  console.log('\n=== TOP MODULES BY SIZE ===');
  const leafSizes = leaves.map(leaf => ({
    path: leaf.path,
    size: sizeMap[leaf.uid] || 0,
    uid: leaf.uid
  })).filter(l => l.size > 0).sort((a, b) => b.size - a.size);
  
  leafSizes.slice(0, 40).forEach((l, i) => {
    console.log(`${i+1}. ${(l.size/1024).toFixed(1)} kB - ${l.path} (${l.uid})`);
  });
  
  // Group by top-level package
  const byPackage = {};
  for (const l of leafSizes) {
    const pkgMatch = l.path.match(/node_modules\/([^/]+)/);
    const pkg = pkgMatch ? pkgMatch[1] : 'app';
    if (!byPackage[pkg]) byPackage[pkg] = 0;
    byPackage[pkg] += l.size;
  }
  
  console.log('\n=== BY PACKAGE ===');
  Object.entries(byPackage)
    .sort((a, b) => b[1] - a[1])
    .forEach(([pkg, size]) => {
      console.log(`${(size/1024).toFixed(1)} kB - ${pkg}`);
    });
}