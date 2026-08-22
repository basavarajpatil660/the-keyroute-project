const { chromium } = require('playwright');
const path = require('path');

async function takeScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Navigate to the dev server
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  // Wait for hero to be visible
  await page.waitForSelector('svg[aria-hidden="true"]', { timeout: 10000 });
  
  // Take dark theme screenshot (default)
  await page.screenshot({ 
    path: path.join(__dirname, 'hero-dark.png'),
    fullPage: false,
    clip: { x: 0, y: 0, width: 1440, height: 900 }
  });
  console.log('Dark theme screenshot saved: hero-dark.png');
  
  // Switch to light theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  
  // Wait for theme transition
  await page.waitForTimeout(500);
  
  // Take light theme screenshot
  await page.screenshot({ 
    path: path.join(__dirname, 'hero-light.png'),
    fullPage: false,
    clip: { x: 0, y: 0, width: 1440, height: 900 }
  });
  console.log('Light theme screenshot saved: hero-light.png');
  
  await browser.close();
}

takeScreenshots().catch(console.error);