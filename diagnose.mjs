import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function diagnose() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Check for horizontal overflow
  const overflow = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    return {
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
      htmlScrollWidth: html.scrollWidth,
      htmlClientWidth: html.clientWidth,
      hasHorizontalScrollbar: body.scrollWidth > body.clientWidth || html.scrollWidth > html.clientWidth,
    };
  });
  console.log('=== OVERFLOW CHECK ===');
  console.log(JSON.stringify(overflow, null, 2));
  
  // Check root font-size
  const rootFontSize = await page.evaluate(() => {
    const html = document.documentElement;
    const computed = getComputedStyle(html);
    return {
      fontSize: computed.fontSize,
      fontSizePx: parseFloat(computed.fontSize),
    };
  });
  console.log('\n=== ROOT FONT SIZE ===');
  console.log(JSON.stringify(rootFontSize, null, 2));
  
  // Check hero grid
  const heroGrid = await page.evaluate(() => {
    const grid = document.querySelector('.hero-grid');
    if (!grid) return { found: false };
    const computed = getComputedStyle(grid);
    const rect = grid.getBoundingClientRect();
    const children = Array.from(grid.children).map((child, i) => ({
      index: i,
      tagName: child.tagName,
      className: child.className,
      rect: child.getBoundingClientRect(),
      computedWidth: getComputedStyle(child).width,
      computedMinWidth: getComputedStyle(child).minWidth,
    }));
    return {
      found: true,
      rect,
      display: computed.display,
      gridTemplateColumns: computed.gridTemplateColumns,
      gap: computed.gap,
      children,
    };
  });
  console.log('\n=== HERO GRID ===');
  console.log(JSON.stringify(heroGrid, null, 2));
  
  // Check container
  const container = await page.evaluate(() => {
    const container = document.querySelector('.container');
    if (!container) return { found: false };
    const computed = getComputedStyle(container);
    const rect = container.getBoundingClientRect();
    return {
      found: true,
      rect,
      maxWidth: computed.maxWidth,
      paddingLeft: computed.paddingLeft,
      paddingRight: computed.paddingRight,
    };
  });
  console.log('\n=== CONTAINER ===');
  console.log(JSON.stringify(container, null, 2));
  
  // Check HeroNetworkBackground SVG
  const svg = await page.evaluate(() => {
    const svg = document.querySelector('svg[aria-hidden="true"]');
    if (!svg) return { found: false };
    const rect = svg.getBoundingClientRect();
    const style = svg.style;
    return {
      found: true,
      rect,
      viewBox: svg.getAttribute('viewBox'),
      preserveAspectRatio: svg.getAttribute('preserveAspectRatio'),
      style: {
        position: style.position,
        inset: style.inset,
        width: style.width,
        height: style.height,
        opacity: style.opacity,
        right: style.right,
        top: style.top,
      },
    };
  });
  console.log('\n=== HERO NETWORK BACKGROUND SVG ===');
  console.log(JSON.stringify(svg, null, 2));
  
  // Check box-sizing on all elements
  const boxSizing = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const violations = [];
    elements.forEach(el => {
      const computed = getComputedStyle(el);
      if (computed.boxSizing !== 'border-box') {
        violations.push({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          boxSizing: computed.boxSizing,
        });
      }
    });
    return { violationsCount: violations.length, violations: violations.slice(0, 20) };
  });
  console.log('\n=== BOX-SIZING VIOLATIONS ===');
  console.log(JSON.stringify(boxSizing, null, 2));
  
  // Check hero section overall
  const heroSection = await page.evaluate(() => {
    const sections = document.querySelectorAll('section');
    const hero = sections[0];
    if (!hero) return { found: false };
    const rect = hero.getBoundingClientRect();
    return {
      found: true,
      rect,
      paddingTop: getComputedStyle(hero).paddingTop,
      paddingBottom: getComputedStyle(hero).paddingBottom,
      overflow: getComputedStyle(hero).overflow,
    };
  });
  console.log('\n=== HERO SECTION ===');
  console.log(JSON.stringify(heroSection, null, 2));
  
  // Take screenshot of just the hero section
  const heroElement = await page.$('section');
  if (heroElement) {
    await heroElement.screenshot({ path: join(__dirname, 'hero-diagnose.png') });
    console.log('\nHero screenshot saved!');
  }
  
  // Also check the demo card specifically
  const demoCard = await page.evaluate(() => {
    const card = document.querySelector('[role="img"][aria-label="Gateway routing demonstration"]');
    if (!card) return { found: false };
    const rect = card.getBoundingClientRect();
    const parent = card.parentElement;
    return {
      found: true,
      rect,
      parentRect: parent ? parent.getBoundingClientRect() : null,
      maxWidth: getComputedStyle(card).maxWidth,
      width: getComputedStyle(card).width,
    };
  });
  console.log('\n=== DEMO CARD ===');
  console.log(JSON.stringify(demoCard, null, 2));
  
  await browser.close();
}

diagnose().catch(console.error);