import { chromium } from 'playwright';

async function check404() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', error => {
    errors.push({ type: 'pageerror', text: error.message });
  });

  console.log('Testing /nonexistent route...');
  await page.goto('http://127.0.0.1:5173/nonexistent', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  
  const title = await page.title();
  const content = await page.textContent('body');
  
  console.log('Page title:', title);
  console.log('Content includes "404":', content?.includes('404'));
  console.log('Content includes "Page not found":', content?.includes('Page not found'));
  console.log('Content includes "Back to home":', content?.includes('Back to home'));
  
  if (errors.length > 0) {
    console.log('\nErrors:', errors);
  } else {
    console.log('\nNo console errors!');
  }
  
  await browser.close();
}

check404().catch(console.error);