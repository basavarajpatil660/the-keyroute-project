import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function takeScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  
  // Dark theme (default)
  await page.goto('http://127.0.0.1:5175', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(__dirname, 'homepage-dark.png'), fullPage: true });
  
  // Light theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(__dirname, 'homepage-light.png'), fullPage: true });
  
  await browser.close();
  console.log('Full-page screenshots saved!');
}

takeScreenshots().catch(console.error);