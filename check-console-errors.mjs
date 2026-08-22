import { chromium } from 'playwright';

const routes = [
  '/',
  '/signin',
  '/docs',
  '/pricing',
  '/dashboard',
  '/dashboard/overview',
  '/dashboard/activity',
  '/dashboard/connections',
  '/dashboard/keys',
  '/dashboard/usage',
  '/dashboard/settings',
];

async function checkConsoleErrors() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      allErrors.push({
        route: page.url(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      });
    }
  });

  page.on('pageerror', error => {
    allErrors.push({
      route: page.url(),
      type: 'pageerror',
      text: error.message,
      stack: error.stack,
    });
  });

  for (const route of routes) {
    console.log(`\n--- Checking ${route} ---`);
    try {
      await page.goto(`http://127.0.0.1:5173${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000); // Wait for any async errors
      console.log(`  Navigated to ${route}`);
    } catch (e) {
      console.log(`  Failed to navigate to ${route}: ${e.message}`);
    }
  }

  await browser.close();

  console.log('\n\n=== CONSOLE ERRORS/WARNINGS FOUND ===');
  if (allErrors.length === 0) {
    console.log('NONE');
  } else {
    allErrors.forEach((err, i) => {
      console.log(`\n${i + 1}. [${err.type.toUpperCase()}] ${err.route}`);
      console.log(`   ${err.text}`);
      if (err.location) {
        console.log(`   at ${err.location.url}:${err.location.lineNumber}:${err.location.columnNumber}`);
      }
      if (err.stack) {
        console.log(`   Stack: ${err.stack.split('\n').slice(0, 3).join('\n      ')}`);
      }
    });
  }

  return allErrors;
}

checkConsoleErrors().catch(console.error);